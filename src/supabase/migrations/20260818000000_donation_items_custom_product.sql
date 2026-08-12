-- ============================================================================
-- Track whether a donated item's product matched the catalog or was custom
-- ============================================================================
-- Donation line items store product as free text, not a product_id FK —
-- unlike RxRFQ, they haven't been migrated onto the shared catalog. This
-- adds a flag for whether the text the donor entered actually matched an
-- existing catalog product at the time (via the ProductComboBox) or was
-- typed as a one-off custom entry, without requiring the full FK
-- migration that would be a much bigger change.
--
-- Existing rows default to true (treated as custom) rather than false —
-- they were entered before this tracking existed at all, so there's no
-- real basis to claim they were catalog-verified.

alter table public.donation_items
  add column is_custom_product boolean not null default true;
