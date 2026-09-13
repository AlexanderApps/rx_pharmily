-- ============================================================================
-- Content moderation: RxRFQ, MediScope, and RxJobs requests and responses.
-- ============================================================================
-- This is deliberately NOT modeled by extending each table's own status
-- enum the way ad_status folds in 'suspended'/'banned' — those 6 enums
-- (rxrfq_status, rxrfq_response_status, mediscope_status, job_status,
-- application_status, and mediscope_responses having no status column
-- at all) are different shapes for different reasons specific to each
-- feature's own workflow, and bending all of them to also carry a
-- moderation concept would be inconsistent at best and impossible at
-- worst (mediscope_responses). A uniform, orthogonal set of columns —
-- same pattern already used for account moderation
-- (20260923000000_account_moderation.sql) — works identically across
-- all 6 regardless of what each one's own status field already means.
--
-- is_removed is intentionally simple: removed or not, no separate
-- "suspended vs banned" distinction the way accounts have — a listing
-- or response doesn't have an ongoing relationship with the platform
-- the way an account does, so there's no meaningful difference between
-- "temporarily" and "permanently" taken down here. An admin restores it
-- by clearing the same column.

alter table public.rxrfqs
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter table public.rxrfq_responses
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter table public.mediscope_requests
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter table public.mediscope_responses
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter table public.jobs
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter table public.job_applications
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

-- ----------------------------------------------------------------------
-- Audit trail — one shared, polymorphic table across all 6 content
-- types, same reasoning as account_moderation_actions: the mutable
-- is_removed columns above can only ever show current state, not "who
-- did this, when, and why" over time.
-- ----------------------------------------------------------------------

create type content_moderation_type as enum (
  'rxrfq', 'rxrfq_response', 'mediscope_request', 'mediscope_response', 'job', 'job_application'
);

create table public.content_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  content_type content_moderation_type not null,
  content_id uuid not null,
  action_type text not null check (action_type in ('removed', 'restored')),
  reason text,
  actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index content_moderation_actions_content_idx
  on public.content_moderation_actions (content_type, content_id, created_at desc);

alter table public.content_moderation_actions enable row level security;

-- Admin-only, both ways — unlike account moderation (which the
-- affected person can see their own history of), there's no equivalent
-- "owner of this RFQ" read grant here: the acting admin is also
-- reachable through the relevant request/response's own owner-visible
-- fields (is_removed, removed_reason) already, so a person whose
-- listing was removed sees THAT, not a separate audit feed only admins
-- otherwise use to coordinate moderation decisions among themselves.
create policy "admins see content moderation history"
  on public.content_moderation_actions for select
  to authenticated
  using (public.is_admin());

create policy "admins log content moderation actions"
  on public.content_moderation_actions for insert
  to authenticated
  with check (public.is_admin() and actor_id = auth.uid());
