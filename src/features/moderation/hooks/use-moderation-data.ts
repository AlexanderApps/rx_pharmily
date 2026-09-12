import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";
import { ModerationAction } from "@/features/moderation/types/moderation.types";

const ENTITY_TABLE: Record<ProfileUpdateEntityType, string> = {
  user: "profiles",
  facility: "facilities",
  organization: "organizations",
};

function mapModerationActionRow(row: any): ModerationAction {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actionType: row.action_type,
    reason: row.reason ?? undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    performedBy: row.performed_by ?? undefined,
    performedByName: row.performer?.full_name ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

interface ModerationState {
  // Keyed by `${entityType}:${entityId}` — a screen can hold more than
  // one entity's history in view at once (e.g. an admin browsing
  // between users) without one fetch clobbering another's.
  history: Record<string, ModerationAction[]>;
  isLoading: boolean;

  fetchHistory: (entityType: ProfileUpdateEntityType, entityId: string) => Promise<void>;
  banEntity: (entityType: ProfileUpdateEntityType, entityId: string, reason: string) => Promise<boolean>;
  suspendEntity: (
    entityType: ProfileUpdateEntityType,
    entityId: string,
    reason: string,
    durationDays: number,
  ) => Promise<boolean>;
  // Lifts whichever restriction is currently active (ban or
  // suspension) — the caller doesn't need to know which one, since the
  // mutual-exclusivity check constraint already guarantees at most one
  // is ever true at a time.
  liftRestriction: (entityType: ProfileUpdateEntityType, entityId: string) => Promise<boolean>;
}

export const useModerationStore = create<ModerationState>((set, get) => ({
  history: {},
  isLoading: false,

  fetchHistory: async (entityType, entityId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("account_moderation_actions")
      .select("*, performer:profiles!account_moderation_actions_performed_by_fkey(full_name)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    set({ isLoading: false });
    if (error) {
      console.warn("[moderation] fetchHistory failed:", error.message);
      return;
    }
    set((state) => ({
      history: { ...state.history, [`${entityType}:${entityId}`]: (data ?? []).map(mapModerationActionRow) },
    }));
  },

  banEntity: async (entityType, entityId, reason) => {
    const adminId = await requireUserId();
    const { error: updateError } = await supabase
      .from(ENTITY_TABLE[entityType])
      .update({ is_banned: true, is_suspended: false, suspended_until: null, moderation_reason: reason })
      .eq("id", entityId);
    if (updateError) {
      console.warn("[moderation] banEntity failed:", updateError.message);
      return false;
    }
    const { error: logError } = await supabase.from("account_moderation_actions").insert({
      entity_type: entityType,
      entity_id: entityId,
      action_type: "banned",
      reason,
      performed_by: adminId,
    });
    if (logError) console.warn("[moderation] banEntity audit log failed:", logError.message);
    await get().fetchHistory(entityType, entityId);
    return true;
  },

  suspendEntity: async (entityType, entityId, reason, durationDays) => {
    const adminId = await requireUserId();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const { error: updateError } = await supabase
      .from(ENTITY_TABLE[entityType])
      .update({
        is_suspended: true,
        is_banned: false,
        suspended_until: expiresAt.toISOString(),
        moderation_reason: reason,
      })
      .eq("id", entityId);
    if (updateError) {
      console.warn("[moderation] suspendEntity failed:", updateError.message);
      return false;
    }
    const { error: logError } = await supabase.from("account_moderation_actions").insert({
      entity_type: entityType,
      entity_id: entityId,
      action_type: "suspended",
      reason,
      expires_at: expiresAt.toISOString(),
      performed_by: adminId,
    });
    if (logError) console.warn("[moderation] suspendEntity audit log failed:", logError.message);
    await get().fetchHistory(entityType, entityId);
    return true;
  },

  liftRestriction: async (entityType, entityId) => {
    const adminId = await requireUserId();
    const { data: entityRow, error: fetchError } = await supabase
      .from(ENTITY_TABLE[entityType])
      .select("is_banned, is_suspended")
      .eq("id", entityId)
      .maybeSingle();
    if (fetchError || !entityRow) {
      console.warn("[moderation] liftRestriction failed to read current status:", fetchError?.message);
      return false;
    }
    if (!entityRow.is_banned && !entityRow.is_suspended) return true; // nothing to lift

    const { error: updateError } = await supabase
      .from(ENTITY_TABLE[entityType])
      .update({ is_banned: false, is_suspended: false, suspended_until: null, moderation_reason: null })
      .eq("id", entityId);
    if (updateError) {
      console.warn("[moderation] liftRestriction failed:", updateError.message);
      return false;
    }
    const { error: logError } = await supabase.from("account_moderation_actions").insert({
      entity_type: entityType,
      entity_id: entityId,
      action_type: entityRow.is_banned ? "unbanned" : "unsuspended",
      performed_by: adminId,
    });
    if (logError) console.warn("[moderation] liftRestriction audit log failed:", logError.message);
    await get().fetchHistory(entityType, entityId);
    return true;
  },
}));
