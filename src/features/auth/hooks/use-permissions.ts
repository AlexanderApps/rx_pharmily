import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";

export interface PermissionCatalogEntry {
  key: string;
  description: string;
  category: string;
}

export interface UserPermissionOverride {
  permissionKey: string;
  granted: boolean;
  reason?: string;
  createdAt: Date;
}

type PermissionsStore = {
  // Record<permission_key, granted> — the fully-resolved set (role
  // default, with any per-user override already applied) for the
  // current signed-in user. Not a live/reactive computation — fetched
  // once per session (see fetchPermissions), same pattern as
  // notification settings.
  permissions: Record<string, boolean>;
  isLoading: boolean;
  hasFetched: boolean;

  fetchPermissions: () => Promise<void>;

  // Missing key = not in the catalog at all → false, not an error. A
  // permission check for something that was never seeded should fail
  // closed, not throw or silently pass.
  hasPermission: (key: string) => boolean;

  // ---- Admin-facing: managing OTHER users' permissions ----------------
  catalog: PermissionCatalogEntry[];
  fetchCatalog: () => Promise<void>;

  // The user currently being managed on the admin screen — both the
  // fully-resolved effective set (role + overrides already combined,
  // via the same get_user_permissions RPC fetchPermissions uses, just
  // for someone else's id) and the raw override rows specifically, so
  // the UI can show "role default" vs "explicit override" as genuinely
  // different states, not just a single granted/denied bit.
  targetUserEffective: Record<string, boolean>;
  targetUserOverrides: UserPermissionOverride[];
  targetUserBaseRole: string | null;
  fetchTargetUser: (userId: string) => Promise<void>;

  setOverride: (
    userId: string,
    permissionKey: string,
    granted: boolean,
    reason?: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  clearOverride: (userId: string, permissionKey: string) => Promise<{ ok: boolean; error?: string }>;
};

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  permissions: {},
  isLoading: false,
  hasFetched: false,
  catalog: [],
  targetUserEffective: {},
  targetUserOverrides: [],
  targetUserBaseRole: null,

  fetchPermissions: async () => {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch {
      // Same transient-session reasoning as fetchMyProfile/fetchSettings
      // elsewhere in this app — can happen for a moment during rapid
      // account switching, not worth surfacing as an error.
      console.warn("[permissions] fetchPermissions skipped: not signed in (yet)");
      return;
    }

    set({ isLoading: true });
    const { data, error } = await supabase.rpc("get_user_permissions", { p_user_id: userId });
    if (error) {
      console.warn("[permissions] fetchPermissions failed:", error.message);
      set({ isLoading: false });
      return;
    }

    const permissions: Record<string, boolean> = {};
    for (const row of data ?? []) {
      permissions[row.permission_key] = row.granted;
    }
    set({ permissions, isLoading: false, hasFetched: true });
  },

  hasPermission: (key) => get().permissions[key] ?? false,

  fetchCatalog: async () => {
    const { data, error } = await supabase
      .from("permissions")
      .select("key, description, category")
      .order("category")
      .order("key");
    if (error) {
      console.warn("[permissions] fetchCatalog failed:", error.message);
      return;
    }
    set({
      catalog: (data ?? []).map((row) => ({
        key: row.key,
        description: row.description,
        category: row.category,
      })),
    });
  },

  fetchTargetUser: async (userId) => {
    const [effectiveResult, overridesResult, roleResult] = await Promise.all([
      supabase.rpc("get_user_permissions", { p_user_id: userId }),
      supabase
        .from("user_permission_overrides")
        .select("permission_key, granted, reason, created_at")
        .eq("user_id", userId),
      supabase.rpc("get_user_base_role", { p_user_id: userId }),
    ]);

    if (effectiveResult.error) {
      console.warn("[permissions] fetchTargetUser (effective) failed:", effectiveResult.error.message);
    }
    if (overridesResult.error) {
      console.warn("[permissions] fetchTargetUser (overrides) failed:", overridesResult.error.message);
    }
    if (roleResult.error) {
      console.warn("[permissions] fetchTargetUser (base role) failed:", roleResult.error.message);
    }

    const effective: Record<string, boolean> = {};
    for (const row of effectiveResult.data ?? []) {
      effective[row.permission_key] = row.granted;
    }

    const overrides: UserPermissionOverride[] = (overridesResult.data ?? []).map((row) => ({
      permissionKey: row.permission_key,
      granted: row.granted,
      reason: row.reason ?? undefined,
      createdAt: new Date(row.created_at),
    }));

    set({
      targetUserEffective: effective,
      targetUserOverrides: overrides,
      targetUserBaseRole: roleResult.data ?? null,
    });
  },

  setOverride: async (userId, permissionKey, granted, reason) => {
    const adminId = await requireUserId();
    const { error } = await supabase.from("user_permission_overrides").upsert(
      {
        user_id: userId,
        permission_key: permissionKey,
        granted,
        reason: reason?.trim() || null,
        created_by: adminId,
      },
      { onConflict: "user_id,permission_key" },
    );
    if (error) {
      console.warn("[permissions] setOverride failed:", error.message);
      return { ok: false, error: error.message };
    }
    await get().fetchTargetUser(userId);
    return { ok: true };
  },

  clearOverride: async (userId, permissionKey) => {
    const { error } = await supabase
      .from("user_permission_overrides")
      .delete()
      .eq("user_id", userId)
      .eq("permission_key", permissionKey);
    if (error) {
      console.warn("[permissions] clearOverride failed:", error.message);
      return { ok: false, error: error.message };
    }
    await get().fetchTargetUser(userId);
    return { ok: true };
  },
}));

