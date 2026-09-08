-- ============================================================================
-- Notifications, part 2: allow client-side inserts.
-- ============================================================================
-- The original schema's own comment on public.notifications is explicit
-- about the intended design: "Notifications are meant to be created by
-- backend logic (triggers/edge functions) reacting to other tables'
-- changes, not inserted directly by the recipient... there's
-- deliberately no insert policy here." That's the more robust design —
-- it fires even if a client crashes mid-action, and can't be bypassed
-- or spoofed by a malicious client.
--
-- This migration deviates from that intent, deliberately: writing ~28
-- per-category triggers (one per NotificationCategory value) is an
-- order of magnitude more schema work than this feature's actual scope
-- justifies. Recipient targeting instead happens client-side — each
-- call site (features/*/hooks/*.ts, via useNotificationStore) inserts a
-- row naming the actual recipient explicitly. The trade-off this
-- creates, worth stating plainly: insert can't be restricted to
-- "insert only for yourself" (the whole point is one user's action
-- notifying a different user), so a malicious or buggy client could in
-- principle insert a notification claiming to be for an arbitrary
-- recipient_id. Revisiting this as real Postgres triggers remains the
-- more correct long-term fix if this ever needs to be hardened.
--
-- drop-then-create rather than a bare create — same "safe to re-run
-- after a partial prior attempt" reasoning as the enum-values migration
-- this one depends on; create policy has no "if not exists" of its own.
drop policy if exists "authenticated users create notifications for anyone" on public.notifications;
create policy "authenticated users create notifications for anyone"
  on public.notifications for insert
  to authenticated
  with check (true);
