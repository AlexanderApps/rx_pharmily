-- ============================================================================
-- toggle_ad_reaction — atomic, single-round-trip like/dislike toggling.
-- ============================================================================
-- Same two problems as toggle_post_like (see that migration for the
-- full reasoning), found in ads' own reaction flow:
--
--   1. Performance: the old client-side flow made 4 separate,
--      sequentially-awaited requests before the UI updated at all —
--      insert/delete/upsert the reaction, count likes, count dislikes,
--      update ads.like_count/dislike_count — with zero visible
--      feedback until all four finished. This is what "liking and
--      disliking RxAds takes a little bit long" was.
--
--   2. Correctness: ads' own UPDATE policies ("advertiser manages own
--      ad", the payments-aware variant, and the pending/rejected-only
--      self-edit one) all require advertiser_id = auth.uid() or
--      is_admin(). The old code updated like_count/dislike_count as
--      whichever user was reacting — for anyone reacting to someone
--      else's ad (the common case, not the exception), that update
--      silently affected zero rows under RLS. Same bug class already
--      found and fixed for posts.comment_count.
--
-- security definer runs with the function owner's privileges rather
-- than the caller's, so the count update now succeeds regardless of
-- who's reacting — the actual fix for both problems, not two separate
-- patches.
create or replace function public.toggle_ad_reaction(p_ad_id uuid, p_reaction reaction_type)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current reaction_type;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select reaction into v_current from public.ad_reactions where ad_id = p_ad_id and user_id = v_user_id;

  if v_current = p_reaction then
    -- Tapping the same reaction again removes it — this is the
    -- "toggle" half; ad_reactions' own primary key (ad_id, user_id)
    -- already guarantees at most one reaction per person per ad, so
    -- there's nothing else to clean up.
    delete from public.ad_reactions where ad_id = p_ad_id and user_id = v_user_id;
  else
    -- Covers both "no prior reaction" and "switching from the other
    -- one" in a single statement.
    insert into public.ad_reactions (ad_id, user_id, reaction)
    values (p_ad_id, v_user_id, p_reaction)
    on conflict (ad_id, user_id) do update set reaction = excluded.reaction;
  end if;

  update public.ads
  set
    like_count = (select count(*) from public.ad_reactions where ad_id = p_ad_id and reaction = 'like'),
    dislike_count = (select count(*) from public.ad_reactions where ad_id = p_ad_id and reaction = 'dislike')
  where id = p_ad_id;
end;
$$;

-- RLS on ad_reactions/ads still applies to every OTHER path into these
-- tables — this function is intentionally the only place
-- like_count/dislike_count get written from a non-advertiser's
-- reaction, not a blanket relaxation of the existing policies.
grant execute on function public.toggle_ad_reaction(uuid, reaction_type) to authenticated;

-- Backfill: every existing ad's like_count/dislike_count get
-- recalculated from an actual count of its reaction rows, correcting
-- whatever drift already happened before this function existed — the
-- function alone only prevents new drift going forward.
update public.ads a
set
  like_count = coalesce((select count(*) from public.ad_reactions r where r.ad_id = a.id and r.reaction = 'like'), 0),
  dislike_count = coalesce((select count(*) from public.ad_reactions r where r.ad_id = a.id and r.reaction = 'dislike'), 0);
