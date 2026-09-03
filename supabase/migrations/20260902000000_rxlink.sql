-- ============================================================================
-- RxLink — find where a medication/prescription is available.
-- ============================================================================
-- Deliberately modeled on RxHelp's consult_requests (private, one
-- requester <-> admin, no broadcast) rather than MediScope's
-- visibility-rules/multi-vendor-response model. RxLink is open to every
-- logged-in user (no facility membership required, unlike MediScope),
-- and its "one level of security" requirement — prescription images can
-- carry patient-identifying information and must never be broadcast —
-- means both the rows AND the underlying image files need to stay
-- restricted to the requester and admins only. A row-level RLS policy
-- alone isn't enough for that: the shared "app-images" bucket used
-- elsewhere in this app (lib/app-image-storage.ts) is a PUBLIC bucket —
-- its own comment says so directly ("RLS only checks the uploader") —
-- so any file uploaded there gets a permanent, world-readable URL
-- regardless of what a DB table's RLS says about the row that
-- references it. RxLink images go in their own PRIVATE bucket instead,
-- with folder-based storage RLS, and the app requests short-lived
-- signed URLs on demand rather than storing a permanent public one.

create type rxlink_status as enum ('pending', 'responded', 'closed');

create table public.rxlink_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles(id),
  comment text,
  status rxlink_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_by uuid references public.profiles(id),
  responded_at timestamptz
);

create table public.rxlink_images (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rxlink_requests(id) on delete cascade,
  -- A storage path within the private rxlink-images bucket, NOT a
  -- public URL — the app resolves this to a short-lived signed URL at
  -- display time (see lib/rxlink-image-storage.ts).
  storage_path text not null,
  -- Descriptive only, not a security boundary — both kinds sit behind
  -- the same strict access rules below. Kept distinct in case a future
  -- feature wants to treat a bare medication photo (no patient info)
  -- differently from a prescription slip (does carry patient info).
  image_type text not null default 'prescription' check (image_type in ('prescription', 'medication')),
  created_at timestamptz not null default now()
);

create table public.rxlink_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rxlink_requests(id) on delete cascade,
  responder_id uuid not null references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.rxlink_requests enable row level security;
alter table public.rxlink_images enable row level security;
alter table public.rxlink_responses enable row level security;

-- ----------------------------------------------------------------------------
-- rxlink_requests — private to the requester and admins. No broadcast,
-- no visibility-rules table, unlike RxRFQ/donations/MediScope.
-- ----------------------------------------------------------------------------
create policy "requester and admin see rxlink requests"
  on public.rxlink_requests for select
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy "any logged in user creates rxlink requests"
  on public.rxlink_requests for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "admin updates any rxlink request"
  on public.rxlink_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Mirrors the same "narrow, explicit result set" fix applied to ads:
-- the requester can only ever close their own request, never set it to
-- 'responded' themselves (that's set by the store when an admin's
-- response is inserted).
create policy "requester closes own rxlink request"
  on public.rxlink_requests for update
  to authenticated
  using (created_by = auth.uid() and status in ('pending', 'responded'))
  with check (created_by = auth.uid() and status = 'closed');

-- ----------------------------------------------------------------------------
-- rxlink_images — follows the parent request's visibility exactly.
-- ----------------------------------------------------------------------------
create policy "requester and admin see rxlink images"
  on public.rxlink_images for select
  to authenticated
  using (exists (
    select 1 from public.rxlink_requests r
    where r.id = request_id and (r.created_by = auth.uid() or public.is_admin())
  ));

create policy "requester adds images to own rxlink request"
  on public.rxlink_images for insert
  to authenticated
  with check (exists (
    select 1 from public.rxlink_requests r
    where r.id = request_id and r.created_by = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- rxlink_responses — same "response visible to both sides" shape as
-- consult_responses/pharmacist_answers; insert restricted to admins
-- only, same as those two.
-- ----------------------------------------------------------------------------
create policy "requester and admin see rxlink responses"
  on public.rxlink_responses for select
  to authenticated
  using (exists (
    select 1 from public.rxlink_requests r
    where r.id = request_id and (r.created_by = auth.uid() or public.is_admin())
  ));

create policy "admins respond to rxlink requests"
  on public.rxlink_responses for insert
  to authenticated
  with check (
    responder_id = auth.uid()
    and public.is_admin()
    and exists (select 1 from public.rxlink_requests r where r.id = request_id)
  );

-- ============================================================================
-- Private storage bucket for the images themselves.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('rxlink-images', 'rxlink-images', false)
on conflict (id) do nothing;

-- Folder-based ownership: files are uploaded under {auth.uid()}/... , so
-- the first path segment identifies the uploader. Standard Supabase
-- Storage RLS pattern.
create policy "uploader and admin read rxlink image files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'rxlink-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "users upload their own rxlink image files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'rxlink-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
