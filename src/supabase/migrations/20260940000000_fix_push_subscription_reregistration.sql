-- ============================================================================
-- Fix: registering a push token that already belongs to a different
-- user fails with an RLS violation.
-- ============================================================================
-- push_subscriptions' "users manage their own push subscriptions"
-- policy (using/with check both user_id = auth.uid()) is correct for
-- direct reads/writes to a person's own rows. The problem is how the
-- client registers a token: an upsert with onConflict on
-- expo_push_token/web_endpoint. A push token is tied to the physical
-- device + app install, not the account signed into it — so it's
-- entirely normal for the same token to already exist in the table
-- under a DIFFERENT user_id (a previous sign-in on a shared device, or
-- switching between test accounts on the same emulator during
-- development). When that happens, Postgres's upsert falls through to
-- an UPDATE of the existing (differently-owned) row, which the
-- same-user-only policy correctly blocks — that's the exact "new row
-- violates row-level security policy (USING expression)" error, not a
-- misconfigured policy.
--
-- The fix isn't to relax the policy (that would let anyone reassign
-- anyone else's push subscription) — it's to stop relying on a plain
-- client-side upsert for this specific case. This function does the
-- delete-then-insert as one atomic, security definer operation: delete
-- whatever row currently holds this exact token/endpoint (regardless
-- of who owns it), then insert a fresh row for auth.uid(). It's safe
-- despite bypassing RLS because it only ever assigns to auth.uid()
-- itself, never a client-supplied user id — a caller can only ever
-- "steal" a registration by already being signed in as themselves and
-- supplying a token, which is exactly the legitimate re-registration
-- case this fixes, not a privilege escalation.
create or replace function public.register_push_subscription(
  p_platform text,
  p_expo_push_token text default null,
  p_web_endpoint text default null,
  p_web_p256dh text default null,
  p_web_auth text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to register a push subscription.';
  end if;

  if p_expo_push_token is not null then
    delete from public.push_subscriptions where expo_push_token = p_expo_push_token;
  end if;
  if p_web_endpoint is not null then
    delete from public.push_subscriptions where web_endpoint = p_web_endpoint;
  end if;

  insert into public.push_subscriptions (user_id, platform, expo_push_token, web_endpoint, web_p256dh, web_auth, updated_at)
  values (auth.uid(), p_platform, p_expo_push_token, p_web_endpoint, p_web_p256dh, p_web_auth, now());
end;
$$;

grant execute on function public.register_push_subscription(text, text, text, text, text) to authenticated;
