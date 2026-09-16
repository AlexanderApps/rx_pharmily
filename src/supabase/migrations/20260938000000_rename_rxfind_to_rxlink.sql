-- ============================================================================
-- Rename the RxFind category/feature to RxLink.
-- ============================================================================
-- "RxFind" was the category permissions.rxlink.view/rxlink.submit were
-- originally seeded under — a naming mismatch against the feature's
-- actual name everywhere else (the UI, the route /rxlink, the sidebar
-- label). Never hardcoded client-side (confirmed by search — nothing
-- in app/, features/, or shared/ ever referenced "RxFind" directly),
-- but visible to an admin via any screen that displays category/
-- feature groupings dynamically, e.g. app/admin/role-permissions.tsx.
--
-- A pure data rename, not a schema change — updating the stored value
-- in both places it's kept (permissions.category, and role_features.
-- feature, seeded from that same category at the time
-- 20260937000000_multi_role_foundation.sql ran) fixes every screen
-- that reads either column dynamically, with nothing to change in the
-- client at all.
update public.permissions set category = 'RxLink' where category = 'RxFind';
update public.role_features set feature = 'RxLink' where feature = 'RxFind';
