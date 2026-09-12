-- ============================================================================
-- Fix trg_enforce_superintendent_requires_pharmacist: stop blocking
-- unrelated profile updates for users already in an inconsistent state.
-- ============================================================================
-- The original trigger re-validated is_available_as_superintendent vs
-- profession on EVERY update to a profiles row, not just when
-- is_available_as_superintendent itself was actually changing. That's a
-- real problem because nothing here is immutable: setUserProfession (the
-- admin-only path that changes profession, e.g. during a KYC re-review)
-- never touched is_available_as_superintendent, so a user who was once a
-- verified pharmacist with this flag on could later have their
-- profession changed to something else by an admin, leaving their row
-- in exactly the state new.is_available_as_superintendent = true AND
-- new.profession <> 'Pharmacist' — permanently, since nothing ever unset
-- the flag.
--
-- From that point on, EVERY future save to that profile — including
-- completely unrelated fields like license_number, bio, or phone, since
-- the app's own updateUserProfile always resends the full profile
-- payload — would hit this trigger and fail the whole UPDATE statement
-- outright. The person editing their profile would see no visible error
-- (the app only logged it to the console) and the screen would exit
-- edit mode as if the save succeeded, while nothing had actually
-- persisted. That silent, unrelated-field failure is what actually
-- explained "license number isn't saving."
--
-- The fix: only enforce this when is_available_as_superintendent is
-- genuinely transitioning to true (an insert, or a change from
-- false/null) — not on every update where it's already true and
-- untouched. A row that's already in the inconsistent state can still
-- be updated for anything else; setUserProfession below is what
-- actually prevents new inconsistencies and heals existing ones going
-- forward.

create or replace function public.enforce_superintendent_requires_pharmacist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_available_as_superintendent
     and new.profession is distinct from 'Pharmacist'
     and (tg_op = 'INSERT' or old.is_available_as_superintendent is distinct from true)
  then
    raise exception 'only a verified pharmacist can be marked available as superintendent';
  end if;
  return new;
end;
$$;

-- Self-heals the root cause going forward: whenever an admin changes a
-- user's profession away from Pharmacist, their superintendent
-- availability is cleared in the same statement, so the inconsistent
-- state this migration works around can no longer be created at all.
create or replace function public.clear_superintendent_flag_on_profession_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profession is distinct from 'Pharmacist' and new.is_available_as_superintendent then
    new.is_available_as_superintendent := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clear_superintendent_on_profession_change on public.profiles;
create trigger trg_clear_superintendent_on_profession_change
  before update on public.profiles
  for each row
  when (new.profession is distinct from old.profession)
  execute function public.clear_superintendent_flag_on_profession_change();
