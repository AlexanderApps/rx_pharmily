-- ============================================================================
-- Backfill phone_admin_approved for phone changes merged before this
-- column existed.
-- ============================================================================
-- mergeRequest() (features/profile-updates) only started setting
-- phone_admin_approved = true when that logic was added
-- (20260921000000_phone_admin_approval.sql) — any profile_update_request
-- that was approved and merged BEFORE that point genuinely did update
-- the entity's phone column correctly, but had no way to also set a
-- column that didn't exist yet. Without this backfill, those phone
-- numbers stay permanently stuck at phone_admin_approved = false (the
-- column's default), even though an admin actually did review and
-- merge them — exactly what "approved and merged, but can't see
-- Verify" describes.
--
-- Only marks an entity approved if its CURRENT phone value still
-- matches what was actually merged — if phone has changed again since
-- (through any path), this intentionally does nothing for that row,
-- since the clear-on-change trigger already correctly reset
-- phone_admin_approved for that newer value and it's waiting on its
-- own (new) merge.

do $$
declare
  r record;
begin
  for r in
    select distinct on (entity_id)
      entity_id,
      changes ->> 'phone' as approved_phone
    from public.profile_update_requests
    where entity_type = 'user'
      and status = 'merged'
      and changes ? 'phone'
    order by entity_id, merged_at desc nulls last, created_at desc
  loop
    update public.profiles
    set phone_admin_approved = true
    where id = r.entity_id
      and phone = r.approved_phone
      and phone_admin_approved = false;
  end loop;

  for r in
    select distinct on (entity_id)
      entity_id,
      changes ->> 'phone' as approved_phone
    from public.profile_update_requests
    where entity_type = 'facility'
      and status = 'merged'
      and changes ? 'phone'
    order by entity_id, merged_at desc nulls last, created_at desc
  loop
    update public.facilities
    set phone_admin_approved = true
    where id = r.entity_id
      and phone = r.approved_phone
      and phone_admin_approved = false;
  end loop;

  for r in
    select distinct on (entity_id)
      entity_id,
      changes ->> 'phone' as approved_phone
    from public.profile_update_requests
    where entity_type = 'organization'
      and status = 'merged'
      and changes ? 'phone'
    order by entity_id, merged_at desc nulls last, created_at desc
  loop
    update public.organizations
    set phone_admin_approved = true
    where id = r.entity_id
      and phone = r.approved_phone
      and phone_admin_approved = false;
  end loop;
end $$;
