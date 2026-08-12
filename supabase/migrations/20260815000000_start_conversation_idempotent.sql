-- ============================================================================
-- Fix: starting a chat kept creating duplicate conversations
-- ============================================================================
-- The "reuse an existing conversation" check lived entirely on the
-- client, reading the local conversations array in the store. That array
-- can be stale for several genuine reasons, not just one: it hasn't been
-- fetched yet on a fresh mount, it was fetched before this particular
-- conversation existed, or — most reproducibly — a quick second tap on a
-- search result fires a second start_conversation call before the first
-- call's own post-creation refresh has finished, so the second call's
-- local check still doesn't see what the first call just created.
--
-- Moving deduplication into the function itself, checking the real
-- current database state under the same security-definer transaction
-- that does the insert, makes this correct regardless of what the
-- client's local cache happens to know. The client-side check (kept in
-- the store) becomes a fast-path optimization only — skips the network
-- round trip when the answer's already known locally — not the thing
-- actually responsible for correctness.

create or replace function public.start_conversation(
  other_user_id uuid default null,
  target_facility_id uuid default null,
  ctx_type chat_linked_entity_type default null,
  ctx_id uuid default null,
  ctx_code text default null,
  ctx_title text default null,
  ctx_subtitle text default null,
  ctx_status text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_conversation_id uuid;
  my_id uuid := auth.uid();
begin
  if my_id is null then
    raise exception 'Not authenticated';
  end if;

  if other_user_id is null and target_facility_id is null then
    raise exception 'A conversation needs either another user or a target facility.';
  end if;

  -- Only plain (context-free) conversations get reused — a "message the
  -- vendor about this RFQ" action always opens a fresh, purpose-anchored
  -- thread rather than dropping into whatever unrelated conversation
  -- already existed with that same person or facility.
  if ctx_type is null then
    if other_user_id is not null then
      select c.id into new_conversation_id
      from public.conversations c
      where c.facility_id is null
        and c.context_type is null
        and exists (
          select 1 from public.conversation_participants cp1
          where cp1.conversation_id = c.id and cp1.user_id = my_id
        )
        and exists (
          select 1 from public.conversation_participants cp2
          where cp2.conversation_id = c.id and cp2.user_id = other_user_id
        )
      limit 1;
    else
      select c.id into new_conversation_id
      from public.conversations c
      where c.facility_id = target_facility_id
        and c.context_type is null
        and exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = c.id and cp.user_id = my_id
        )
      limit 1;
    end if;

    if new_conversation_id is not null then
      return new_conversation_id;
    end if;
  end if;

  insert into public.conversations (
    facility_id, context_type, context_id, context_code, context_title, context_subtitle, context_status
  )
  values (
    target_facility_id, ctx_type, ctx_id, ctx_code, ctx_title, ctx_subtitle, ctx_status
  )
  returning id into new_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id) values (new_conversation_id, my_id);

  if other_user_id is not null then
    insert into public.conversation_participants (conversation_id, user_id) values (new_conversation_id, other_user_id);
  end if;

  return new_conversation_id;
end;
$$;
