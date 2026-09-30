-- ============================================================================
-- Rating system: users, facilities, organizations.
-- ============================================================================
-- One polymorphic table rather than three near-identical ones — the shape
-- (who rated what, what score, optional comment) is identical across all
-- three entity kinds, and a shared table means a shared trigger and a
-- shared client-side data layer instead of three parallel copies of each.
create type rating_entity_type as enum ('user', 'facility', 'organization');

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  entity_type rating_entity_type not null,
  entity_id uuid not null,
  rated_by uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score >= 1 and score <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One rating per (rater, entity) — rating again means updating the
  -- existing row, not stacking a second one.
  unique (entity_type, entity_id, rated_by),
  -- Rating yourself doesn't mean anything. This only catches the 'user'
  -- case at the DB level (facility/organization self-rating — a member
  -- rating their own facility — would need a join to facility_memberships/
  -- organizations to check, which a plain check constraint can't express;
  -- that's handled client-side instead, same as it is for a few other
  -- "can't act on your own entity" rules already in this app).
  check (not (entity_type = 'user' and entity_id = rated_by))
);

create index ratings_entity_idx on public.ratings (entity_type, entity_id);

alter table public.ratings enable row level security;

create trigger touch_ratings_updated_at
  before update on public.ratings
  for each row execute function public.touch_updated_at();

-- Readable by anyone authenticated — display of ratings is gated by the
-- show_ratings app setting on the client, not by RLS; the setting is
-- about whether the UI shows them, not about data access.
create policy "ratings readable by authenticated users"
  on public.ratings for select
  to authenticated
  using (true);

create policy "users manage their own ratings"
  on public.ratings for all
  to authenticated
  using (rated_by = auth.uid())
  with check (rated_by = auth.uid());

create policy "admins manage any rating"
  on public.ratings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- Denormalized aggregates on each rated entity table.
-- ============================================================================
-- Avoids fetching every individual rating just to show a summary on a
-- profile card or a search result — the common case by far.
alter table public.profiles add column avg_rating numeric(3, 2) not null default 0;
alter table public.profiles add column rating_count integer not null default 0;
alter table public.facilities add column avg_rating numeric(3, 2) not null default 0;
alter table public.facilities add column rating_count integer not null default 0;
alter table public.organizations add column avg_rating numeric(3, 2) not null default 0;
alter table public.organizations add column rating_count integer not null default 0;

-- Recomputes fresh from the ratings table on every change, rather than
-- incrementally maintaining a running average — simpler, avoids
-- floating-point drift over many updates, and a single entity's rating
-- count is never large enough for this to be a real cost.
create or replace function public.handle_rating_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_type rating_entity_type;
  target_id uuid;
  new_avg numeric(3, 2);
  new_count integer;
begin
  -- new is unassigned on DELETE and old is unassigned on INSERT/UPDATE
  -- — referencing either when unassigned raises an error, it doesn't
  -- evaluate to null, so this has to branch on tg_op explicitly rather
  -- than coalesce(new.x, old.x) (which would fail on DELETE).
  if tg_op = 'DELETE' then
    target_type := old.entity_type;
    target_id := old.entity_id;
  else
    target_type := new.entity_type;
    target_id := new.entity_id;
  end if;

  select coalesce(round(avg(score)::numeric, 2), 0), count(*)
    into new_avg, new_count
    from public.ratings
    where entity_type = target_type and entity_id = target_id;

  if target_type = 'user' then
    update public.profiles set avg_rating = new_avg, rating_count = new_count where id = target_id;
  elsif target_type = 'facility' then
    update public.facilities set avg_rating = new_avg, rating_count = new_count where id = target_id;
  elsif target_type = 'organization' then
    update public.organizations set avg_rating = new_avg, rating_count = new_count where id = target_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger rating_change
  after insert or delete or update of score on public.ratings
  for each row execute function public.handle_rating_change();

-- ============================================================================
-- App setting: whether ratings are shown anywhere in the app.
-- ============================================================================
-- A master on/off for the whole feature (display and the ability to
-- submit a new one both follow this) rather than a narrower "hide the
-- number but still let people rate" — showing a "rate this" entry point
-- for a number nobody can see would be confusing on its own.
insert into public.app_settings (key, value) values
  ('show_ratings', 'true'::jsonb)
on conflict (key) do nothing;
