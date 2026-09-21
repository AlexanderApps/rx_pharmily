-- ============================================================================
-- app_settings — global, app-wide configuration flags.
-- ============================================================================
-- key/value rather than one column per setting, so a future global
-- setting (there will likely be more than just this one over time)
-- doesn't need its own schema migration — just a new row.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_settings enable row level security;

-- Readable by anyone authenticated — this is display-affecting
-- configuration every user's own client needs to read (e.g. whether to
-- show a title before someone's name), not an admin-only concern the
-- way most other tables in this schema are.
create policy "app settings readable by all authenticated users"
  on public.app_settings for select
  to authenticated
  using (true);

-- Only superadmin can change global settings — this deliberately
-- doesn't extend to plain admin, unlike most moderation actions in
-- this schema, since a setting here changes what every user in the
-- system sees, not just one entity's own state.
create policy "superadmin manages app settings"
  on public.app_settings for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

insert into public.app_settings (key, value) values
  ('show_user_title_in_brackets', 'false'::jsonb);
