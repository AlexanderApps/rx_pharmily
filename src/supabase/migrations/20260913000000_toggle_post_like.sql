-- ============================================================================
-- toggle_post_like — atomic, single-round-trip like toggling.
-- ============================================================================
-- Same two problems as votePoll, fixed the same way (see
-- 20260912000000_cast_poll_vote.sql for the full reasoning):
--
--   1. Performance: the old client-side flow made 3 separate,
--      sequentially-awaited requests before the UI updated at all —
--      insert/delete the like, count all likes for the post, update
--      posts.like_count — with zero visible feedback until all three
--      finished.
--
--   2. Correctness: posts' own RLS policy ("author manages own post")
--      only allows the POST'S AUTHOR to update it — including
--      like_count. The old code updated it as whichever user was
--      liking, so for anyone liking someone else's post, that update
--      silently affected zero rows under RLS. like_count was very
--      likely never actually persisting correctly except when the
--      post's own author happened to like it too.
--
-- security definer runs with the function owner's privileges rather
-- than the caller's, so the count update now succeeds regardless of
-- who's liking the post.

create or replace function public.toggle_post_like(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_already_liked boolean;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select exists(
    select 1 from public.post_likes where post_id = p_post_id and user_id = v_user_id
  ) into v_already_liked;

  if v_already_liked then
    delete from public.post_likes where post_id = p_post_id and user_id = v_user_id;
  else
    insert into public.post_likes (post_id, user_id)
    values (p_post_id, v_user_id)
    on conflict (post_id, user_id) do nothing;
  end if;

  update public.posts
  set like_count = (select count(*) from public.post_likes where post_id = p_post_id)
  where id = p_post_id;
end;
$$;

-- RLS on post_likes/posts still applies to every OTHER path into these
-- tables — this function is intentionally the only place like_count
-- gets written from a non-author's like, not a blanket relaxation of
-- the existing policies.
grant execute on function public.toggle_post_like(uuid) to authenticated;
