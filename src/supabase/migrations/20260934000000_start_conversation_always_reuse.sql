-- ============================================================================
-- Fix: sharing an item (or contacting a vendor) repeatedly with the same
-- person kept creating a new conversation every time.
-- ============================================================================
-- start_conversation's reuse check was gated behind `ctx_type is null` —
-- a deliberate choice at the time for "message the vendor about this
-- RFQ" always opening a fresh, purpose-anchored thread. The new
-- share-to-chat feature also passes a context on every call, which
-- means it never reused an existing conversation either: sharing two
-- different items to the same person, or sharing to someone you
-- already have a plain conversation with, both spawned a brand new
-- conversation each time.
--
-- The reuse check now runs unconditionally — one conversation per
-- person (or per facility), regardless of context. A shared item (or
-- an RFQ contact) still gets attached to that conversation exactly as
-- before, just as a new message via sendMessage after this function
-- returns, rather than as a new conversation's own anchor. The
-- conversation's own context_type/context_id (its pinned banner) is
-- only ever set once, at actual creation time, same as before.

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

  -- Reuse any existing conversation with this same person or facility,
  -- regardless of whether this call is also carrying a new context —
  -- one thread per person, with each shared/contacted item landing in
  -- it as its own message rather than spawning a parallel thread.
  if other_user_id is not null then
    select c.id into new_conversation_id
    from public.conversations c
    where c.facility_id is null
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
      and exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = c.id and cp.user_id = my_id
      )
    limit 1;
  end if;

  if new_conversation_id is not null then
    return new_conversation_id;
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
