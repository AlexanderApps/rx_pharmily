-- ============================================================================
-- Notifications, part 1: missing enum values.
-- ============================================================================
-- The original schema's notification_category enum predates RxLink and
-- 6 of the facility/organization categories that features/notifications/
-- types/notifications.types.ts's NotificationCategory union already
-- expects — this adds the 8 that are missing. Split into its own
-- migration/transaction deliberately: Postgres doesn't allow a newly-
-- added enum value to be referenced in the same transaction it was
-- added in, and part 2 (the insert policy) needs to exist alongside a
-- schema that already has every category client code expects.
--
-- "if not exists" on every line — this migration may be re-run after an
-- earlier attempt partially succeeded (enum additions, unlike most DDL,
-- aren't undone just because a *different*, later migration file in the
-- same push batch failed), so it needs to be safe to run again from
-- scratch without erroring on whichever values already made it in.
alter type notification_category add value if not exists 'rxlink_new_entry';
alter type notification_category add value if not exists 'rxlink_response_received';
alter type notification_category add value if not exists 'facility_creation_decision';
alter type notification_category add value if not exists 'organization_creation_decision';
alter type notification_category add value if not exists 'facility_membership_request_received';
alter type notification_category add value if not exists 'facility_membership_decision';
alter type notification_category add value if not exists 'facility_organization_request_received';
alter type notification_category add value if not exists 'facility_organization_decision';
