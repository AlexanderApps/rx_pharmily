-- ============================================================================
-- Content moderation: extend to donations and donation_responses.
-- ============================================================================
-- Donations were deliberately left out of the original content
-- moderation pass (20260925000000_content_moderation.sql) — added now,
-- same uniform is_removed/removed_reason/removed_by/removed_at columns,
-- same shared content_moderation_actions audit table.

alter table public.donations
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter table public.donation_responses
  add column is_removed boolean not null default false,
  add column removed_reason text,
  add column removed_by uuid references public.profiles(id),
  add column removed_at timestamptz;

alter type content_moderation_type add value if not exists 'donation';
alter type content_moderation_type add value if not exists 'donation_response';
