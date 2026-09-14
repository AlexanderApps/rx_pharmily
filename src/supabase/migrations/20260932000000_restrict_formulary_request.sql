-- ============================================================================
-- Restrict submitting a formulary request to PSS and Pharmacist tiers.
-- ============================================================================
-- formulary.request was added to the permission catalog in
-- 20260931000000 but never actually enforced anywhere — the RLS insert
-- policy allowed any authenticated user, and no UI screen checked the
-- permission. This closes both: the UI check was added in
-- app/formulary/index.tsx this same turn, and this migration is the
-- actual security boundary behind it.
--
-- Deliberately scoped to the insert (request) policy only, per this
-- turn's request — the existing select policy ("users see their own
-- formulary requests") is untouched, so someone who submitted a
-- request before losing verified status can still see it.
drop policy if exists "users submit formulary requests" on public.formulary_requests;
create policy "verified pss/pharmacist submit formulary requests"
  on public.formulary_requests for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.get_user_base_role(auth.uid()) in ('verified_pss', 'verified_pharmacist', 'admin', 'superadmin')
  );
