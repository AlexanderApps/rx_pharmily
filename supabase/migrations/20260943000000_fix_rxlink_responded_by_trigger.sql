-- ============================================================================
-- Fix: the rxlink response-insert trigger dropped responded_by/responded_at.
-- ============================================================================
-- The previous migration moved "an admin's message advances status to
-- 'responded'" from client-side code into this trigger, but only carried
-- over the status update — not responded_by/responded_at, which the old
-- client-side code also used to set on every admin message. Without
-- them, the request's "who last responded, and when" summary field goes
-- permanently blank the moment this trigger took over, even as admins
-- keep actively responding.
--
-- This does NOT affect the full conversation thread itself — every
-- admin response and every requester follow-up was already visible to
-- any admin via rxlink_responses' own RLS (scoped to "any admin", not
-- "the specific admin who sent it"), unchanged since RxLink's original
-- migration. This only fixes the parent request's own summary field.
create or replace function public.handle_rxlink_response_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    update public.rxlink_requests
    set status = 'responded', responded_by = new.sender_id, responded_at = now()
    where id = new.request_id and status not in ('rejected', 'resolved');
  end if;
  return new;
end;
$$;
