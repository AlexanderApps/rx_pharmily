-- ============================================================================
-- Facility group chat
-- ============================================================================
-- Chat was deliberately 1:1-only until now. This adds a second kind of
-- conversation: one addressed to a facility as a whole, visible to
-- whoever currently belongs to it — like a group chat where facility
-- membership *is* group membership, dynamically. Someone who joins the
-- facility next month can see the conversation's full history; someone
-- who leaves loses access from that point on. No message loses its
-- sender attribution either way, since messages have always carried
-- their own sender_id/profile join rather than assuming "the other
-- participant" sent everything — that part needed no schema change.

alter table public.conversations add column facility_id uuid references public.facilities(id);

-- Combines both ways a conversation can be visible: an explicit
-- conversation_participants row (the 1:1 case, and also how the
-- initiator of a facility conversation is tracked), or current
-- membership in the conversation's target facility (dynamic, checked
-- fresh every time rather than snapshotted at conversation-start).
create or replace function public.can_access_conversation(target_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  conv_facility_id uuid;
begin
  if public.is_conversation_participant(target_conversation_id) then
    return true;
  end if;

  select facility_id into conv_facility_id from public.conversations where id = target_conversation_id;
  if conv_facility_id is not null and public.is_facility_member(conv_facility_id) then
    return true;
  end if;

  return false;
end;
$$;

drop policy "participants see conversation_participants rows for their threads" on public.conversation_participants;
create policy "participants see conversation_participants rows for their threads"
  on public.conversation_participants for select
  to authenticated
  using (public.can_access_conversation(conversation_id));

drop policy "participants see their own conversations" on public.conversations;
create policy "participants see their own conversations"
  on public.conversations for select
  to authenticated
  using (public.can_access_conversation(id));

drop policy "participants read messages in their conversations" on public.messages;
create policy "participants read messages in their conversations"
  on public.messages for select
  to authenticated
  using (public.can_access_conversation(conversation_id));

drop policy "participants send messages in their conversations" on public.messages;
create policy "participants send messages in their conversations"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid() and public.can_access_conversation(conversation_id));

-- conversation_participants INSERT/UPDATE policies were already
-- unrestricted enough (with check (true); user_id = auth.uid()) to
-- support a facility member lazily creating their own unread-tracking
-- row the first time they open a facility conversation, rather than
-- every current and future member needing a row pre-inserted at
-- conversation-creation time — no change needed there.

create index idx_conversations_facility_id on public.conversations(facility_id) where facility_id is not null;
