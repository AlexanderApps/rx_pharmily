-- ============================================================================
-- Ad moderation, part 2: reports table, tightened update RLS, and a safe
-- self-serve lifecycle RPC. See part 1 for why this is a separate file.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ad_reports — any authenticated user reports an ad; admins see and
-- resolve the queue. Same "Pattern C" shape already used for
-- report_tickets (reporter sees own, admin sees/manages all), scoped to
-- a specific ad via ad_id rather than report_tickets' free-text
-- reported_user field, so the moderation screen can group reports by ad.
-- Deliberately NOT visible to the ad's own owner/advertiser — same
-- reasoning as report_tickets not exposing reporter identity to the
-- reported party, to avoid enabling retaliation against reporters.
-- ----------------------------------------------------------------------------
create type ad_report_status as enum ('open', 'dismissed');

create table public.ad_reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id),
  reason text not null,
  status ad_report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz
);

alter table public.ad_reports enable row level security;

create policy "reporter sees own reports, admin sees all"
  on public.ad_reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "users report ads"
  on public.ad_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "admin resolves reports"
  on public.ad_reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Close the RLS gap: the old "advertiser updates own ad, admin moderates
-- any" policy let an owner's update set status to anything at all (the
-- policy only checked WHO could write, not WHAT they could write). Split
-- into two policies: admin keeps full latitude; an owner's own direct
-- update is now restricted to editing content while pending/rejected
-- (matching updateAd()'s existing "any edit resubmits to pending"
-- behavior) — status transitions beyond that go through the RPC below,
-- which validates the specific old-status -> new-status transition
-- server-side (something a plain RLS with-check can't express, since it
-- only sees the new row, not what the row looked like before the write).
-- ----------------------------------------------------------------------------
drop policy "advertiser updates own ad, admin moderates any" on public.ads;

create policy "admin moderates any ad"
  on public.ads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "advertiser edits own ad while pending or rejected"
  on public.ads for update
  to authenticated
  using (advertiser_id = auth.uid() and status in ('pending', 'rejected'))
  with check (advertiser_id = auth.uid() and status = 'pending');

-- ----------------------------------------------------------------------------
-- set_own_ad_lifecycle — the only way an owner can move their ad between
-- 'approved' <-> 'inactive' <-> 'closed'. security definer so it can
-- perform the actual update regardless of the (now much narrower) RLS
-- policy above; safe because the function itself re-checks ownership and
-- validates the exact transition before writing anything.
-- ----------------------------------------------------------------------------
create or replace function public.set_own_ad_lifecycle(p_ad_id uuid, p_new_status ad_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_current ad_status;
begin
  select advertiser_id, status into v_owner, v_current
  from public.ads
  where id = p_ad_id;

  if v_owner is null then
    raise exception 'Ad not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized to manage this ad';
  end if;

  if p_new_status = 'inactive' and v_current = 'approved' then
    -- pause
    null;
  elsif p_new_status = 'approved' and v_current = 'inactive' then
    -- resume
    null;
  elsif p_new_status = 'closed' and v_current in ('approved', 'inactive') then
    -- permanent close
    null;
  else
    raise exception 'Invalid ad status transition from % to %', v_current, p_new_status;
  end if;

  update public.ads set status = p_new_status where id = p_ad_id;
end;
$$;

grant execute on function public.set_own_ad_lifecycle(uuid, ad_status) to authenticated;
