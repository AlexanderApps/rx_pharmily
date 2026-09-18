-- ============================================================================
-- Fix: post comment_count silently stops incrementing for non-author comments.
-- ============================================================================
-- addComment (features/posts/hooks/use-posts-data.ts) inserted the
-- comment successfully, then tried to update({ comment_count: n + 1 })
-- on the parent post directly from the client. posts' own UPDATE
-- policy requires author_id = auth.uid() or is_admin() — correct for
-- post edits, but this same policy also silently blocked the counter
-- update whenever the COMMENTER wasn't the POST's own author, which is
-- the common case, not the exception. The comment itself always saved
-- fine; only the count on the post never moved. That's "shows 0 when
-- there are comments" exactly — not a display bug, a write that never
-- happened.
--
-- Fixed server-side with a trigger (security definer, so it isn't
-- subject to that same author-only restriction) rather than by
-- widening posts' own UPDATE policy, which would let any authenticated
-- user modify a post's other columns too, not just its comment count.
create or replace function public.handle_comment_count_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'active' and new.deleted_at is null then
      update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    -- Only status/deleted_at transitions change what's actually
    -- visible (matches "comments readable by authenticated users"'s
    -- own visibility rule) — an edit to a comment's text, for
    -- instance, shouldn't touch the count either way.
    if (old.status = 'active' and old.deleted_at is null)
       and not (new.status = 'active' and new.deleted_at is null) then
      update public.posts set comment_count = greatest(0, comment_count - 1) where id = new.post_id;
    elsif not (old.status = 'active' and old.deleted_at is null)
          and (new.status = 'active' and new.deleted_at is null) then
      update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.status = 'active' and old.deleted_at is null then
      update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comment_count_change on public.comments;
create trigger trg_comment_count_change
  after insert or update or delete on public.comments
  for each row execute function public.handle_comment_count_change();

-- Backfill: every existing post's comment_count gets recalculated from
-- an actual count of its visible comments, correcting whatever drift
-- already happened before this trigger existed — the trigger alone
-- only prevents new drift going forward, it doesn't retroactively fix
-- counts that are already wrong.
update public.posts p
set comment_count = coalesce((
  select count(*) from public.comments c
  where c.post_id = p.id and c.status = 'active' and c.deleted_at is null
), 0);
