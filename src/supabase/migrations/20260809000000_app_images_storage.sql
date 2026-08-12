-- ============================================================================
-- Shared app-images storage bucket
-- ============================================================================
-- Covers the remaining single-photo-attachment spots that were still using
-- a raw local device URI, never uploaded anywhere: MediScope request
-- photos, formulary request photos, and chat image messages. Same bug as
-- ad_media/post_media before their dedicated buckets — file:// URIs are
-- readable on-device on native, but browsers can never load a file:// URL
-- at all (a security restriction, not a config issue), so these silently
-- failed to display on web.
--
-- One shared public bucket rather than three dedicated ones — these are
-- each a single attached photo, not a media gallery feature in their own
-- right, so a dedicated bucket per feature would be more migration
-- surface for no real benefit. Paths are scoped by use-case folder plus
-- uploading user: {context}/{user_id}/{filename}.

insert into storage.buckets (id, name, public)
values ('app-images', 'app-images', true)
on conflict (id) do nothing;

create policy "app images publicly readable"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'app-images');

create policy "app images uploaded by their owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'app-images'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "app images deleted by their owner or admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'app-images'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
  );
