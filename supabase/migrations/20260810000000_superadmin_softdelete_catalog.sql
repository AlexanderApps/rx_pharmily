-- ============================================================================
-- Superadmin role, soft deletion, and the formulary -> catalog workflow
-- ============================================================================
-- Three related pieces of work, all touching the same "who can do what"
-- surface, so they're in one migration:
--   1. A superadmin tier above admin (max 5, role changes gated to
--      superadmin only, superadmin inherits every admin capability
--      automatically rather than needing every policy duplicated).
--   2. Soft deletion for the main content tables — hard delete becomes a
--      superadmin-only action; everyone else's "delete" is really an
--      update that stamps deleted_at/deleted_by.
--   3. Reworking formulary_requests so approval and actually merging into
--      the product catalog are two separate, explicit steps, with the
--      product catalog gaining real audit columns.

-- ============================================================================
-- PART 1: SUPERADMIN ROLE
-- ============================================================================

-- Redefining is_admin() to also cover superadmin means every existing
-- policy already gated on is_admin() — KYC review, ad moderation, RxRFQ
-- visibility rules, the facility/org request queues, all of it — extends
-- to superadmin automatically. This is deliberate: "superadmin can do
-- anything admin can do" should not require re-auditing and duplicating
-- dozens of existing policies one at a time, which is exactly the kind of
-- change that's easy to get half-right.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_role = 'superadmin'
  );
$$;

-- account_role sits on the same profiles row a user can otherwise update
-- themselves (full_name, email, bio, ...) — RLS policies restrict which
-- ROWS an update can touch, not which COLUMNS, so without this a
-- permissive "users update own profile" policy plus a malicious direct
-- API call could let anyone self-promote. Same class of gap the KYC
-- decision columns had, closed the same way: a trigger that checks the
-- actual column being changed, not just whether the row-level policy
-- happened to allow the update through.
create or replace function public.protect_account_role_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  superadmin_count integer;
begin
  if new.account_role is distinct from old.account_role then
    if not public.is_superadmin() then
      raise exception 'Only a superadmin can change account roles.';
    end if;

    if new.account_role = 'superadmin' then
      select count(*) into superadmin_count from public.profiles where account_role = 'superadmin';
      if superadmin_count >= 5 then
        raise exception 'There can be at most 5 superadmins at a time.';
      end if;
    end if;

    -- A superadmin can step themselves down, but the platform can't be
    -- left with zero superadmins with no one left who could ever
    -- promote a new one — that's an unrecoverable state short of
    -- direct database access.
    if old.account_role = 'superadmin' and new.account_role <> 'superadmin' then
      select count(*) into superadmin_count from public.profiles where account_role = 'superadmin';
      if superadmin_count <= 1 then
        raise exception 'At least one superadmin must remain.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_profiles_account_role
  before update on public.profiles
  for each row execute function public.protect_account_role_column();

-- ============================================================================
-- PART 2: SOFT DELETION
-- ============================================================================
-- Applied here to the main content tables — products, facilities,
-- organizations, rxrfqs, donations, mediscope_requests, jobs, ads, posts.
-- This is deliberately a named subset, not literally every table in the
-- schema: join/reaction/log-style tables (facility_memberships,
-- ad_reactions, post_likes, notifications, and so on) don't carry the same
-- "someone might need this back" weight a posted RFQ or a catalog product
-- does, and soft-deleting them would mostly just add bookkeeping with no
-- real benefit. This set can grow later the same way it was built: one
-- migration adding the same three things per table.
--
-- Regular delete actions (whoever already had UPDATE rights on a row)
-- become an UPDATE that stamps deleted_at/deleted_by — nothing new to
-- grant there, the existing UPDATE policies already cover it. What
-- changes is real SQL DELETE: that's pulled back to superadmin-only (or,
-- for tables that never had a DELETE policy at all, granted to
-- superadmin for the first time — those rows were previously
-- undeletable by anyone).

alter table public.products add column deleted_at timestamptz;
alter table public.products add column deleted_by uuid references public.profiles(id);
alter table public.facilities add column deleted_at timestamptz;
alter table public.facilities add column deleted_by uuid references public.profiles(id);
alter table public.organizations add column deleted_at timestamptz;
alter table public.organizations add column deleted_by uuid references public.profiles(id);
alter table public.rxrfqs add column deleted_at timestamptz;
alter table public.rxrfqs add column deleted_by uuid references public.profiles(id);
alter table public.donations add column deleted_at timestamptz;
alter table public.donations add column deleted_by uuid references public.profiles(id);
alter table public.mediscope_requests add column deleted_at timestamptz;
alter table public.mediscope_requests add column deleted_by uuid references public.profiles(id);
alter table public.jobs add column deleted_at timestamptz;
alter table public.jobs add column deleted_by uuid references public.profiles(id);
alter table public.ads add column deleted_at timestamptz;
alter table public.ads add column deleted_by uuid references public.profiles(id);
alter table public.posts add column deleted_at timestamptz;
alter table public.posts add column deleted_by uuid references public.profiles(id);

-- --- products ---------------------------------------------------------
drop policy "products readable by authenticated users" on public.products;
create policy "products readable by authenticated users"
  on public.products for select
  to authenticated
  using (deleted_at is null or public.is_admin());
create policy "superadmin hard-deletes products"
  on public.products for delete
  to authenticated
  using (public.is_superadmin());

-- --- organizations ------------------------------------------------------
drop policy "organizations readable by authenticated users" on public.organizations;
create policy "organizations readable by authenticated users"
  on public.organizations for select
  to authenticated
  using (deleted_at is null or public.is_admin());
-- was "for all" (covering delete too) — narrowed to update/insert only so
-- a real DELETE has to go through the superadmin-only policy below
-- instead of riding along on the owner/admin grant.
drop policy "org admin updates own organization" on public.organizations;
create policy "org admin updates own organization"
  on public.organizations for update
  to authenticated
  using (admin_user_id = auth.uid() or public.is_admin())
  with check (admin_user_id = auth.uid() or public.is_admin());
drop policy "org admin deletes own organization" on public.organizations;
create policy "superadmin hard-deletes organizations"
  on public.organizations for delete
  to authenticated
  using (public.is_superadmin());

-- --- facilities -----------------------------------------------------
drop policy "facilities readable by authenticated users" on public.facilities;
create policy "facilities readable by authenticated users"
  on public.facilities for select
  to authenticated
  using (deleted_at is null or public.is_admin());
drop policy "facility owner manages own facility" on public.facilities;
create policy "facility owner manages own facility"
  on public.facilities for update
  to authenticated
  using (public.is_facility_owner(id) or public.is_admin())
  with check (public.is_facility_owner(id) or public.is_admin());
create policy "superadmin hard-deletes facilities"
  on public.facilities for delete
  to authenticated
  using (public.is_superadmin());

-- --- rxrfqs -----------------------------------------------------------
drop policy "rxrfqs visible per visibility rules, own drafts, or admin" on public.rxrfqs;
create policy "rxrfqs visible per visibility rules, own drafts, or admin"
  on public.rxrfqs for select
  to authenticated
  using (
    (deleted_at is null or public.is_admin())
    and (
      public.is_admin()
      or created_by = auth.uid()
      or public.is_facility_member(facility_id)
      or (status = 'published' and public.can_view_rxrfq(id))
    )
  );
create policy "superadmin hard-deletes rxrfqs"
  on public.rxrfqs for delete
  to authenticated
  using (public.is_superadmin());

-- --- donations ----------------------------------------------------------
drop policy "donations readable by authenticated users" on public.donations;
create policy "donations readable by authenticated users"
  on public.donations for select
  to authenticated
  using (deleted_at is null or public.is_admin());
create policy "superadmin hard-deletes donations"
  on public.donations for delete
  to authenticated
  using (public.is_superadmin());

-- --- mediscope_requests -------------------------------------------------
drop policy "mediscope requests visible per visibility rules, own, or admin" on public.mediscope_requests;
create policy "mediscope requests visible per visibility rules, own, or admin"
  on public.mediscope_requests for select
  to authenticated
  using (
    (deleted_at is null or public.is_admin())
    and (
      public.is_admin()
      or created_by = auth.uid()
      or public.is_facility_member(facility_id)
      or (status = 'published' and public.can_view_mediscope(id))
    )
  );
create policy "superadmin hard-deletes mediscope requests"
  on public.mediscope_requests for delete
  to authenticated
  using (public.is_superadmin());

-- --- jobs -----------------------------------------------------------
drop policy "open jobs public, others visible to poster or admin" on public.jobs;
create policy "open jobs public, others visible to poster or admin"
  on public.jobs for select
  to authenticated
  using ((deleted_at is null or public.is_admin()) and (status = 'open' or posted_by = auth.uid() or public.is_admin()));
-- was owner-or-admin; hard delete narrows to superadmin only, same as
-- everywhere else — owners now soft-delete via the existing update policy.
drop policy "poster deletes own job" on public.jobs;
create policy "superadmin hard-deletes jobs"
  on public.jobs for delete
  to authenticated
  using (public.is_superadmin());

-- --- ads ------------------------------------------------------------
drop policy "approved ads public, others visible to advertiser or admin" on public.ads;
create policy "approved ads public, others visible to advertiser or admin"
  on public.ads for select
  to authenticated
  using ((deleted_at is null or public.is_admin()) and (status = 'approved' or advertiser_id = auth.uid() or public.is_admin()));
create policy "superadmin hard-deletes ads"
  on public.ads for delete
  to authenticated
  using (public.is_superadmin());

-- --- posts ------------------------------------------------------------
drop policy "posts readable by authenticated users" on public.posts;
create policy "posts readable by authenticated users"
  on public.posts for select to authenticated
  using (deleted_at is null or public.is_admin());
-- was "for all" (covering delete too) — narrowed to update only.
drop policy "author manages own post" on public.posts;
create policy "author updates own post"
  on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
create policy "superadmin hard-deletes posts"
  on public.posts for delete
  to authenticated
  using (public.is_superadmin());

-- ============================================================================
-- PART 3: PRODUCT CATALOG AUDIT COLUMNS + EXTENSIBLE METADATA
-- ============================================================================

alter table public.products add column atc_code text;
alter table public.products add column description text;
alter table public.products add column created_by uuid references public.profiles(id);
alter table public.products add column created_at timestamptz not null default now();
alter table public.products add column updated_at timestamptz not null default now();
alter table public.products add column updated_by uuid references public.profiles(id);
-- Which formulary request (if any) this product originated from — the
-- audit trail from "someone asked for this" through to "here's the
-- cleaned-up catalog entry it became." Nullable: a superadmin/admin can
-- still add a product directly without going through a request at all.
alter table public.products add column source_formulary_request_id uuid;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_products_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- PART 4: FORMULARY REQUEST -> CATALOG MERGE WORKFLOW
-- ============================================================================
-- Previously a single "accept" step both approved the request AND created
-- the product in the same action — meaning whatever the requester typed
-- (inconsistent casing, "Tab Azithromycin" instead of "Azithromycin
-- 500mg Tablet", no ATC code, no description) went straight into the
-- shared catalog untouched. This splits that into two explicit steps:
-- approve (with a comment, same as before) leaves the request awaiting
-- merge — nothing appears in the catalog yet. A separate merge step is
-- where an admin actually cleans the entry up and creates the real
-- product row, or attaches it to an existing one.

alter type formulary_request_status rename value 'accepted' to 'approved';
alter type formulary_request_status add value 'merged';

alter table public.formulary_requests add column merged_at timestamptz;
alter table public.formulary_requests add column merged_by uuid references public.profiles(id);

alter table public.products
  add constraint products_source_formulary_request_id_fkey
  foreign key (source_formulary_request_id) references public.formulary_requests(id);
