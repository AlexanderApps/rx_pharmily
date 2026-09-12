-- ============================================================================
-- Phone verification: gate "Verify Now" behind admin approval.
-- ============================================================================
-- Prelude verification costs real money per attempt — offering it for
-- ANY phone value that happens to be present (including one a person
-- just typed into a still-pending, not-yet-reviewed request, or the
-- pre-verification value that predates this whole request/review flow
-- existing at all) would let that cost be triggered before an admin
-- has ever actually looked at the number. Gating on this new column
-- means "Verify Now" only ever appears for a phone value an admin has
-- specifically approved and merged.
--
-- This is deliberately a separate concept from phone_verified_at
-- (added in 20260919000000_phone_verification.sql): phone_admin_approved
-- means "an admin reviewed and merged this exact phone value";
-- phone_verified_at means "Prelude (or the dummy provider) confirmed
-- this person actually owns it." A phone can be admin-approved but not
-- yet verified (the normal, expected in-between state), but should
-- never be verified without first being admin-approved.

alter table public.profiles add column if not exists phone_admin_approved boolean not null default false;
alter table public.facilities add column if not exists phone_admin_approved boolean not null default false;
alter table public.organizations add column if not exists phone_admin_approved boolean not null default false;

-- Extends the existing clear-on-change function/triggers rather than
-- adding parallel ones — phone_admin_approved needs to reset for
-- exactly the same reason and on exactly the same event
-- (new.phone is distinct from old.phone) that phone_verified_at
-- already does: a stamp on the OLD number says nothing about the NEW
-- one. mergeRequest() (features/profile-updates) is responsible for
-- setting phone_admin_approved back to true, via a deliberate SECOND,
-- separate update statement after the phone change itself has already
-- landed — see that function's own comment for why a single combined
-- update wouldn't work here (this same trigger would just clear the
-- value right back out within that statement).
create or replace function public.clear_phone_verification_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
    new.phone_admin_approved := false;
  end if;
  return new;
end;
$$;
