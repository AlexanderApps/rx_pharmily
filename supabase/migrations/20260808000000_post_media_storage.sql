-- ============================================================================
-- Post media storage bucket
-- ============================================================================
-- Same bug, same fix as ad_media: post_media.uri was a local device file
-- URI, meaningless to anyone but the device that picked it — and since
-- posts are public feed content, no other user would ever have seen the
-- attached image or video. Public bucket (posts are public once created,
-- there's no approval gate the way ads have), paths scoped by uploading
-- user rather than by post id, since media is picked while composing the
-- post — before it's submitted, before the post row exists.

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

create policy "post media files publicly readable"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'post-media');

create policy "post media files uploaded by their owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post media files deleted by their owner or admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
