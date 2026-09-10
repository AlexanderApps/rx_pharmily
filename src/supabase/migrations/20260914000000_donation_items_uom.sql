-- ============================================================================
-- donation_items: add unit of measurement.
-- ============================================================================
-- Same free-text pattern as rxrfq_items.uom — stores the reference
-- data's name directly (not a uuid foreign key), matching this app's
-- established multi-select/reference-text convention rather than a
-- junction table.
--
-- Nullable, unlike rxrfq_items.uom (not null) — this column is being
-- added to a table that can already have real rows, and a not-null
-- column with no default would fail against them. New items set it via
-- the form; the form is what enforces it's actually filled in, not a DB
-- constraint that would break existing data.

alter table public.donation_items
  add column uom text;
