-- ============================================================================
-- Ad media storage bucket
-- ============================================================================
-- ad_media.uri was, until now, just a local device file URI from the image
-- picker — meaningless to anyone but the device that picked it. Since ads
-- are public-facing content (once approved, anyone browsing the feed sees
-- them), this is arguably worse than the same bug in KYC documents: no
-- other user would ever have seen the ad's actual image or video.
--
-- Unlike kyc-documents, this bucket is PUBLIC — an approved ad's media is
-- meant to be seen by anyone, so there's no reason to gate reads behind a
-- signed URL. Uploads/deletes are still restricted to the ad's own
-- advertiser (or an admin), matching the ad_media table's own RLS.

insert into storage.buckets (id, name, public)
values ('ad-media', 'ad-media', true)
on conflict (id) do nothing;

-- Storage paths are {user_id}/{filename} — scoped to the uploading user,
-- not the ad. Media gets picked and uploaded WHILE composing the ad, before
-- it's actually submitted (before the ads row exists at all), so a path/
-- policy scheme that checked "does this ad belong to me" would always fail
-- at the one moment it's actually needed. Scoping by user instead means
-- upload can happen immediately, and the resulting public URL just gets
-- attached to the ad_media row once the ad is actually created.

create policy "ad media files publicly readable"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'ad-media');

create policy "ad media files uploaded by their owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ad-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ad media files deleted by their owner or admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ad-media'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
