-- =====================================================================
-- Referral Partner Portal, part 2 — the brokerage runs its own partners,
-- and a partner can write back.
--
-- Run once in the Supabase SQL editor for "buyerassist-web" AFTER
-- 2026-08-11-create-referral-portal.sql. Idempotent: safe to run twice.
--
-- WHAT CHANGES AND WHY
-- --------------------
-- 1. Partner credentials move out of environment variables and into this
--    table, as a hash of a generated access code.
--
--    The first cut gave every referral firm its own env var
--    (RF_PORTAL_COASTLINE_PASSWORD and so on). That works exactly as long
--    as Buyer Assist is the only party who can add a firm, because setting
--    an env var means a Vercel deploy. Ben needs to add his own referrers,
--    so the credential has to be something the running app can mint.
--
--    Stored as a plain SHA-256 rather than a slow KDF on purpose. The code
--    is generated with ~58 bits of entropy from a 30-character alphabet, so
--    there is no dictionary to attack and nothing for bcrypt-style work
--    factors to defend. What a single deterministic hash buys is that
--    sign-in is one indexed lookup instead of a per-row comparison against
--    every partner on the board. A per-row salt would force that N-way scan
--    and defend against an attack this secret was never open to.
--
--    The hash is over 'portal:<org_id>:<code>', so the same code under two
--    brokerages produces two different hashes and cannot collide.
--
-- 2. Notes gain author_role. A partner can now add a note, which is the
--    whole point of a portal that replaces phone calls: the referrer asks
--    "any news on the valuation?" in the same place they read the answer.
--    The column is what lets the board show a message from a referrer
--    differently from a staff update.
--
--    A partner note is always visibility = 'all'. It is their own message
--    on their own deal, so there is no such thing as one they cannot see,
--    and the trigger below refuses the combination outright rather than
--    trusting the API to never send it.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Partner rows carry their own credential and a contact.
-- ---------------------------------------------------------------------
alter table public.portal_partners
  add column if not exists contact_name     text,
  add column if not exists contact_email    text,
  add column if not exists access_code_hash text,
  add column if not exists code_set_at      timestamptz,
  add column if not exists created_by       text;

comment on column public.portal_partners.access_code_hash is
  'sha256(''portal:<org_id>:<normalised code>''). The code itself is shown once, '
  'at the moment it is generated, and is not recoverable from here.';

-- Two partners can never share a code. Partial, because most rows during
-- the transition still have no code and NULLs must not collide.
create unique index if not exists portal_partners_code_idx
  on public.portal_partners (access_code_hash)
  where access_code_hash is not null;

-- ---------------------------------------------------------------------
-- 2. Notes know who wrote them: the brokerage, or the referring firm.
-- ---------------------------------------------------------------------
alter table public.portal_deal_notes
  add column if not exists author_role text not null default 'staff';

alter table public.portal_deal_notes
  drop constraint if exists portal_deal_notes_author_role;
alter table public.portal_deal_notes
  add constraint portal_deal_notes_author_role
  check (author_role in ('staff', 'partner'));

-- A partner note that was internal would be a note its own author could not
-- read back, because every partner query filters visibility = 'all'. The API
-- forces 'all' for a partner; this is the backstop that makes it true.
create or replace function public.portal_notes_check_author()
returns trigger
language plpgsql
as $$
begin
  if new.author_role = 'partner' and new.visibility <> 'all' then
    raise exception 'portal_deal_notes: a partner note cannot be internal';
  end if;
  return new;
end;
$$;

drop trigger if exists portal_notes_author_guard on public.portal_deal_notes;
create trigger portal_notes_author_guard
  before insert or update of author_role, visibility on public.portal_deal_notes
  for each row execute function public.portal_notes_check_author();

-- ---------------------------------------------------------------------
-- 3. The four seeded partner firms are PLACEHOLDERS.
--
-- Coastline, Ashgrove, Meridian and Pinnacle were invented for the sales
-- demo at /portal-demo/ready-finance. They are not Ready Finance's actual
-- referrers. They are left in place rather than deleted here because that
-- is now a decision the brokerage makes for itself: the Referral partners
-- panel on the board removes a firm with no deals in one click, and
-- deactivates one that has deals.
--
-- If you would rather clear them before handing the portal over, run:
--
--   delete from public.portal_partners p
--   using public.portal_orgs o
--   where p.org_id = o.id
--     and o.slug = 'ready-finance'
--     and p.slug in ('coastline', 'ashgrove', 'meridian', 'pinnacle')
--     and not exists (select 1 from public.portal_deals d where d.partner_id = p.id);
--
-- Note that re-running the FIRST migration re-creates them.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Check it landed.
-- ---------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_name = 'portal_partners'
      and column_name in ('contact_name', 'contact_email', 'access_code_hash', 'code_set_at', 'created_by')
  ) as partner_columns_added,          -- expect 5
  (select count(*) from information_schema.columns
    where table_name = 'portal_deal_notes' and column_name = 'author_role'
  ) as note_column_added,              -- expect 1
  (select count(*) from public.portal_partners) as partners;
