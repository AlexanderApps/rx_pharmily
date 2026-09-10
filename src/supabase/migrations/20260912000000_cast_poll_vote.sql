-- ============================================================================
-- cast_poll_vote — atomic, single-round-trip poll voting.
-- ============================================================================
-- Replaces a client-side flow that, for an N-option poll, made roughly
-- 2N + 2 SEPARATE, SEQUENTIALLY AWAITED network requests before the UI
-- even updated: one to record the vote, one to list the poll's options,
-- then for EACH option a separate count query followed by a separate
-- update query. For a typical 4-option poll that's 10 round trips, one
-- after another — easily 1-3+ seconds of visible lag on a real mobile
-- connection before any feedback appeared at all. This function does
-- the whole thing — toggle the vote, recount every option, write the
-- new counts — inside one database transaction, called via one RPC.
--
-- This also fixes a real, separate bug found while investigating the
-- slowness: poll_options' own RLS policy ("author manages own poll
-- options") only allows the POLL'S AUTHOR to update it. The old
-- client-side code tried to update poll_options.vote_count directly as
-- whichever user was voting — for anyone voting on a poll they didn't
-- create, that update silently affected zero rows under RLS (Postgres
-- doesn't error on an UPDATE that matches no visible rows, it just does
-- nothing). Vote counts were very likely never actually persisting
-- correctly for non-author voters at all, only appearing right if the
-- author happened to vote too. security definer here runs with the
-- function owner's privileges rather than the caller's, so the recount
-- succeeds regardless of who cast the vote.

create or replace function public.cast_poll_vote(p_poll_id uuid, p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_option_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Guards against a mismatched poll_id/option_id pair — option_id has
  -- a foreign key into poll_options, but nothing enforces that the
  -- option actually belongs to the specified poll without this check.
  if not exists (
    select 1 from public.poll_options where id = p_option_id and poll_id = p_poll_id
  ) then
    raise exception 'option % does not belong to poll %', p_option_id, p_poll_id;
  end if;

  select option_id into v_existing_option_id
  from public.poll_votes
  where poll_id = p_poll_id and user_id = v_user_id;

  if v_existing_option_id = p_option_id then
    -- Voting for your own current choice again toggles it off,
    -- matching the previous client-side delete-on-repeat behavior.
    delete from public.poll_votes where poll_id = p_poll_id and user_id = v_user_id;
  else
    insert into public.poll_votes (poll_id, user_id, option_id)
    values (p_poll_id, v_user_id, p_option_id)
    on conflict (poll_id, user_id) do update set option_id = excluded.option_id, voted_at = now();
  end if;

  -- Recount every option for this poll from the actual vote rows in one
  -- pass — same race-safety reasoning the old code already used
  -- (recounting from source rather than incrementing/decrementing a
  -- counter), just done as a single set-based UPDATE instead of N
  -- separate count-then-update round trips.
  update public.poll_options po
  set vote_count = (
    select count(*) from public.poll_votes pv
    where pv.poll_id = p_poll_id and pv.option_id = po.id
  )
  where po.poll_id = p_poll_id;
end;
$$;

-- RLS on poll_votes/poll_options still applies to every OTHER path into
-- these tables (direct client reads, an author managing their own poll's
-- options in some other screen, etc.) — this function is intentionally
-- the only place vote_count gets written from a non-author's vote, not a
-- blanket relaxation of the existing policies.
grant execute on function public.cast_poll_vote(uuid, uuid) to authenticated;
