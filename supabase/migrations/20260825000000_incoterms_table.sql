-- ============================================================================
-- Reference/lookup table: incoterms
-- ============================================================================
-- Same pattern as 20260824000000_reference_lookup_tables.sql — readable
-- by every authenticated user, writable only by admins. Seeded with the
-- exact 5 codes/labels already hardcoded as INCOTERM_OPTIONS_LIST in
-- features/rxrfqs/hooks/use-rxrfq-data.ts, so this starts in sync with
-- what the app already uses — not a new, separately-invented list.
-- description is new (the existing hardcoded list has none, and
-- shared/components/forms/incoterm-selector.tsx's own reference to
-- item.description is consequently always empty today) — populated here
-- with standard ICC Incoterms 2020 definitions, since these are
-- internationally standardized commercial terms, not something
-- ambiguous or app-specific to invent. Not yet wired up as this table's
-- consumer — the rxrfqs store still owns its own hardcoded list, same
-- deliberate non-migration as the other reference tables' relationship
-- to products/formulary_requests/facilities.

create table public.incoterms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.incoterms enable row level security;

create policy "incoterms readable by authenticated users"
  on public.incoterms for select
  to authenticated
  using (true);

create policy "admins manage incoterms"
  on public.incoterms for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.incoterms (code, label, description) values
  ('EXW', 'EXW — Ex Works', 'Seller makes the goods available at their own premises; buyer bears all costs and risk from that point, including export clearance.'),
  ('FOB', 'FOB — Free On Board', 'Seller delivers the goods on board the vessel at the named port of shipment; risk transfers to the buyer once the goods are on board.'),
  ('CIF', 'CIF — Cost, Insurance & Freight', 'Seller pays for cost, insurance, and freight to the named port of destination; risk transfers to the buyer once the goods are on board at the port of shipment.'),
  ('DDP', 'DDP — Delivered Duty Paid', 'Seller delivers the goods, cleared for import, ready for unloading at the named destination — bearing all costs and risk, including duties and taxes.'),
  ('FCA', 'FCA — Free Carrier', 'Seller delivers the goods, cleared for export, to a carrier or other party nominated by the buyer at a named place.');
