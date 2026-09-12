-- ============================================================================
-- Phone number verification — attribute verification (confirming the
-- phone already stored on a profile/facility/organization is actually
-- owned by that entity), not a sign-in method. Standalone and optional
-- anytime, not gated behind KYC.
-- ============================================================================

alter table public.profiles add column if not exists phone_verified_at timestamptz;
alter table public.facilities add column if not exists phone_verified_at timestamptz;
alter table public.organizations add column if not exists phone_verified_at timestamptz;

-- A verified stamp on the OLD number doesn't prove ownership of a NEW
-- one — this auto-clears phone_verified_at whenever phone actually
-- changes, regardless of which path changed it (this form's own save,
-- or a merged profile_update_requests change), same reasoning as the
-- superintendent-flag trigger from the profile_update_requests work.
create or replace function public.clear_phone_verification_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clear_phone_verification on public.profiles;
create trigger trg_clear_phone_verification
  before update on public.profiles
  for each row
  when (new.phone is distinct from old.phone)
  execute function public.clear_phone_verification_on_change();

drop trigger if exists trg_clear_phone_verification on public.facilities;
create trigger trg_clear_phone_verification
  before update on public.facilities
  for each row
  when (new.phone is distinct from old.phone)
  execute function public.clear_phone_verification_on_change();

drop trigger if exists trg_clear_phone_verification on public.organizations;
create trigger trg_clear_phone_verification
  before update on public.organizations
  for each row
  when (new.phone is distinct from old.phone)
  execute function public.clear_phone_verification_on_change();

-- OTP codes — deliberately NOT delegated to a provider-managed OTP
-- product (e.g. Twilio Verify). All of this logic (generation, hashing,
-- expiry, attempt limiting, rate limiting) lives here in the app's own
-- backend so switching SMS providers later only ever means swapping
-- which provider actually sends the text message — never touching the
-- verification logic itself. See supabase/functions/phone-verification/
-- sms-provider.ts for the swappable send-only abstraction this exists
-- to support.
create table public.phone_otp_codes (
  id uuid primary key default gen_random_uuid(),
  entity_type profile_update_entity_type not null,
  entity_id uuid not null,
  phone text not null,
  -- SHA-256 hex digest, never the raw code — same reasoning as never
  -- storing a plain password. A short expiry limits how much a leak of
  -- this table would actually be worth to an attacker regardless.
  code_hash text not null,
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index phone_otp_codes_entity_idx on public.phone_otp_codes (entity_type, entity_id, created_at desc);

alter table public.phone_otp_codes enable row level security;
-- Deliberately zero policies for authenticated/anon — this table is
-- only ever touched by the phone-verification Edge Function, which
-- uses the service role key and so bypasses RLS entirely. A client
-- reading or writing OTP rows directly (even its own) would defeat the
-- attempt-limiting and expiry this table exists to enforce.
