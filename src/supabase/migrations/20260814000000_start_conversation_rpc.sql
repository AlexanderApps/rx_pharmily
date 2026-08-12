-- ============================================================================
-- Fix: starting a conversation always failed under RLS
-- ============================================================================
-- The client inserted into conversations, then immediately .select()'d
-- the new row back (Supabase does this automatically for RETURNING data)
-- — but the conversations SELECT policy requires can_access_conversation(),
-- which checks for a conversation_participants row that didn't exist yet
-- (the participant insert was a separate, later call). With nothing yet
-- granting access, the RETURNING select found zero visible rows, and
-- Postgres/PostgREST surfaces that as "new row violates row-level
-- security policy" — a genuinely confusing message for what's actually an
-- ordering problem, not a policy that's wrong. This affected every
-- conversation start, 1:1 or facility, not something the facility
-- feature introduced.
--
-- Fix: do the whole thing — create the conversation and insert whichever
-- participant row(s) it needs — as one atomic, SECURITY DEFINER
-- operation. Nothing in here needs to pass RLS on its own way in, so
-- there's no window where the row exists but isn't visible yet. The
-- client calls this once and gets the new id directly back from the
-- function return value, not from a RLS-gated select.

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

  insert into public.conversations (
    facility_id, context_type, context_id, context_code, context_title, context_subtitle, context_status
  )
  values (
    target_facility_id, ctx_type, ctx_id, ctx_code, ctx_title, ctx_subtitle, ctx_status
  )
  returning id into new_conversation_id;

  -- The initiator always gets a row — for a 1:1 thread this is one of
  -- the two participants; for a facility thread it's how the initiator
  -- (who may not themselves belong to the facility) keeps access,
  -- alongside every current facility member's dynamic access via
  -- is_facility_member().
  insert into public.conversation_participants (conversation_id, user_id) values (new_conversation_id, my_id);

  if other_user_id is not null then
    insert into public.conversation_participants (conversation_id, user_id) values (new_conversation_id, other_user_id);
  end if;

  return new_conversation_id;
end;
$$;
