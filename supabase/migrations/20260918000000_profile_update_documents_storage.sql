-- ============================================================================
-- Profile update request supporting document storage bucket
-- ============================================================================
-- Same pattern as kyc-documents (20260805000000_kyc_storage.sql) — a
-- private bucket, ownership checked from the storage path itself
-- rather than a lookup, reusing the same can_access_kyc_storage_path
-- ownership logic since "who can act as this entity" is identical
-- here to the KYC case (the owning user/facility/organization, or an
-- admin) even though these are a conceptually different set of
-- documents (supporting evidence for a field-change request, not
-- identity verification).

insert into storage.buckets (id, name, public)
values ('profile-update-documents', 'profile-update-documents', false)
on conflict (id) do nothing;

-- Storage paths are expected in the form:
--   {entity_type}/{entity_id}/{filename}
-- — identical shape to kyc-documents, so the existing
-- can_access_kyc_storage_path function applies directly without
-- needing its own copy.

create policy "profile update documents readable by owner or admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-update-documents' and public.can_access_kyc_storage_path(name));

create policy "profile update documents uploaded by owner or admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-update-documents' and public.can_access_kyc_storage_path(name));

create policy "profile update documents deleted by owner or admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-update-documents' and public.can_access_kyc_storage_path(name));
