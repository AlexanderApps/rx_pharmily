-- ============================================================================
-- Fix infinite recursion in conversation_participants RLS
-- ============================================================================
-- "participants see conversation_participants rows for their threads" is a
-- policy ON conversation_participants whose own USING clause subqueries
-- conversation_participants itself, to check whether the current user is
-- a participant in the row's conversation. Evaluating that subquery
-- re-triggers RLS on conversation_participants, which re-evaluates the
-- same policy, which re-triggers RLS again — infinite recursion. Postgres
-- correctly refuses this outright rather than looping forever.
--
-- The other three policies below aren't self-referential on their own
-- (they live on conversations/messages, not conversation_participants),
-- but reading their subqueries requires evaluating conversation_
-- participants' RLS regardless — so the same recursion surfaces the
-- moment any of them run, not just the one that's actually circular.
--
-- Same fix already used for facility/organization membership checks
-- elsewhere in this schema: a SECURITY DEFINER function evaluates
-- membership with RLS bypassed for its own internal query, so nothing
-- re-triggers the policy that called it.

create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = target_conversation_id and user_id = auth.uid()
  );
$$;

drop policy "participants see conversation_participants rows for their threads" on public.conversation_participants;
create policy "participants see conversation_participants rows for their threads"
  on public.conversation_participants for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy "participants see their own conversations" on public.conversations;
create policy "participants see their own conversations"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_participant(id));

drop policy "participants read messages in their conversations" on public.messages;
create policy "participants read messages in their conversations"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy "participants send messages in their conversations" on public.messages;
create policy "participants send messages in their conversations"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));
