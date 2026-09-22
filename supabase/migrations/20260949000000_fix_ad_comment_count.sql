-- ============================================================================
-- Fix: ad comment_count silently stops incrementing for non-advertiser comments.
-- ============================================================================
-- Same bug class as posts.comment_count (see 20260944000000) and ads'
-- own like_count/dislike_count (see 20260945000000's toggle_ad_reaction)
-- — addComment (features/ads/hooks/use-ads-data.ts) inserted the
-- comment successfully, then tried to update({ comment_count: n + 1 })
-- on the parent ad directly from the client. ads' own UPDATE policies
-- all require advertiser_id = auth.uid() or is_admin() — correct for
-- ad edits, but this same restriction also silently blocked the
-- counter update whenever the COMMENTER wasn't the ad's own
-- advertiser, which is the common case, not the exception. The
-- comment itself always saved fine and is visible to everyone per
-- ad_comments' own SELECT policy; only the count on the ad never
-- moved for anyone except the advertiser commenting on their own ad.
-- That's "the comment count on RxAds not showing for some users" —
-- not a display bug, a write that silently never happened.
--
-- Unlike posts.comments, ad_comments has no soft-delete (status/
-- deleted_at) — deletion is a real row removal per its own DELETE
-- policy, so this only needs to handle INSERT and DELETE, not the
-- status-transition cases posts' own trigger also covers.
create or replace function public.handle_ad_comment_count_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.ads set comment_count = comment_count + 1 where id = new.ad_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.ads set comment_count = greatest(comment_count - 1, 0) where id = old.ad_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists ad_comment_count_change on public.ad_comments;
create trigger ad_comment_count_change
  after insert or delete on public.ad_comments
  for each row execute function public.handle_ad_comment_count_change();

-- Backfill: recompute every ad's comment_count from what's actually in
-- ad_comments, correcting any count already left wrong by the old
-- client-side update.
update public.ads a
set comment_count = coalesce((select count(*) from public.ad_comments c where c.ad_id = a.id), 0)
where a.comment_count <> coalesce((select count(*) from public.ad_comments c where c.ad_id = a.id), 0);
