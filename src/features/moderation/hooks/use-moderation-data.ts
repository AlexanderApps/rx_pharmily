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

// Deliberately loose/partial rather than 3 separate per-type
// interfaces — the moderation-detail screen's Details section renders
// whichever of these fields came back for this entity's actual type,
// so one flexible shape is simpler than 3 parallel ones with mostly
// overlapping fields (phone, email, kyc timestamps, created_at).
export interface EntityDetails {
  phone?: string;
  email?: string;
  createdAt: Date;
  kycSubmittedAt?: Date;
  kycReviewedAt?: Date;
  kycReviewedByName?: string;
  kycRejectionReason?: string;
  // user-only
  role?: string;
  licenseNumber?: string;
  bio?: string;
  region?: string;
  title?: string;
  termsAcceptedAt?: Date;
  // facility-only
  facilityType?: string;
  location?: string;
  address?: string;
  registrationNumber?: string;
  organizationName?: string;
  adminName?: string;
  // organization-only
  organizationType?: string;
  headquartersLocation?: string;
}

// One flexible shape here too — a facility's "activity" (RFQs,
// donations, MediScope requests posted) and a user's (facilities
// they're a member of) mean different things, but both render the
// same way: a short list of labeled counts, expandable to the actual
// items behind the top one.
export interface EntityActivityItem {
  label: string;
  count: number;
  recentTitles: string[];
}

interface ModerationState {
  // Keyed by `${entityType}:${entityId}` — a screen can hold more than
  // one entity's history in view at once (e.g. an admin browsing
  // between users) without one fetch clobbering another's.
  history: Record<string, ModerationAction[]>;
  isLoading: boolean;

  // Both lazy — populated only when the moderation-detail screen's
  // corresponding expander is opened, not on mount. Same keying as
  // history, for the same reason.
  entityDetails: Record<string, EntityDetails>;
  isLoadingDetails: boolean;
  fetchEntityDetails: (entityType: ProfileUpdateEntityType, entityId: string) => Promise<void>;

  entityActivity: Record<string, EntityActivityItem[]>;
  isLoadingActivity: boolean;
  fetchEntityActivity: (entityType: ProfileUpdateEntityType, entityId: string) => Promise<void>;

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
  entityDetails: {},
  isLoadingDetails: false,
  entityActivity: {},
  isLoadingActivity: false,

  fetchEntityDetails: async (entityType, entityId) => {
    set({ isLoadingDetails: true });
    const key = `${entityType}:${entityId}`;

    let details: EntityDetails | null = null;
    let reviewerId: string | undefined;

    if (entityType === "user") {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone, email, role, license_number, bio, region, title, created_at, kyc_submitted_at, kyc_reviewed_at, kyc_reviewed_by, kyc_rejection_reason, terms_accepted_at")
        .eq("id", entityId)
        .maybeSingle();
      if (error || !data) {
        console.warn("[moderation] fetchEntityDetails (user) failed:", error?.message);
        set({ isLoadingDetails: false });
        return;
      }
      reviewerId = data.kyc_reviewed_by ?? undefined;
      details = {
        phone: data.phone ?? undefined,
        email: data.email,
        role: data.role ?? undefined,
        licenseNumber: data.license_number ?? undefined,
        bio: data.bio ?? undefined,
        region: data.region ?? undefined,
        title: data.title ?? undefined,
        createdAt: new Date(data.created_at),
        kycSubmittedAt: data.kyc_submitted_at ? new Date(data.kyc_submitted_at) : undefined,
        kycReviewedAt: data.kyc_reviewed_at ? new Date(data.kyc_reviewed_at) : undefined,
        kycRejectionReason: data.kyc_rejection_reason ?? undefined,
        termsAcceptedAt: data.terms_accepted_at ? new Date(data.terms_accepted_at) : undefined,
      };
    } else if (entityType === "facility") {
      const { data, error } = await supabase
        .from("facilities")
        .select("phone, email, type, location, address, registration_number, created_at, kyc_submitted_at, kyc_reviewed_at, kyc_reviewed_by, kyc_rejection_reason, organization_id, admin_user_id")
        .eq("id", entityId)
        .maybeSingle();
      if (error || !data) {
        console.warn("[moderation] fetchEntityDetails (facility) failed:", error?.message);
        set({ isLoadingDetails: false });
        return;
      }
      reviewerId = data.kyc_reviewed_by ?? undefined;
      const [orgResult, adminResult] = await Promise.all([
        data.organization_id
          ? supabase.from("organizations").select("name").eq("id", data.organization_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("profiles").select("full_name").eq("id", data.admin_user_id).maybeSingle(),
      ]);
      details = {
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        facilityType: data.type,
        location: data.location,
        address: data.address ?? undefined,
        registrationNumber: data.registration_number ?? undefined,
        createdAt: new Date(data.created_at),
        kycSubmittedAt: data.kyc_submitted_at ? new Date(data.kyc_submitted_at) : undefined,
        kycReviewedAt: data.kyc_reviewed_at ? new Date(data.kyc_reviewed_at) : undefined,
        kycRejectionReason: data.kyc_rejection_reason ?? undefined,
        organizationName: orgResult.data?.name ?? undefined,
        adminName: adminResult.data?.full_name ?? undefined,
      };
    } else {
      const { data, error } = await supabase
        .from("organizations")
        .select("phone, email, type, headquarters_location, registration_number, created_at, kyc_submitted_at, kyc_reviewed_at, kyc_reviewed_by, kyc_rejection_reason, admin_user_id")
        .eq("id", entityId)
        .maybeSingle();
      if (error || !data) {
        console.warn("[moderation] fetchEntityDetails (organization) failed:", error?.message);
        set({ isLoadingDetails: false });
        return;
      }
      reviewerId = data.kyc_reviewed_by ?? undefined;
      const { data: admin } = await supabase.from("profiles").select("full_name").eq("id", data.admin_user_id).maybeSingle();
      details = {
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        organizationType: data.type,
        headquartersLocation: data.headquarters_location ?? undefined,
        registrationNumber: data.registration_number ?? undefined,
        createdAt: new Date(data.created_at),
        kycSubmittedAt: data.kyc_submitted_at ? new Date(data.kyc_submitted_at) : undefined,
        kycReviewedAt: data.kyc_reviewed_at ? new Date(data.kyc_reviewed_at) : undefined,
        kycRejectionReason: data.kyc_rejection_reason ?? undefined,
        adminName: admin?.full_name ?? undefined,
      };
    }

    if (reviewerId) {
      const { data: reviewer } = await supabase.from("profiles").select("full_name").eq("id", reviewerId).maybeSingle();
      if (reviewer) details.kycReviewedByName = reviewer.full_name;
    }

    set((state) => ({ entityDetails: { ...state.entityDetails, [key]: details! }, isLoadingDetails: false }));
  },

  fetchEntityActivity: async (entityType, entityId) => {
    set({ isLoadingActivity: true });
    const key = `${entityType}:${entityId}`;
    const items: EntityActivityItem[] = [];

    if (entityType === "facility") {
      const [rfqs, donations, mediscope] = await Promise.all([
        supabase.from("rxrfqs").select("code").eq("facility_id", entityId).order("created_at", { ascending: false }).limit(5),
        supabase.from("donations").select("code").eq("facility_id", entityId).order("created_at", { ascending: false }).limit(5),
        supabase.from("mediscope_requests").select("code").eq("facility_id", entityId).order("created_at", { ascending: false }).limit(5),
      ]);
      items.push(
        { label: "RxRFQs posted", count: rfqs.data?.length ?? 0, recentTitles: (rfqs.data ?? []).map((r) => r.code) },
        { label: "Donations posted", count: donations.data?.length ?? 0, recentTitles: (donations.data ?? []).map((r) => r.code) },
        { label: "MediScope requests", count: mediscope.data?.length ?? 0, recentTitles: (mediscope.data ?? []).map((r) => r.code) },
      );
    } else if (entityType === "user") {
      const [jobs, memberships] = await Promise.all([
        supabase.from("jobs").select("title").eq("posted_by", entityId).order("created_at", { ascending: false }).limit(5),
        supabase
          .from("facility_memberships")
          .select("facility:facilities(name)")
          .eq("user_id", entityId)
          .limit(5),
      ]);
      items.push(
        { label: "Jobs posted", count: jobs.data?.length ?? 0, recentTitles: (jobs.data ?? []).map((j) => j.title) },
        {
          label: "Facility memberships",
          count: memberships.data?.length ?? 0,
          recentTitles: (memberships.data ?? []).map((m: any) => m.facility?.name).filter(Boolean),
        },
      );
    } else {
      const { data: facilities } = await supabase
        .from("facilities")
        .select("name")
        .eq("organization_id", entityId)
        .order("created_at", { ascending: false })
        .limit(10);
      items.push({
        label: "Member facilities",
        count: facilities?.length ?? 0,
        recentTitles: (facilities ?? []).map((f) => f.name),
      });
    }

    set((state) => ({ entityActivity: { ...state.entityActivity, [key]: items }, isLoadingActivity: false }));
  },

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
