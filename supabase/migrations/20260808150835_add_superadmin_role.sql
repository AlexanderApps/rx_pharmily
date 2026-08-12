-- Add the new role first.
-- This migration must commit before the value is used elsewhere.

alter type public.account_role
add value 'superadmin';