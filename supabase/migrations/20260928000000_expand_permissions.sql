-- ============================================================================
-- Expand the permission catalog: canPrint, chat gating, and coverage for
-- features added since the RBAC/ABAC system was first seeded.
-- ============================================================================
-- Same 4-tier structure as the original seed (20260909000000): 'public'
-- (any signed-in user), 'verified' (KYC-verified), 'admin', 'superadmin'.
--
-- Two behavior changes, both explicitly requested this turn:
--   - print.export is 'verified'-and-up only — a non-verified user can no
--     longer initiate Print/Export PDF anywhere in the app.
--   - chat.use is 'verified'-and-up only — RxChat is taken away from
--     non-verified users entirely (both the conversation list and
--     individual threads).
--
-- Everything else added here is catalog EXPANSION, not a behavior
-- change: Community (posts), Ownership Transfer, and Account
-- (profile update requests) are existing features that had no
-- permission-system representation at all. Community is seeded as
-- 'public' deliberately — posting/commenting/reacting was never
-- gated before this, and nothing here was asked to change that; this
-- just gives it a catalog entry so a future admin override or a
-- future "group the default permission" pass (per this turn's note)
-- has something to act on, without silently blocking anyone today.

insert into public.permissions (key, description, category) values
  ('print.export', 'Print or export a document as PDF (vitals, donations, MediScope, RxRFQ)', 'Print'),
  ('chat.use', 'Access RxChat — view conversations and send messages', 'RxChat'),
  ('posts.create', 'Create a community post', 'Community'),
  ('posts.comment', 'Comment on a community post', 'Community'),
  ('posts.react', 'Like a post or vote on a poll', 'Community'),
  ('ownership_transfer.request', 'Request ownership of a facility or organization', 'Ownership Transfer'),
  ('profile.request_update', 'Request a change to a verified profile', 'Account')
on conflict (key) do nothing;

-- print.export and chat.use: 'verified' and up only — this is the
-- actual gate. 'public' is deliberately excluded from both inserts
-- below, so a non-verified user's resolved permission for these keys
-- falls through to the false default in get_user_permissions.
insert into public.role_permissions (role, permission_key, granted)
select role, key, true
from unnest(array['verified', 'admin', 'superadmin']) as role
cross join public.permissions
where key in ('print.export', 'chat.use', 'ownership_transfer.request', 'profile.request_update')
on conflict (role, permission_key) do nothing;

-- Community: every tier, including 'public' — preserves today's
-- actual behavior (posting was never gated) while still giving these
-- actions catalog entries.
insert into public.role_permissions (role, permission_key, granted)
select role, key, true
from unnest(array['public', 'verified', 'admin', 'superadmin']) as role
cross join public.permissions
where category = 'Community'
on conflict (role, permission_key) do nothing;
