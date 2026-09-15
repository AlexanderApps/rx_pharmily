-- ============================================================================
-- Bookmarks: RxRFQ, MediScope, Donations, and Jobs.
-- ============================================================================
-- Two places already had a bookmark icon (rxrfq-market-details.tsx,
-- job-market-details.tsx) — both were purely local useState/in-memory
-- store state with no database backing at all, so a bookmark vanished
-- the moment you navigated away or reopened the app. This replaces
-- both with a real, persisted feature, and extends it to MediScope and
-- Donations too, for the same 4 marketplace content types this
-- session's content-moderation and share-to-chat work already covers
-- consistently.
--
-- One polymorphic table, same reasoning as content_moderation_actions:
-- a handful of rows per feature would mean a lot of near-identical
-- schema duplicated 4 times for no real benefit.
--
-- Display fields (code/title/subtitle/status) are denormalized onto
-- the bookmark row at save time — same choice already made for
-- messages.linked_entity_* — so a "My Bookmarks" screen can always
-- show something meaningful even for an item that's since closed,
-- expired, or scrolled out of whatever list originally loaded it.

create type bookmark_content_type as enum ('rxrfq', 'mediscope', 'donation', 'job');

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  content_type bookmark_content_type not null,
  content_id uuid not null,
  code text,
  title text not null,
  subtitle text,
  status text,
  created_at timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

create index bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

-- Strictly private to the person who saved it — a bookmark is a
-- personal reading-list entry, never visible to anyone else,
-- including the item's own owner or an admin.
create policy "users manage their own bookmarks"
  on public.bookmarks for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
