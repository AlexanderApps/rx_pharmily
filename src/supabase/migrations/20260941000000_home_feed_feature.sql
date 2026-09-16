-- ============================================================================
-- home_feed feature — makes the advanced home screen (the full FYP,
-- vs. the minimal public shortcut screen) an explicit, admin-editable
-- grant instead of the hardcoded "any role other than public" rule
-- previously baked directly into 5 separate UI files (both home screen
-- variants, the web sidebar, the mobile services screen, the profile
-- hub). Seeded here to match exactly what those hardcoded checks
-- already granted, so this changes nothing about who sees what today —
-- it only moves the decision into role_features, where a superadmin
-- can change it later without a code deploy.
--
-- Not tied to any permissions.category — the FYP isn't itself a
-- feature with its own fine-grained actions the way RxRFQ or
-- MediScope are; it's a screen that surfaces content already gated by
-- those features' own .view permissions. This is a pure feature-layer
-- grant, same mechanism as everything else in role_features, just with
-- no corresponding permissions catalog entry.
insert into public.role_features (role, feature, granted) values
  ('pharmacist', 'home_feed', true),
  ('pss', 'home_feed', true),
  ('auditor', 'home_feed', true),
  ('admin', 'home_feed', true),
  ('superadmin', 'home_feed', true)
on conflict (role, feature) do nothing;
