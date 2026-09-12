-- ============================================================================
-- Phone verification: provider-agnostic rate-limit log.
-- ============================================================================
-- phone_otp_codes (20260919000000_phone_verification.sql) stored both
-- the OTP itself and doubled as the rate-limit log — that worked when
-- there was only ever one kind of provider (one that needed this app to
-- generate/store/validate its own code). It stops making sense once a
-- managed provider (Prelude) enters the picture: Prelude generates and
-- validates its own code, so this app has no code of its own to store
-- for that path, but still needs to rate-limit requests to its own
-- Edge Function regardless of which provider is actually handling the
-- verification.
--
-- phone_otp_codes itself is untouched — DummyVerificationProvider still
-- uses it exactly as before, for local/dev testing without a real
-- provider account.

create table public.phone_verification_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type profile_update_entity_type not null,
  entity_id uuid not null,
  created_at timestamptz not null default now()
);

create index phone_verification_requests_entity_idx
  on public.phone_verification_requests (entity_type, entity_id, created_at desc);

alter table public.phone_verification_requests enable row level security;
-- Same reasoning as phone_otp_codes: zero policies for authenticated/
-- anon — only the phone-verification Edge Function's service-role
-- client touches this table, since a client being able to read or
-- clear its own rate-limit history would defeat the point of it.
