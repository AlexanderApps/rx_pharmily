-- ============================================================================
-- Centralized payments table
-- ============================================================================
-- Every paid action in the app (ads today, presumably more later) used to
-- carry its own payment_amount/payment_currency/payment_status/
-- payment_paid_at/payment_reference columns — ads.submitAd() even
-- hardcoded payment_status to 'paid' immediately on submission, with no
-- real pending state or review step at all (see mockPaymentReference()
-- in features/ads/hooks/use-ads-data.ts). This replaces that per-feature
-- pattern with one shared table: any paid action creates a `payments` row
-- (pending, with a reference the user quotes when paying via mobile
-- money outside the app), and links back to it with a single foreign
-- key instead of duplicating payment fields onto every table that needs
-- one.
--
-- A note on the existing `payment_status` enum (unpaid/paid/refunded,
-- defined in the initial schema): its values don't match what this needs
-- (pending/paid/cancelled), so a new type is created here rather than
-- reusing or altering it. The old type is left in place unused rather
-- than dropped, since ads.payment_status (the only column using it) is
-- dropped below and nothing else references the type.

create type transaction_status as enum ('pending', 'paid', 'cancelled');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  -- User-facing identifier, quoted by the payer when they actually send
  -- the mobile money payment outside the app. Format decided at the
  -- application layer (a two-letter feature prefix + timestamp, e.g.
  -- AD1755678901234 for an ad) — enforced here only as "must be unique",
  -- not a specific shape, so the format can evolve without a migration.
  reference text not null unique,
  status transaction_status not null default 'pending',
  amount_due numeric(12, 2) not null,
  -- Deliberately not constrained to equal amount_due — reconciliation
  -- between the two is left to the superadmin's judgment when marking a
  -- payment paid, not enforced by the database.
  amount_paid numeric(12, 2),
  currency text not null default 'GHS',
  -- Who owes this payment.
  initiated_by uuid not null references public.profiles(id),
  -- Who reviewed it — set together with status/paid_at when a superadmin
  -- marks it paid or cancelled. Same naming convention as ads.reviewed_by
  -- for content review, kept separate since payment review and content
  -- review are independent decisions made by different roles.
  reviewed_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_payments_status on public.payments(status);
create index idx_payments_initiated_by on public.payments(initiated_by);

alter table public.payments enable row level security;

-- Read: the person who owes the payment can see their own; admins and
-- superadmins can see all of them (needed for the review queue).
create policy "payments visible to initiator or admin"
  on public.payments for select
  to authenticated
  using (initiated_by = auth.uid() or public.is_admin());

-- Create: the app creates a payment row on behalf of whichever
-- authenticated user is taking the paid action — never on someone else's
-- behalf.
create policy "users create their own payments"
  on public.payments for insert
  to authenticated
  with check (initiated_by = auth.uid());

-- Update: superadmin only, not admin — marking a transaction paid or
-- cancelled is a superadmin-specific action, same tier distinction the
-- app already makes for account role changes.
create policy "superadmin marks payments paid or cancelled"
  on public.payments for update
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ----------------------------------------------------------------------
-- Link ads to payments, backfill existing rows, drop the old columns
-- ----------------------------------------------------------------------

alter table public.ads add column payment_id uuid references public.payments(id);

-- One payments row per existing ad, carrying over its current payment_*
-- values. 'refunded' has no exact equivalent in the new three-value
-- status set — mapped to 'cancelled' as the closest fit, though this
-- loses the "was paid, then reversed" distinction 'refunded' used to
-- carry. Worth a manual data check after this migration runs if any
-- ads were ever actually refunded.
insert into public.payments (reference, status, amount_due, amount_paid, currency, initiated_by, paid_at, created_at)
select
  payment_reference,
  case payment_status
    when 'paid' then 'paid'::transaction_status
    when 'refunded' then 'cancelled'::transaction_status
    else 'pending'::transaction_status
  end,
  payment_amount,
  case when payment_status = 'paid' then payment_amount else null end,
  payment_currency,
  advertiser_id,
  payment_paid_at,
  created_at
from public.ads;

update public.ads a
set payment_id = p.id
from public.payments p
where p.reference = a.payment_reference;

-- Every ad already required payment_amount (not null) before this
-- migration, and the backfill above guarantees every existing ad now has
-- a linked payment — safe to require going forward too.
alter table public.ads alter column payment_id set not null;

alter table public.ads drop column payment_amount;
alter table public.ads drop column payment_currency;
alter table public.ads drop column payment_status;
alter table public.ads drop column payment_paid_at;
alter table public.ads drop column payment_reference;

-- ----------------------------------------------------------------------
-- Enforce: an ad can't be approved while its linked payment is pending
-- ----------------------------------------------------------------------
-- Enforced at both layers deliberately. The RLS check below is the
-- backstop that holds even if application code has a bug; the
-- application-level check in approveAd() (features/ads/hooks/
-- use-ads-data.ts) is what actually gives the admin a clear error
-- message instead of a raw policy-violation error.

create or replace function public.ad_payment_is_paid(p_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.payments where id = p_payment_id and status = 'paid'
  );
$$;

drop policy "advertiser updates own ad, admin moderates any" on public.ads;
create policy "advertiser updates own ad, admin moderates any"
  on public.ads for update
  to authenticated
  using (advertiser_id = auth.uid() or public.is_admin())
  with check (
    (advertiser_id = auth.uid() or public.is_admin())
    and (status <> 'approved' or public.ad_payment_is_paid(payment_id))
  );
