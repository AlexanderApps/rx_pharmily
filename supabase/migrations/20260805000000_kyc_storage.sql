-- ============================================================================
-- KYC document storage bucket
-- ============================================================================
-- The kyc_documents table's image_uri column was, until now, just whatever
-- local device file URI the picker returned — meaningless to anyone but
-- the device that picked it, which means an admin reviewing on their own
-- device literally couldn't see what was submitted. This bucket is where
-- the actual files now live; image_uri stores the resulting storage path.
--
-- Private bucket — KYC documents are sensitive identity documents, not
-- public files. Access is via the same entity-ownership rule already used
-- for the kyc_documents table's own RLS: the owning user/facility/org, or
-- an admin.

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- Storage paths are expected in the form:
--   {entity_type}/{entity_id}/{filename}
-- e.g. "facility/3f2a.../facility-permit.pdf" — this lets the policies
-- below check ownership directly from the path without a extra lookup.

create or replace function public.can_access_kyc_storage_path(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  path_entity_type text;
  path_entity_id uuid;
begin
  path_entity_type := split_part(object_name, '/', 1);
  path_entity_id := nullif(split_part(object_name, '/', 2), '')::uuid;

  if path_entity_id is null then
    return false;
  end if;

  return
    public.is_admin()
    or (path_entity_type = 'user' and path_entity_id = auth.uid())
    or (path_entity_type = 'facility' and public.is_facility_member(path_entity_id))
    or (path_entity_type = 'organization' and public.is_organization_admin(path_entity_id));
end;
$$;

create policy "kyc document files readable by owner or admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'kyc-documents' and public.can_access_kyc_storage_path(name));

create policy "kyc document files uploaded by owner or admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'kyc-documents' and public.can_access_kyc_storage_path(name));

create policy "kyc document files deleted by owner or admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'kyc-documents' and public.can_access_kyc_storage_path(name));
