-- ============================================================================
-- New app_settings row: mediscope_default_deadline_days
-- ============================================================================
-- MediScope requests have an optional submissionDeadline (unlike RxRFQ's,
-- which is always required) — this is the fallback window, in days from
-- createdAt, used to compute an effective deadline for a request that was
-- never given one, so it can still be excluded from the feed/marketplace
-- once "old enough" rather than staying visible forever.
insert into public.app_settings (key, value) values
  ('mediscope_default_deadline_days', '30'::jsonb)
on conflict (key) do nothing;
