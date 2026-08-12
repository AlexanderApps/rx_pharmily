-- ============================================================================
-- Superadmin bootstrap fix
-- ============================================================================
-- The original trigger required the actor to already be a superadmin
-- before changing anyone's role — correct once the system is running, but
-- it also blocked the very first promotion, since nobody could ever
-- satisfy is_superadmin() before anyone held that role. A fresh database
-- had no way to ever create its first superadmin at all.
--
-- Fix: a self-closing bootstrap window. While zero superadmins exist,
-- promoting someone TO superadmin is allowed regardless of who's asking.
-- The moment any superadmin exists, this path is gone — it's not a
-- standing bypass, just a one-time escape hatch for a state that can only
-- occur once (or again later, if every superadmin account is ever fully
-- deleted, which is the correct recovery behavior in that case too).

create or replace function public.protect_account_role_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  superadmin_count integer;
begin
  if new.account_role is distinct from old.account_role then
    select count(*) into superadmin_count from public.profiles where account_role = 'superadmin';

    if superadmin_count = 0 and new.account_role = 'superadmin' then
      return new;
    end if;

    if not public.is_superadmin() then
      raise exception 'Only a superadmin can change account roles.';
    end if;

    if new.account_role = 'superadmin' and superadmin_count >= 5 then
      raise exception 'There can be at most 5 superadmins at a time.';
    end if;

    if old.account_role = 'superadmin' and new.account_role <> 'superadmin' and superadmin_count <= 1 then
      raise exception 'At least one superadmin must remain.';
    end if;
  end if;

  return new;
end;
$$;
