-- ============================================================================
-- Soft-delete for chat: messages and conversations, with a scheduled purge.
-- ============================================================================
-- Two different deletion shapes, matching how most chat apps actually
-- behave, not one flat "deleted" flag applied the same way to both:
--
-- - A MESSAGE is deleted globally, by its sender only. Once deleted, it
--   shows as "This message was deleted" to both participants — the
--   sender doesn't get to erase it from their own view while leaving
--   the other participant's history intact, since that would let a
--   sender rewrite what the other participant remembers being said.
--
-- - A CONVERSATION is deleted per participant ("delete for me"), not
--   globally — one participant clearing their own list of
--   conversations doesn't remove the other participant's copy. This
--   is why the flag lives on conversation_participants (the per-user,
--   per-conversation row that already exists), not on conversations
--   itself, which is shared between both people.
--
-- Both are soft deletes: nothing is actually removed from the database
-- until the scheduled cleanup job below reaches it, past a configurable
-- retention window. See CHANGING THE RETENTION PERIOD below for how to
-- adjust it without a migration.
--
-- ----------------------------------------------------------------------
-- ON THE RETENTION PERIOD ITSELF:
-- ----------------------------------------------------------------------
-- Defaulted to 30 days — a common recovery/audit window for soft-deleted
-- business communication (the same shape as, e.g., Slack's or Gmail's
-- trash retention), not a number derived from any specific regulation.
-- This is professional-to-professional marketplace chat, not clinical
-- or patient health data, so HIPAA-style PHI retention rules don't
-- directly apply — but Ghana's Data Protection Act, or whatever
-- jurisdiction(s) actually govern this deployment, may have their own
-- requirements this should be checked against and adjusted to match.
-- Changing it is a one-line UPDATE, not a migration — see below.
-- ----------------------------------------------------------------------
--   update private.app_config
--   set value = '90'  -- or any other number of days
--   where key = 'chat_deletion_retention_days';
--
-- Takes effect on the next scheduled run — nothing to redeploy.
-- ----------------------------------------------------------------------

alter table public.messages
  add column is_deleted boolean not null default false,
  add column deleted_at timestamptz;

alter table public.conversation_participants
  add column deleted_at timestamptz;

-- messages had no update policy at all before this — a sender can now
-- soft-delete (only) their own sent messages. Explicitly scoped to
-- sender_id so this can't be used to delete the other participant's
-- messages, and with check mirrors using so a sender can't reassign
-- sender_id to someone else's messages via this same policy either.
create policy "senders soft-delete their own messages"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- conversation_participants already has "users update their own
-- participant row (unread count etc)" from the initial schema —
-- deleted_at is covered by that existing policy, no new one needed.

-- Reuses the same config table the notification-retention migration
-- created — CREATE TABLE IF NOT EXISTS here too, so this migration
-- doesn't depend on running after that one.
create schema if not exists private;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);

alter table private.app_config enable row level security;

insert into private.app_config (key, value)
values ('chat_deletion_retention_days', '30')
on conflict (key) do nothing;

create or replace function public.cleanup_deleted_chat_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  retention_days int;
  deleted_messages_count int;
  deleted_participants_count int;
  deleted_conversations_count int;
begin
  select value::int into retention_days
  from private.app_config
  where key = 'chat_deletion_retention_days';

  if retention_days is null then
    retention_days := 30;
  end if;

  -- 1. Purge individually soft-deleted messages past retention. This
  -- only removes the message rows themselves — the conversation and
  -- its other messages are untouched.
  delete from public.messages
  where is_deleted and deleted_at < now() - (retention_days || ' days')::interval;
  get diagnostics deleted_messages_count = row_count;

  -- 2. Purge participant rows for conversations a user soft-deleted
  -- past retention — this is what makes "delete for me" actually
  -- permanent rather than just perpetually hidden.
  delete from public.conversation_participants
  where deleted_at < now() - (retention_days || ' days')::interval;
  get diagnostics deleted_participants_count = row_count;

  -- 3. A conversation with zero remaining participants (both sides
  -- deleted it and passed retention, or it was a solo edge case) has
  -- nothing left pointing at it — purge it too. messages.conversation_id
  -- has on delete cascade, so this also cleans up any remaining
  -- (non-individually-deleted) messages in it.
  delete from public.conversations c
  where not exists (
    select 1 from public.conversation_participants cp where cp.conversation_id = c.id
  );
  get diagnostics deleted_conversations_count = row_count;

  raise notice 'cleanup_deleted_chat_data: % message(s), % participant row(s), % empty conversation(s) purged (retention: % days)',
    deleted_messages_count, deleted_participants_count, deleted_conversations_count, retention_days;
end;
$$;

create extension if not exists pg_cron;

-- Daily at 03:15 UTC — 15 minutes after the notification cleanup job,
-- so the two don't contend for the same low-traffic window at the
-- exact same instant.
do $$
begin
  perform cron.unschedule('cleanup-deleted-chat-data');
exception
  when others then
    null; -- job didn't exist yet — fine, proceed to create it below
end $$;

select cron.schedule(
  'cleanup-deleted-chat-data',
  '15 3 * * *',
  $$select public.cleanup_deleted_chat_data();$$
);

-- ----------------------------------------------------------------------
-- VERIFYING THIS WORKED:
-- ----------------------------------------------------------------------
--   select * from cron.job where jobname = 'cleanup-deleted-chat-data';
--
--   select * from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'cleanup-deleted-chat-data')
--   order by start_time desc limit 10;
-- ----------------------------------------------------------------------
