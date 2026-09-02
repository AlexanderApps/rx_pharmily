-- ============================================================================
-- Reference/lookup table: currencies
-- ============================================================================
-- Same pattern as the other reference tables — readable by every
-- authenticated user, writable only by admins. Every currency column
-- already in this schema (ads.plan_currency/payment_currency,
-- payments.currency, price_templates, product pricing, etc.) defaults
-- to 'GHS' — checked across every migration before writing this, and
-- found no evidence any other currency has actually been used anywhere
-- in the app. GHS is seeded first as the primary/default entry; a
-- handful of other currencies plausible for cross-border trade are
-- included too, since this app already has an incoterms table implying
-- international shipping is a real, intended concern — not because
-- they're currently used anywhere. Not wired up as a replacement for
-- any existing currency column — same deliberate non-migration as the
-- other reference tables.

create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  symbol text,
  created_at timestamptz not null default now()
);

alter table public.currencies enable row level security;

create policy "currencies readable by authenticated users"
  on public.currencies for select
  to authenticated
  using (true);

create policy "admins manage currencies"
  on public.currencies for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.currencies (code, name, symbol) values
  ('GHS', 'Ghanaian Cedi', '₵'),
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('NGN', 'Nigerian Naira', '₦'),
  ('XOF', 'West African CFA Franc', 'CFA');
