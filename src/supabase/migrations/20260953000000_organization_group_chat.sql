-- ============================================================================
-- Organization group chat — mirrors facility group chat (see
-- 20260813000000_facility_group_chat.sql) exactly in structure.
-- ============================================================================
-- One real difference from the facility case: organizations have no
-- membership table of their own (facility_memberships has no
-- organization equivalent) — the only user<->organization relationship
-- that exists at all is organizations.admin_user_id. So
-- is_organization_member below checks only that, which today makes an
-- organization conversation effectively a thread with its admin. It's
-- named to match is_facility_member (not is_organization_admin) so the
-- access-control shape stays symmetrical with the facility case, and so
-- this can grow into checking a real membership table later without
-- renaming anything or touching can_access_conversation again.

alter table public.conversations add column organization_id uuid references public.organizations(id);

create or replace function public.is_organization_member(check_organization_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organizations
    where id = check_organization_id and admin_user_id = auth.uid()
  );
$$;

-- Extends the same function the facility case already uses, rather
-- than a parallel one — one access decision per conversation, whatever
-- kind of target it has.
create or replace function public.can_access_conversation(target_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  conv_facility_id uuid;
  conv_organization_id uuid;
begin
  if public.is_conversation_participant(target_conversation_id) then
    return true;
  end if;

  select facility_id, organization_id into conv_facility_id, conv_organization_id
    from public.conversations where id = target_conversation_id;

  if conv_facility_id is not null and public.is_facility_member(conv_facility_id) then
    return true;
  end if;

  if conv_organization_id is not null and public.is_organization_member(conv_organization_id) then
    return true;
  end if;

  return false;
end;
$$;

-- start_conversation: add an organization branch alongside the
-- existing user/facility ones. Same reuse-then-create shape as the
-- facility branch — one conversation per organization, found by
-- organization_id plus the caller's own participant row, created with
-- only the caller as an explicit participant (the admin gets access
-- dynamically via is_organization_member, same as every facility
-- member already does for a facility conversation).
create or replace function public.start_conversation(
  other_user_id uuid default null,
  target_facility_id uuid default null,
  target_organization_id uuid default null,
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

  if other_user_id is null and target_facility_id is null and target_organization_id is null then
    raise exception 'A conversation needs another user, a target facility, or a target organization.';
  end if;

  if other_user_id is not null then
    select c.id into new_conversation_id
    from public.conversations c
    where c.facility_id is null
      and c.organization_id is null
      and exists (
        select 1 from public.conversation_participants cp1
        where cp1.conversation_id = c.id and cp1.user_id = my_id
      )
      and exists (
        select 1 from public.conversation_participants cp2
        where cp2.conversation_id = c.id and cp2.user_id = other_user_id
      )
    limit 1;
  elsif target_facility_id is not null then
    select c.id into new_conversation_id
    from public.conversations c
    where c.facility_id = target_facility_id
      and exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = c.id and cp.user_id = my_id
      )
    limit 1;
  else
    select c.id into new_conversation_id
    from public.conversations c
    where c.organization_id = target_organization_id
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
    facility_id, organization_id, context_type, context_id, context_code, context_title, context_subtitle, context_status
  )
  values (
    target_facility_id, target_organization_id, ctx_type, ctx_id, ctx_code, ctx_title, ctx_subtitle, ctx_status
  )
  returning id into new_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id) values (new_conversation_id, my_id);

  if other_user_id is not null then
    insert into public.conversation_participants (conversation_id, user_id) values (new_conversation_id, other_user_id);
  end if;

  return new_conversation_id;
end;
$$;

create index idx_conversations_organization_id on public.conversations(organization_id) where organization_id is not null;
