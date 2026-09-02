-- ============================================================================
-- Ad moderation, part 1: new owner-initiated lifecycle status values.
-- ============================================================================
-- Split into its own migration file/transaction deliberately — Postgres
-- doesn't allow a newly-added enum value to be referenced (in a policy,
-- function body, etc.) within the same transaction it was added in. The
-- RLS/RPC/table work that actually uses these lives in the next
-- migration, 20260901000001_ad_moderation_and_reports.sql.
--
-- Distinct from 'suspended'/'banned' (admin-only moderation actions):
--   'inactive' — owner temporarily paused a live ad; reversible by the
--                owner themselves, no admin involvement.
--   'closed'   — owner permanently closed a live or paused ad. Distinct
--                from deleting the row outright — 'closed' preserves the
--                ad's engagement/moderation history; deleteAd() (which
--                already exists) stays reserved for ads that never went
--                live at all (pending/rejected).
alter type ad_status add value 'inactive';
alter type ad_status add value 'closed';
