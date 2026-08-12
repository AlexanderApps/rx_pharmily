// Real Supabase Auth — session/user come straight from @supabase/supabase-js
// (Session, User). This file only adds the app-specific shape layered on
// top: the row from public.profiles for the signed-in user, which is what
// screens actually read for display name, role, and KYC status.

import type { Session, User } from "@supabase/supabase-js";
export type { Session, User };

export type AccountRole = "user" | "admin" | "superadmin";

// Every "is this user an admin" check in the app should go through this —
// superadmin satisfies it too (same as the database's is_admin(), which
// treats both the same way), so this is the one place that needs to
// change if the role hierarchy ever grows another tier.
export function isAdminRole(role: AccountRole | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperadminRole(role: AccountRole | undefined): boolean {
  return role === "superadmin";
}
export type ProfileKycStatus = "unverified" | "pending" | "verified" | "rejected";

// Mirrors the columns read from public.profiles — see
// supabase/migrations/20260804000000_initial_schema.sql.
export interface AuthProfile {
  id: string;
  fullName: string;
  email: string;
  accountRole: AccountRole;
  kycStatus: ProfileKycStatus;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
}
