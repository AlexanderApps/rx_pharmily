-- ============================================================================
-- profiles: profession, derived pharmacist/PSS flags, superintendent
-- availability, and title.
-- ============================================================================
-- Four new fields, three different write-permission shapes:
--   - profession: ADMIN-ONLY. Set during KYC review, not self-reported —
--     a user setting their own profession to 'Pharmacist' would be a
--     real privilege escalation once is_pharmacist starts gating
--     anything (which is the whole reason this field exists — see
--     "useful later" in the request this migration is for). RLS alone
--     can't express "this row is yours, but not this one column" — RLS
--     is row-level by definition — so this needs a trigger.
--   - is_pharmacist / is_pss: DERIVED, not writable by anyone directly —
--     generated columns computed from profession, always in sync,
--     queryable directly in SQL (a future RLS policy or
--     role_permissions seed can reference profiles.is_pharmacist without
--     re-deriving the profession check itself).
--   - is_available_as_superintendent: SELF-TOGGLED, but only meaningful
--     (and only allowed to be set true) for an actual pharmacist —
--     technicians/MCAs being marked "available as superintendent" would
--     be a real regulatory error to allow silently, not just a data
--     quality nit given the professional/legal meaning of that title in
--     Ghanaian pharmacy practice.
--   - title: SELF-SET, no restriction — an honorific, not something
--     that affects access control.

create type user_profession as enum ('Pharmacist', 'Technician', 'MCA', 'Other');

create type user_title as enum (
  'Mr.', 'Mrs.', 'Ms.',
  'Dr. (PharmD)', 'Dr. (PhD)', 'Dr. (MD)',
  'Prof.', 'Other'
);

alter table public.profiles
  add column profession user_profession, -- nullable: unset until an admin reviews KYC and sets it
  -- coalesced to false rather than left as a bare boolean expression —
  -- profession = 'Pharmacist' evaluates to NULL, not false, for anyone
  -- whose profession is still unset (SQL's three-valued logic), and a
  -- generated column that's sometimes NULL instead of a clean
  -- true/false would silently break any future "where not is_pharmacist"
  -- style query (NOT NULL is NULL, not true).
  add column is_pharmacist boolean generated always as (coalesce(profession = 'Pharmacist', false)) stored,
  add column is_pss boolean generated always as (coalesce(profession in ('Technician', 'MCA'), false)) stored,
  add column is_available_as_superintendent boolean not null default false,
  add column title user_title;

-- ----------------------------------------------------------------------
-- Block non-admins from changing profession, whether or not they're
-- also changing other, legitimately-self-editable fields on the same
-- row in the same statement.
-- ----------------------------------------------------------------------
create or replace function public.enforce_profession_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profession is distinct from old.profession and not public.is_admin() then
    raise exception 'profession can only be set by an admin during KYC review';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profession_admin_only on public.profiles;
create trigger trg_enforce_profession_admin_only
  before update on public.profiles
  for each row
  execute function public.enforce_profession_admin_only();

-- ----------------------------------------------------------------------
-- Block setting is_available_as_superintendent = true for anyone who
-- isn't (or is no longer) a pharmacist — self-toggled is fine, but only
-- within that constraint. Using the ROW's own profession, not is_admin,
-- since this needs to hold for the pharmacist's own self-toggle, not
-- just admin-driven changes.
-- ----------------------------------------------------------------------
create or replace function public.enforce_superintendent_requires_pharmacist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_available_as_superintendent and new.profession is distinct from 'Pharmacist' then
    raise exception 'only a verified pharmacist can be marked available as superintendent';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_superintendent_requires_pharmacist on public.profiles;
create trigger trg_enforce_superintendent_requires_pharmacist
  before insert or update on public.profiles
  for each row
  execute function public.enforce_superintendent_requires_pharmacist();
