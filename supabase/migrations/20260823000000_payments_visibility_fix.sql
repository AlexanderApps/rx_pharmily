-- ============================================================================
-- Fix: payments visibility didn't match its linked ad's own visibility
-- ============================================================================
-- ads is publicly readable once approved (see "approved ads public,
-- others visible to advertiser or admin" in the initial schema) — any
-- authenticated user can see someone else's live ad. The payments select
-- policy from 20260822000000_payments_table.sql was narrower: only the
-- initiator or an admin could read a payments row at all. When a regular
-- user's fetchAds() joined payments:payment_id(*) on an approved ad they
-- didn't post, RLS silently blocked that nested read — PostgREST returns
-- null for the relation rather than erroring — and the client's
-- mapAdPaymentRow crashed on the unconditional row.id access.
--
-- Fix: a payments row is also readable by anyone who can see the ad it's
-- linked to, once that ad is approved. Payment amounts aren't more
-- sensitive than plan prices, which are already public on the plans
-- screen — this doesn't expose anything the buyer flow doesn't already
-- show. Pending/rejected ads' payment rows stay restricted to the
-- initiator and admins, same as before.

-- Wrapped in security definer, matching ad_payment_is_paid() from the
-- previous migration — this makes the check independent of whatever
-- ads' own select policy happens to require at read time, rather than a
-- plain subquery that's implicitly relying on that policy's current
-- shape staying compatible.
create or replace function public.payment_has_public_ad(p_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ads where payment_id = p_payment_id and status = 'approved'
  );
$$;

drop policy "payments visible to initiator or admin" on public.payments;
create policy "payments visible to initiator, admin, or via a public ad"
  on public.payments for select
  to authenticated
  using (
    initiated_by = auth.uid()
    or public.is_admin()
    or public.payment_has_public_ad(id)
  );
