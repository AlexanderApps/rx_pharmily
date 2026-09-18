-- ============================================================================
-- price_checker feature — the standalone price-lookup utility (select a
-- facility you belong to, select one or more of its price lists, search
-- for an item to see its price) gets its own admin-editable feature
-- grant, same mechanism as home_feed: not tied to any permissions.category,
-- since this isn't a feature with its own fine-grained .view/.create/etc
-- actions the way RxRFQ or MediScope are — it's a read-only utility over
-- price_templates/price_template_items, which already have their own
-- "facility members see price templates" RLS. This only controls who
-- sees the utility's entry point; the underlying data access is already
-- scoped correctly regardless.
insert into public.role_features (role, feature, granted) values
  ('pharmacist', 'price_checker', true),
  ('pss', 'price_checker', true),
  ('auditor', 'price_checker', true),
  ('admin', 'price_checker', true),
  ('superadmin', 'price_checker', true)
on conflict (role, feature) do nothing;
