-- ============================================================================
-- Facility membership & facility-org link requests: verification + admin-only approval
-- ============================================================================
-- Two fixes to policies that already existed:
--
-- 1. The membership-request insert policy checked that the target
--    facility was KYC-verified, but never checked the requesting user's
--    own KYC status — meaning a user with unverified KYC could already
--    successfully request to join a facility. The facility-org link
--    request policy already correctly checked both sides (facility and
--    organization); this brings the membership-request policy in line
--    with that same "both parties verified" standard.
--
-- 2. Both requests' update (approve/reject) policies currently let the
--    facility owner or organization admin decide, in addition to a
--    platform admin. For now, approval is being restricted to platform
--    admin/superadmin only — facility/org self-approval may be added
--    back later, but isn't ready yet.

drop policy "users request to join a verified facility" on public.facility_membership_requests;
create policy "verified users request to join a verified facility"
  on public.facility_membership_requests for insert
  to authenticated
  with check (
    requested_by = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.kyc_status = 'verified')
    and exists (select 1 from public.facilities f where f.id = facility_id and f.kyc_status = 'verified')
  );

drop policy "facility owner or admin decides membership requests" on public.facility_membership_requests;
create policy "admin decides membership requests"
  on public.facility_membership_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy "org admin or platform admin decides facility-org requests" on public.facility_organization_requests;
create policy "admin decides facility-org requests"
  on public.facility_organization_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
