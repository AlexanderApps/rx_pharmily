-- ============================================================================
-- RxRFQ categories — replacing categories-multiselect.tsx's mock data
-- ============================================================================
-- shared/components/forms/categories-multiselect.tsx (used by both
-- rxrfq-req-form.tsx and rxrfq-res-form.tsx) has a hardcoded CATEGORIES
-- array storing meaningless numeric-string ids ("1".."8") into
-- rxrfqs.categories text[] — the rxrfq detail screen then displays that
-- raw id directly (app/rfqs/rxrfq-details-screen.tsx renders {cat} with
-- no lookup at all), so a request ends up showing chips labeled "1",
-- "2" instead of a real category name.
--
-- These are procurement/item-type categories (what kind of thing is
-- being requested — supplies vs equipment vs furniture), a different
-- taxonomy from medication_categories (pharmacological classification
-- like Antibiotics/Analgesics), so this gets its own table rather than
-- reusing that one — same reasoning job_categories was kept separate.
--
-- Same pattern as every other reference table: readable by every
-- authenticated user, writable only by admins. Seeded with the 8
-- categories already in use today (under their old numeric ids), so
-- existing category names carry over rather than being reinvented.

create table public.rxrfq_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.rxrfq_categories enable row level security;

create policy "rxrfq categories readable by authenticated users"
  on public.rxrfq_categories for select
  to authenticated
  using (true);

create policy "admins manage rxrfq categories"
  on public.rxrfq_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.rxrfq_categories (name) values
  ('Medical Supplies'),
  ('Medications'),
  ('Equipment'),
  ('Consumables'),
  ('Furniture'),
  ('Electronics'),
  ('Linens & Textiles'),
  ('Diagnostic Tools');
