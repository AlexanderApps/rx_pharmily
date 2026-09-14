-- ============================================================================
-- Close the Community screen leak: add posts.view, verified and up.
-- ============================================================================
-- posts.create/comment/react (restricted to verified-and-up in
-- 20260929000000) only gate the actions of creating, commenting, and
-- reacting — they say nothing about VIEWING the community feed at
-- all. The home feed (index.tsx/index.web.tsx) was replaced with a
-- simple shortcut screen for non-verified users, but Community is a
-- separate screen (app/posts/index.tsx, reached via "Community" in
-- the web sidebar, independent of the home tab) that was never gated
-- and so remained fully visible — and, since PostComposerTrigger was
-- still rendered there, still inviting a non-verified user to type a
-- post that would only fail once they hit submit.
--
-- posts.view follows the same .view/.create pattern already used for
-- every other feature in the catalog (rxrfq.view/rxrfq.create,
-- rxlink.view/rxlink.submit, help.view, etc.) rather than overloading
-- posts.create for a distinctly different action (viewing vs. creating).

insert into public.permissions (key, description, category) values
  ('posts.view', 'View the community feed', 'Community')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key, granted)
select role, 'posts.view', true
from unnest(array['verified', 'admin', 'superadmin']) as role
on conflict (role, permission_key) do nothing;
