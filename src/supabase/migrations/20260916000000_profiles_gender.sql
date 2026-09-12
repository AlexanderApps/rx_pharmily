-- ============================================================================
-- profiles: add gender.
-- ============================================================================
-- Same pattern as title (20260910000000_profiles_profession_title.sql) —
-- a nullable enum, self-set by the user with no admin restriction,
-- unlike profession which is admin-only.

create type user_gender as enum ('Male', 'Female', 'Other', 'Prefer not to say');

alter table public.profiles
  add column gender user_gender;
