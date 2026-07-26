-- Hidden commission tracker for Eve's cut of Josh's deals (/eve).
--
-- Josh-only: one password, one owner, no dealer/salesperson scoping. Each row
-- is one settled (or in-flight) deal, with what Buyer Assist earned, what it
-- cost to get there, and Eve's agreed share of the net.
--
--   net       = commission - outgoings
--   eve_cut   = round(net * cut_percent / 100, 2)   (computed in the app/UI)
--
-- cut_percent is stored PER ROW, not as one global setting, so changing the
-- split later never rewrites what Eve was already owed on past deals. New rows
-- default to EVE_CUT_PERCENT (see api/_eve.js); Josh can override per deal.
--
-- Like every other table in the "buyerassist-web" project, RLS is on with no
-- policies, so anon/authenticated get nothing — the /api/eve/* functions reach
-- it with the service_role key alone. See api/_supabase.js / api/_eve.js.
--
-- Run once against Supabase project "buyerassist-web"
-- (xqdrwhwhuiiyfvpynyrw, ap-southeast-2). Safe to run twice (IF NOT EXISTS).

-- category splits the list in two: 'deal' is normal Buyer Assist commission;
-- 'extra' is an off-book "extra curricular" split tracked separately. Both use
-- the same net/cut maths — the tab just keeps the spicy ones apart.
CREATE TABLE IF NOT EXISTS public.eve_commissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category     text NOT NULL DEFAULT 'deal' CHECK (category IN ('deal', 'extra')),
  deal_name    text NOT NULL,
  deal_date    date,
  -- Time-of-day label, mainly for 'extra' rows (naughty-time ledger tracks
  -- when). Free text ("2:30pm", "evening"), nullable. Deal rows leave it null.
  entry_time   text,
  commission   numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission >= 0),
  outgoings    numeric(12,2) NOT NULL DEFAULT 0 CHECK (outgoings >= 0),
  cut_percent  numeric(5,2)  NOT NULL DEFAULT 50 CHECK (cut_percent >= 0 AND cut_percent <= 100),
  paid         boolean       NOT NULL DEFAULT false,
  note         text,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.eve_commissions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.eve_commissions IS
  'Private commission tracker for Eve''s share of Josh''s deals (/eve). Josh-only, service_role access via api/eve/*. net = commission - outgoings; eve_cut = net * cut_percent/100.';
