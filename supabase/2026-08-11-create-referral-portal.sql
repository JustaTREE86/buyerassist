-- =====================================================================
-- Referral Partner Portal — the real thing behind /portal/:slug
--
-- Run this once, in the Supabase SQL editor for project "buyerassist-web"
-- (ap-southeast-2 / Sydney). It is idempotent: safe to run twice.
--
-- WHY NEW TABLES RATHER THAN REUSING deals/dealers
-- ------------------------------------------------
-- The KO Cars board (public.deals) is vehicle-shaped: vehicle_make and
-- vehicle_model are NOT NULL, and the stage list is an asset finance one.
-- Ready Finance writes home loans, so making that table fit would mean
-- dropping the NOT NULLs that currently protect a board Charlie and Alan
-- use every day. These tables are separate so that board cannot break.
--
-- The other difference is scoping. On the KO Cars board every login sees
-- every deal. Here a referral partner must see only the deals they sent,
-- so portal_deals carries partner_id and every partner query filters on it.
--
-- SECURITY MODEL
-- --------------
-- RLS is enabled with NO policies on all four tables. That is deny-all for
-- the anon and authenticated roles, which is what the browser would ever
-- get. The only path to this data is the /api/portal/* functions using the
-- service_role key, which bypasses RLS — so each of those functions is
-- responsible for scoping its own query. See api/_portal-db.js.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Organisations — one row per brokerage running a portal.
-- ---------------------------------------------------------------------
create table if not exists public.portal_orgs (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  short_name      text,

  -- Branding. Rendered by page-portal.jsx; no code change to rebrand.
  accent          text not null default '#1F4B7F',
  logo_url        text,
  logo_white_url  text,
  domain_label    text,

  -- What this firm calls the thing on the board. KO Cars would say
  -- "Vehicle"/"Customer"; Ready Finance says "Buyer / property"/"Applicant".
  item_label      text not null default 'Deal',
  customer_label  text not null default 'Customer',

  -- The pipeline. Belongs to the firm, not to us. portal_deals.status is
  -- validated against this list by trigger (see section 5), so the database
  -- stays the real gatekeeper the way deals.status has a CHECK constraint.
  stages          text[] not null,

  active          boolean not null default true,
  created_at      timestamptz not null default now(),

  constraint portal_orgs_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint portal_orgs_stages_not_empty check (array_length(stages, 1) >= 1),
  constraint portal_orgs_stages_sane check (array_length(stages, 1) <= 40)
);

-- ---------------------------------------------------------------------
-- 2. Referral partners — the firms that send business to an org.
--
-- Who a broker's referral partners are is commercially sensitive, so this
-- list is never served to an unauthenticated request. The login screen
-- deliberately does not name one (see page-portal.jsx).
-- ---------------------------------------------------------------------
create table if not exists public.portal_partners (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.portal_orgs(id) on delete cascade,
  slug        text not null,
  name        text not null,
  kind        text,
  accent      text not null default '#2C4A6E',

  -- Switching this off kills that firm's access on their next request and
  -- on their next page poll, without touching their deals.
  active      boolean not null default true,
  created_at  timestamptz not null default now(),

  constraint portal_partners_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (org_id, slug)
);

-- ---------------------------------------------------------------------
-- 3. Deals.
--
-- subject / subject_details replace the vehicle_* columns on the KO Cars
-- table. subject is the headline ("First home buyer · Wynnum West") and
-- subject_details is the small print under it ("$720,000 budget",
-- "5% deposit, FHG"). Free text on purpose: a home loan, an equipment
-- lease and a commercial facility do not share a field list, and inventing
-- one would make this fit none of them.
-- ---------------------------------------------------------------------
create table if not exists public.portal_deals (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.portal_orgs(id) on delete cascade,

  -- Nullable: a deal can exist before it is attributed to a referrer, and
  -- an unattributed deal is visible to org staff only (never to a partner,
  -- because every partner query filters on partner_id = their own id).
  partner_id      uuid references public.portal_partners(id) on delete set null,

  subject         text not null,
  subject_details text[] not null default '{}',

  customer_name   text not null,
  customer_mobile text,
  customer_email  text,

  status          text not null,
  archived        boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      text,
  updated_by      text,

  constraint portal_deals_details_sane check (array_length(subject_details, 1) is null
                                              or array_length(subject_details, 1) <= 4),
  constraint portal_deals_contactable check (customer_mobile is not null
                                             or customer_email is not null)
);

-- ---------------------------------------------------------------------
-- 4. Notes. Insert-only by design — api/_portal-db.js has no update or
-- delete helper, because an activity history that can be rewritten is not
-- a history.
--
-- visibility = 'internal' keeps a note on the org's own board and out of
-- every partner response. Filtered server-side in listDealsForPartner,
-- never hidden in the browser.
-- ---------------------------------------------------------------------
create table if not exists public.portal_deal_notes (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.portal_deals(id) on delete cascade,
  note        text not null,
  visibility  text not null default 'all',
  created_at  timestamptz not null default now(),
  created_by  text,

  constraint portal_deal_notes_visibility check (visibility in ('all', 'internal'))
);

-- ---------------------------------------------------------------------
-- 5. Stage validation + updated_at.
--
-- The app validates the stage too (api/_portal-db.js), for a friendly error
-- before the round trip. This trigger is what makes it true.
-- ---------------------------------------------------------------------
create or replace function public.portal_deals_check_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[];
begin
  select stages into allowed from public.portal_orgs where id = new.org_id;

  if allowed is null then
    raise exception 'portal_deals: unknown org_id %', new.org_id;
  end if;

  if not (new.status = any (allowed)) then
    raise exception 'portal_deals: "%" is not a stage on this board', new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists portal_deals_status_guard on public.portal_deals;
create trigger portal_deals_status_guard
  before insert or update of status, org_id on public.portal_deals
  for each row execute function public.portal_deals_check_status();

-- A partner_id must belong to the same org as the deal. Without this, a bug
-- in the API could attribute a Ready Finance deal to another firm's partner
-- and hand it to the wrong reader.
create or replace function public.portal_deals_check_partner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  partner_org uuid;
begin
  if new.partner_id is null then
    return new;
  end if;

  select org_id into partner_org from public.portal_partners where id = new.partner_id;

  if partner_org is null or partner_org <> new.org_id then
    raise exception 'portal_deals: partner % does not belong to org %', new.partner_id, new.org_id;
  end if;

  return new;
end;
$$;

drop trigger if exists portal_deals_partner_guard on public.portal_deals;
create trigger portal_deals_partner_guard
  before insert or update of partner_id, org_id on public.portal_deals
  for each row execute function public.portal_deals_check_partner();

create or replace function public.portal_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portal_deals_touch on public.portal_deals;
create trigger portal_deals_touch
  before update on public.portal_deals
  for each row execute function public.portal_touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. Indexes — the board query is "this org, not archived, newest first",
-- and the partner board narrows that by partner_id.
-- ---------------------------------------------------------------------
create index if not exists portal_deals_org_idx
  on public.portal_deals (org_id, archived, updated_at desc);
create index if not exists portal_deals_partner_idx
  on public.portal_deals (partner_id, archived, updated_at desc);
create index if not exists portal_deal_notes_deal_idx
  on public.portal_deal_notes (deal_id, created_at desc);
create index if not exists portal_partners_org_idx
  on public.portal_partners (org_id, active);

-- ---------------------------------------------------------------------
-- 7. Row Level Security — deny-all. No policies on purpose.
--
-- Every read and write goes through the service_role key held only by the
-- Vercel functions. If that key ever leaked, rotating it in Supabase locks
-- everything out again in one step.
-- ---------------------------------------------------------------------
alter table public.portal_orgs        enable row level security;
alter table public.portal_partners    enable row level security;
alter table public.portal_deals       enable row level security;
alter table public.portal_deal_notes  enable row level security;

revoke all on public.portal_orgs       from anon, authenticated;
revoke all on public.portal_partners   from anon, authenticated;
revoke all on public.portal_deals      from anon, authenticated;
revoke all on public.portal_deal_notes from anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Seed — Ready Finance Group and their four kinds of referrer.
--
-- The org and the partner firms are real. NO DEALS ARE SEEDED. This is a
-- live portal holding real client information, so it starts empty and Josh
-- loads Ready Finance's actual referrals into it. The invented board lives
-- at /portal-demo/ready-finance and stays there.
--
-- The four partner firms below are the ones named on that demo. Replace the
-- names with Ready Finance's actual referrers before handing out logins —
-- update, do not insert, so partner_id on any existing deal survives.
-- ---------------------------------------------------------------------
insert into public.portal_orgs (slug, name, short_name, accent, logo_url, logo_white_url, domain_label, item_label, customer_label, stages)
values (
  'ready-finance',
  'Ready Finance Group',
  'Ready Finance',
  '#1681B7',
  '/assets/ready-finance-logo.png',
  '/assets/ready-finance-logo-white.png',
  'partners.readyfinance.com.au',
  'Buyer / property',
  'Applicant',
  array[
    'New Referral',
    'Contacting Buyer',
    'Fact Find Booked',
    'Documents Required',
    'Pre-Approval Submitted',
    'Pre-Approved',
    'Property Found',
    'Full Application',
    'Valuation Ordered',
    'Formal Approval',
    'Unconditional',
    'Settled',
    'On Hold',
    'Fell Through'
  ]
)
on conflict (slug) do update set
  name           = excluded.name,
  short_name     = excluded.short_name,
  accent         = excluded.accent,
  logo_url       = excluded.logo_url,
  logo_white_url = excluded.logo_white_url,
  domain_label   = excluded.domain_label,
  item_label     = excluded.item_label,
  customer_label = excluded.customer_label,
  stages         = excluded.stages;

insert into public.portal_partners (org_id, slug, name, kind, accent)
select o.id, v.slug, v.name, v.kind, v.accent
from public.portal_orgs o,
     (values
       ('coastline', 'Coastline Property Group',     'Real estate agency', '#0E6E6E'),
       ('ashgrove',  'Ashgrove Buyers Advocacy',     'Buyers advocate',    '#2F6B4F'),
       ('meridian',  'Meridian Conveyancing',        'Conveyancer',        '#6B3A5B'),
       ('pinnacle',  'Pinnacle Accounting Partners', 'Accountant',         '#2C4A6E')
     ) as v(slug, name, kind, accent)
where o.slug = 'ready-finance'
on conflict (org_id, slug) do update set
  name   = excluded.name,
  kind   = excluded.kind,
  accent = excluded.accent;

-- ---------------------------------------------------------------------
-- Check it landed.
-- ---------------------------------------------------------------------
select o.slug, o.name, array_length(o.stages, 1) as stages, count(p.id) as partners
from public.portal_orgs o
left join public.portal_partners p on p.org_id = o.id
group by o.slug, o.name, o.stages;
