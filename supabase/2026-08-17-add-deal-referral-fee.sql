-- SUPERSEDED 1 Sep 2026: the referral fee was removed from the dealer board.
-- Run this file anyway if you are rebuilding the database. settled_at is still
-- written and read (the detail panel shows when a deal settled), so the table
-- needs it. referral_fee_inc_gst is now unused: the column and its CHECK are
-- left in place because dropping a column is destructive and it holds no data,
-- but nothing in the app reads or writes it. See api/_supabase.js DEAL_COLUMNS.
--
-- Referral fee tracking for the KO Cars deal tracker (/dealer/ko-cars).
--
-- The fee is what KO Cars earns for sending Buyer Assist the referral, GST
-- included. It is their money, so it is shown on the board to every login,
-- dealer sessions included — the board is the record of what they are owed.
-- This is NOT Buyer Assist's own commission from the lender, which is not
-- tracked here at all.
--
--   referral_fee_inc_gst  typed in by Josh (staff role) per deal. NULL means
--                         "not agreed or not known yet", which is different
--                         from 0 — the board counts NULLs separately so a
--                         settled deal with no figure entered is visibly
--                         waiting on one rather than silently reading as nil.
--
--   settled_at            when the deal reached the "Settled" stage. Written by
--                         api/dealer/deals.js on the stage change, and cleared
--                         if the deal ever moves back off Settled. It exists
--                         because updated_at moves every time anyone touches
--                         the row, so it cannot answer "was this settled this
--                         month".
--
-- Run once against the "buyerassist-web" Supabase project
-- (xqdrwhwhuiiyfvpynyrw, ap-southeast-2). Safe to run twice (IF NOT EXISTS).
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS referral_fee_inc_gst numeric(12,2);

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS settled_at timestamptz;

-- Guard the sign at the database level, the same way the app does. Wrapped
-- because ADD CONSTRAINT has no IF NOT EXISTS in PostgreSQL.
DO $$
BEGIN
  ALTER TABLE public.deals
    ADD CONSTRAINT deals_referral_fee_inc_gst_nonneg CHECK (referral_fee_inc_gst >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: deals already sitting at Settled predate settled_at, so seed them
-- from updated_at. Only touches rows that have no value, so re-running is safe
-- and never overwrites a real settlement date.
UPDATE public.deals
   SET settled_at = updated_at
 WHERE status = 'Settled'
   AND settled_at IS NULL;

-- The month-to-date query filters on status + settled_at within one dealer.
CREATE INDEX IF NOT EXISTS deals_dealer_settled_at_idx
  ON public.deals (dealer_id, settled_at)
  WHERE status = 'Settled';

COMMENT ON COLUMN public.deals.referral_fee_inc_gst IS
  'Referral fee payable to the dealer on this deal, GST inclusive. Entered manually by Buyer Assist staff, visible to dealer logins. NULL = not agreed yet.';

COMMENT ON COLUMN public.deals.settled_at IS
  'When the deal reached the Settled stage. Set and cleared by api/dealer/deals.js on stage changes; drives the month-to-date board totals.';

-- ---------------------------------------------------------------------------
-- Only if an earlier draft of this migration was already run.
--
-- The first version of this change called the column commission_inc_gst and
-- treated it as Buyer Assist's own commission, hidden from dealer logins. That
-- was wrong: the figure Josh enters is KO Cars' referral fee. Nothing ever
-- wrote to that column (the code shipped with this file, not before it), so
-- dropping it loses nothing — but check for yourself before running it.
--
--   SELECT count(*) FROM public.deals WHERE commission_inc_gst IS NOT NULL;
--
-- If that returns 0, uncomment and run:
--
-- ALTER TABLE public.deals DROP COLUMN IF EXISTS commission_inc_gst;
