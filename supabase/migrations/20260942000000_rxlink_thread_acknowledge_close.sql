-- ============================================================================
-- RxLink enhancements: acknowledge, two-way thread, dual-close -> resolved,
-- reject with reason.
-- ============================================================================
-- Status model, after this migration:
--   pending -> acknowledged -> responded  (admin's progress on the request)
--   pending/acknowledged/responded -> rejected  (terminal)
--   requester_closed_at + admin_closed_at both set -> resolved (terminal,
--     overrides whatever status was set before — see the trigger below)
--
-- Close is tracked as two independent timestamps, not a status value —
-- unlike the old single-sided 'closed' status, either side can close
-- without needing to know or wait on the other, and 'resolved' only
-- fires once both have. This deliberately replaces 'closed' as a
-- concept, not just a value: the enum keeps the 'closed' label (Postgres
-- can't cheaply drop enum values), but nothing after this migration
-- ever sets it again.

alter type rxlink_status add value 'acknowledged';
alter type rxlink_status add value 'rejected';
alter type rxlink_status add value 'resolved';

alter table public.rxlink_requests
  add column acknowledged_at timestamptz,
  add column acknowledged_by uuid references public.profiles(id),
  add column rejection_reason text,
  add column requester_closed_at timestamptz,
  add column admin_closed_at timestamptz,
  add column admin_closed_by uuid references public.profiles(id);

-- Migrate existing 'closed' rows onto the new model — old 'closed' only
-- ever meant "requester closed", so it becomes requester_closed_at set,
-- with status reverted to whatever it would have been based on
-- responded_at (this does NOT set admin_closed_at, so an old closed
-- request doesn't jump straight to 'resolved' — the admin genuinely
-- hasn't closed their side yet, and shouldn't be credited with having
-- done so retroactively).
update public.rxlink_requests
set
  requester_closed_at = coalesce(responded_at, created_at),
  status = (case when responded_at is not null then 'responded' else 'pending' end)::rxlink_status
where status = 'closed';

-- ----------------------------------------------------------------------
-- rxlink_responses becomes a genuine two-way thread — responder_id
-- renamed to sender_id since it's no longer admin-only, and two
-- nullable columns added now so a future attachment feature (images,
-- location) doesn't need its own migration later: attachment_type is
-- the discriminator, attachment_data is deliberately jsonb rather than
-- a fixed set of columns, since different attachment kinds will need
-- different shapes. Both stay unused (always null) until that feature
-- actually gets built — text-only messages for now, per the request.
-- ----------------------------------------------------------------------
alter table public.rxlink_responses rename column responder_id to sender_id;
alter table public.rxlink_responses
  add column attachment_type text,
  add column attachment_data jsonb;

drop policy if exists "admins respond to rxlink requests" on public.rxlink_responses;
create policy "requester or admin sends rxlink thread messages"
  on public.rxlink_responses for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.rxlink_requests r
      where r.id = request_id
        and (r.created_by = auth.uid() or public.is_admin())
    )
  );

-- ----------------------------------------------------------------------
-- Sending a message as the admin is what actually advances the
-- request's progress to 'responded' — mirrors what the client used to
-- do by hand (update the parent row right after inserting a response),
-- moved server-side so it can't be forgotten or done inconsistently
-- for a future caller. A requester's own follow-up never changes
-- status — sending a follow-up isn't progress on the admin's part.
-- Guarded to not downgrade a request that's already rejected or
-- resolved; an admin message after either of those doesn't reopen it.
-- ----------------------------------------------------------------------
create or replace function public.handle_rxlink_response_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    update public.rxlink_requests
    set status = 'responded'
    where id = new.request_id and status not in ('rejected', 'resolved');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rxlink_response_insert on public.rxlink_responses;
create trigger trg_rxlink_response_insert
  after insert on public.rxlink_responses
  for each row execute function public.handle_rxlink_response_insert();

-- ----------------------------------------------------------------------
-- Acknowledge / reject / close — RPCs rather than raw RLS-gated
-- updates, since each only needs to touch one or two specific columns
-- and RLS alone can't cleanly express "this caller may change exactly
-- these columns and no others" without a lot of extra machinery. Same
-- pattern as accept_terms/register_push_subscription earlier this
-- project.
-- ----------------------------------------------------------------------
create or replace function public.acknowledge_rxlink_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can acknowledge a request.';
  end if;
  update public.rxlink_requests
  set status = 'acknowledged', acknowledged_at = now(), acknowledged_by = auth.uid()
  where id = p_request_id and status = 'pending';
end;
$$;

create or replace function public.reject_rxlink_request(p_request_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can reject a request.';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'A reason is required to reject a request.';
  end if;
  update public.rxlink_requests
  set status = 'rejected', rejection_reason = p_reason
  where id = p_request_id and status in ('pending', 'acknowledged', 'responded');
end;
$$;

-- Shared by both close RPCs below — sets status to 'resolved' once
-- both sides have closed, leaving it untouched otherwise (e.g. right
-- after only the requester's side closes, status is still whatever it
-- was — 'pending'/'acknowledged'/'responded' — reflecting that the
-- admin hasn't closed their side yet).
create or replace function public.resolve_rxlink_request_if_both_closed(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rxlink_requests
  set status = 'resolved'
  where id = p_request_id
    and requester_closed_at is not null
    and admin_closed_at is not null
    and status <> 'resolved';
end;
$$;

create or replace function public.close_rxlink_request_as_requester(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rxlink_requests
  set requester_closed_at = now()
  where id = p_request_id
    and created_by = auth.uid()
    and requester_closed_at is null
    and status in ('pending', 'acknowledged', 'responded');
  perform public.resolve_rxlink_request_if_both_closed(p_request_id);
end;
$$;

create or replace function public.close_rxlink_request_as_admin(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can close a request from the admin side.';
  end if;
  update public.rxlink_requests
  set admin_closed_at = now(), admin_closed_by = auth.uid()
  where id = p_request_id
    and admin_closed_at is null
    and status in ('pending', 'acknowledged', 'responded');
  perform public.resolve_rxlink_request_if_both_closed(p_request_id);
end;
$$;

-- The old requester-closes-own-request UPDATE policy operated directly
-- on `status` (pending/responded -> closed) — that whole path is
-- superseded by close_rxlink_request_as_requester above, which the
-- requester's own RLS-checked auth.uid() already scopes correctly
-- inside the function body. Dropping it removes the requester's direct
-- UPDATE access to rxlink_requests entirely — from here on, every
-- requester-side state change goes through an RPC, none through a raw
-- table update.
drop policy if exists "requester closes own rxlink request" on public.rxlink_requests;

grant execute on function public.acknowledge_rxlink_request(uuid) to authenticated;
grant execute on function public.reject_rxlink_request(uuid, text) to authenticated;
grant execute on function public.resolve_rxlink_request_if_both_closed(uuid) to authenticated;
grant execute on function public.close_rxlink_request_as_requester(uuid) to authenticated;
grant execute on function public.close_rxlink_request_as_admin(uuid) to authenticated;