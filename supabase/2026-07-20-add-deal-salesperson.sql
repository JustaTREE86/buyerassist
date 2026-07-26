-- Adds the column that lets a KO Cars deal be scoped to one salesperson
-- (Alan or Charlie), so their dealer logins can each be filtered to just
-- their own deals. See api/_dealer-config.js and api/_supabase.js.
--
-- Nullable, no CHECK constraint on purpose: the roster of who can log in
-- changes more often than deal stages do, so it's validated at the app layer
-- (see MAX.salesperson in api/_deals.js) rather than pinned in the schema.
-- An unassigned deal (salesperson IS NULL) is only visible to Buyer Assist
-- staff, never to a scoped dealer login.
--
-- Run once against the "buyerassist-web" Supabase project
-- (xqdrwhwhuiiyfvpynyrw, ap-southeast-2). Safe to run twice (IF NOT EXISTS).
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS salesperson text;

COMMENT ON COLUMN public.deals.salesperson IS
  'Which KO Cars salesperson this deal belongs to (matches a name in api/_dealer-config.js). NULL = unassigned, visible to staff only.';
