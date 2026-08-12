-- ============================================================================
-- KYC decision column protection
-- ============================================================================
-- RLS policies restrict which ROWS a query can touch, not which COLUMNS —
-- "users update own profile" (id = auth.uid()) and "admins update any
-- profile" (is_admin()) are both permissive UPDATE policies on the same
-- table, OR'd together. That means a regular user updating their own row
-- (allowed, for editing their name/phone/bio) could technically include
-- kyc_status/kyc_reviewed_at/kyc_reviewed_by/kyc_rejection_reason in that
-- same update and self-approve their own verification — the RLS policy
-- alone has no way to say "this row, but not these columns."
--
-- This trigger closes that gap at the database level: any change to a KYC
-- decision column is rejected outright unless the acting user is an admin,
-- regardless of which RLS policy technically permitted the row-level
-- update, and regardless of whether the request came through the app's
-- own UI or a direct API call.

create or replace function public.protect_kyc_decision_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  -- Non-admins are allowed exactly one thing here: submitting their own
  -- documents for review, which moves kyc_status to 'pending', stamps
  -- kyc_submitted_at, and clears any previous rejection reason. Anything
  -- else touching these columns — setting status to verified/rejected, or
  -- touching kyc_reviewed_at/kyc_reviewed_by at all — is a verification
  -- decision, and only an admin can make one.
  if new.kyc_status is distinct from old.kyc_status and new.kyc_status <> 'pending' then
    raise exception 'Only an admin can change verification status.';
  end if;

  if new.kyc_reviewed_at is distinct from old.kyc_reviewed_at
    or new.kyc_reviewed_by is distinct from old.kyc_reviewed_by then
    raise exception 'Only an admin can record a verification decision.';
  end if;

  if new.kyc_rejection_reason is distinct from old.kyc_rejection_reason
    and new.kyc_rejection_reason is not null then
    raise exception 'Only an admin can set a rejection reason.';
  end if;

  return new;
end;
$$;

create trigger protect_profiles_kyc_columns
  before update on public.profiles
  for each row execute function public.protect_kyc_decision_columns();

create trigger protect_facilities_kyc_columns
  before update on public.facilities
  for each row execute function public.protect_kyc_decision_columns();

create trigger protect_organizations_kyc_columns
  before update on public.organizations
  for each row execute function public.protect_kyc_decision_columns();
