-- Broker on each KO Cars deal (/dealer/ko-cars): which Buyer Assist broker is
-- running it. Shown as a coloured badge on every row of the board.
--
-- Run once against the "buyerassist-web" Supabase project
-- (xqdrwhwhuiiyfvpynyrw, ap-southeast-2), in the SQL editor, BEFORE or right
-- after promoting the matching deploy. Safe to run twice. The app copes with
-- the column being missing (everything reads as Josh) until this has run.
--
-- Values are fixed to Josh / Jacob, mirrored by DEAL_BROKERS in api/_deals.js.
-- To add a broker later, extend both the list there and this CHECK.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS broker text NOT NULL DEFAULT 'Josh';

DO $$
BEGIN
  ALTER TABLE public.deals
    ADD CONSTRAINT deals_broker_check CHECK (broker IN ('Josh', 'Jacob'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.deals.broker IS
  'Buyer Assist broker running the deal (Josh or Jacob). Shown to dealer logins as a badge. Default Josh.';

-- Initial assignment, confirmed by Atlas 23 Oct 2026: these deals are Jacob's.
-- Matched by deal id only (no customer details in the repo). Every other deal
-- keeps the Josh default. Change any deal later from the board's broker
-- dropdown (staff and Jacob logins).
UPDATE public.deals
   SET broker = 'Jacob'
 WHERE id IN (
   '6f532716-6336-4978-aa54-e93182f9d678',
   'acab3f8a-1485-4f7a-bcc4-26860d8aab06',
   '149170d6-2fe9-4cfe-b55c-0121a6af04d1',
   'f3516c6d-023e-4437-9135-a6a8e00498b6',
   '1e9934ae-c87a-4448-841b-9d9d84af442b'
 );
