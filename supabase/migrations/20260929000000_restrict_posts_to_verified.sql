-- ============================================================================
-- Restrict the community post feature to verified users and up.
-- ============================================================================
-- posts.create/comment/react were seeded as 'public' tier in
-- 20260928000000_expand_permissions.sql, deliberately preserving the
-- app's previous (ungated) behavior at the time. This turn explicitly
-- asks to take that away from non-verified users — removing the
-- 'public' tier's grant rows here means those 3 keys now fall through
-- to get_user_permissions' final `false` default for a non-verified
-- user, while 'verified'/'admin'/'superadmin' keep the `true` grants
-- already seeded for them.

delete from public.role_permissions
where role = 'public'
  and permission_key in ('posts.create', 'posts.comment', 'posts.react');
