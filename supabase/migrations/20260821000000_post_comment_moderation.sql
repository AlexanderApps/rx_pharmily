-- ============================================================================
-- Post & comment moderation: suspend + remove (soft-delete)
-- ============================================================================
-- Two distinct, independent mechanisms, matching how ads already model
-- this:
--   - "suspended" is a status value — the content still exists, is
--     still owned by its author, and can be reinstated. Hidden from
--     the public feed while suspended, but still visible to its
--     author (so they know it was suspended, not just vanished) and
--     to admins (for review).
--   - "removed" reuses the soft-delete pattern already used for
--     products/facilities/organizations/rxrfqs/donations/
--     mediscope_requests/jobs/ads/posts — posts already has
--     deleted_at/deleted_by from an earlier migration; comments gets
--     the same two columns added here, since it never had any
--     moderation mechanism at all before this.
--
-- These are independent: a post can be suspended without being
-- removed, or removed without ever having been suspended.

create type post_status as enum ('active', 'suspended');
alter table public.posts add column status post_status not null default 'active';

create type comment_status as enum ('active', 'suspended');
alter table public.comments add column status comment_status not null default 'active';
alter table public.comments add column deleted_at timestamptz;
alter table public.comments add column deleted_by uuid references public.profiles(id);

-- Posts: the existing "posts readable by authenticated users" select
-- policy already hides deleted_at posts from non-admins — extended
-- here to also hide suspended ones, except from the post's own author
-- (so a suspended post doesn't just silently disappear on them) and
-- admins (for review/reinstatement). The existing "author updates own
-- post" policy already allows admin updates for any column, so no new
-- update policy is needed for posts — setting status or deleted_at/
-- deleted_by already works through it.
drop policy "posts readable by authenticated users" on public.posts;
create policy "posts readable by authenticated users"
  on public.posts for select
  to authenticated
  using (
    (deleted_at is null and status = 'active')
    or author_id = auth.uid()
    or public.is_admin()
  );

-- Comments: same visibility shape as posts. Comments never had an
-- update policy at all before this — the existing delete policy
-- (author or admin, hard delete) stays as-is; this adds the separate
-- ability for an admin to suspend or soft-delete a comment without
-- removing it outright.
drop policy "comments readable by authenticated users" on public.comments;
create policy "comments readable by authenticated users"
  on public.comments for select
  to authenticated
  using (
    (deleted_at is null and status = 'active')
    or author_id = auth.uid()
    or public.is_admin()
  );

create policy "admin moderates comments"
  on public.comments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
