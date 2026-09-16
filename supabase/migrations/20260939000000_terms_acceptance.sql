-- ============================================================================
-- Terms of Service / Privacy Policy acceptance.
-- ============================================================================
-- terms_accepted_at is the actual gate: null means never accepted,
-- non-null is when. terms_version is recorded alongside it so a future
-- material change to the EULA/privacy policy has something to compare
-- against (not wired to any re-consent flow yet — that's a real, larger
-- feature of its own if/when the documents actually change materially;
-- this migration only lays the groundwork by making sure the version
-- accepted is on record from day one, rather than needing a backfill
-- later when it turns out to matter).

alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text;

-- ----------------------------------------------------------------------
-- Enforced server-side, not just client-side — same reasoning as every
-- other invariant this app doesn't trust the client alone for (the
-- profession-admin-only trigger, the superintendent-requires-pharmacist
-- trigger). raw_user_meta_data is client-supplied, so a raised
-- exception here is what actually stops account creation without
-- acceptance, not just a disabled button. This trigger is AFTER INSERT
-- on auth.users, but Postgres still rolls back the whole transaction
-- (auth.users row included) if it raises — so a rejected signup here
-- genuinely fails, not just leaves a profile in a bad state.
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false) is not true then
    raise exception 'Terms of Service and Privacy Policy must be accepted to create an account.';
  end if;

  insert into public.profiles (id, full_name, email, terms_accepted_at, terms_version)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    now(),
    new.raw_user_meta_data ->> 'terms_version'
  );
  return new;
end;
$$;

-- ----------------------------------------------------------------------
-- Retroactive acceptance for accounts created before this migration —
-- their terms_accepted_at is null and would otherwise have no path to
-- ever become non-null. A dedicated RPC rather than a raw client
-- update to profiles.terms_accepted_at: the timestamp is always set
-- server-side (now()), not a client-supplied value, so it stays
-- trustworthy the same way the trigger-set value at signup is.
-- ----------------------------------------------------------------------
create or replace function public.accept_terms(p_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set terms_accepted_at = now(), terms_version = p_version
  where id = auth.uid();
end;
$$;
