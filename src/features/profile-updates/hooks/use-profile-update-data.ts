import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import {
  ProfileUpdateAuditEvent,
  ProfileUpdateEntityType,
  ProfileUpdateRequest,
  ProfileUpdateRequestFormData,
} from "@/features/profile-updates/types/profile-update.types";

// changes/previousValues use the app's own camelCase field keys (see
// LOCKED_FIELDS) — this is what actually writes them to the right DB
// column per entity type at merge time. organization.location is the
// one deliberate exception, mapping to headquarters_location rather
// than a same-named column.
const FIELD_TO_COLUMN: Record<ProfileUpdateEntityType, Record<string, string>> = {
  user: {
    fullName: "full_name",
    phone: "phone",
    profession: "profession",
    title: "title",
    licenseNumber: "license_number",
    role: "role",
  },
  facility: {
    name: "name",
    type: "type",
    location: "location",
    region: "region",
    address: "address",
    phone: "phone",
    email: "email",
    registrationNumber: "registration_number",
  },
  organization: {
    name: "name",
    type: "type",
    location: "headquarters_location",
    region: "region",
    address: "address",
    phone: "phone",
    email: "email",
  },
};

const ENTITY_TABLE: Record<ProfileUpdateEntityType, string> = {
  user: "profiles",
  facility: "facilities",
  organization: "organizations",
};

function mapRequestRow(row: any): ProfileUpdateRequest {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestedBy: row.requested_by,
    changes: row.changes ?? {},
    previousValues: row.previous_values ?? {},
    supportingDocuments: row.supporting_documents ?? [],
    status: row.status,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    mergedAt: row.merged_at ? new Date(row.merged_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapEventRow(row: any): ProfileUpdateAuditEvent {
  return {
    id: row.id,
    requestId: row.request_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorName: row.actor?.full_name ?? "Unknown",
    comment: row.comment ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

interface ProfileUpdateState {
  // Requests relevant to the current viewer — either their own
  // (requested_by = them) or, for an admin, the full queue. Which one
  // populates this depends on which fetch function was called; kept as
  // a single list rather than two, since a screen only ever needs one
  // of these at a time.
  requests: ProfileUpdateRequest[];
  auditEvents: Record<string, ProfileUpdateAuditEvent[]>;
  isLoading: boolean;

  fetchMyRequests: (entityType: ProfileUpdateEntityType, entityId: string) => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchAuditTrail: (requestId: string) => Promise<void>;

  submitRequest: (data: ProfileUpdateRequestFormData) => Promise<boolean>;
  approveRequest: (id: string, comment?: string) => Promise<boolean>;
  rejectRequest: (id: string, comment: string) => Promise<boolean>;
  mergeRequest: (id: string) => Promise<boolean>;
}

export const useProfileUpdateStore = create<ProfileUpdateState>((set, get) => ({
  requests: [],
  auditEvents: {},
  isLoading: false,

  fetchMyRequests: async (entityType, entityId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("profile_update_requests")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[profile-updates] fetchMyRequests failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ requests: (data ?? []).map(mapRequestRow), isLoading: false });
  },

  fetchPendingRequests: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("profile_update_requests")
      .select("*")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[profile-updates] fetchPendingRequests failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ requests: (data ?? []).map(mapRequestRow), isLoading: false });
  },

  fetchAuditTrail: async (requestId) => {
    const { data, error } = await supabase
      .from("profile_update_request_events")
      .select("*, actor:profiles!profile_update_request_events_actor_id_fkey(full_name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[profile-updates] fetchAuditTrail failed:", error.message);
      return;
    }
    set((state) => ({
      auditEvents: { ...state.auditEvents, [requestId]: (data ?? []).map(mapEventRow) },
    }));
  },

  submitRequest: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("profile_update_requests")
      .insert({
        entity_type: data.entityType,
        entity_id: data.entityId,
        requested_by: userId,
        changes: data.changes,
        previous_values: data.previousValues,
        supporting_documents: data.supportingDocuments,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[profile-updates] submitRequest failed:", error?.message);
      return false;
    }
    await supabase.from("profile_update_request_events").insert({
      request_id: row.id,
      event_type: "submitted",
      actor_id: userId,
    });
    set((state) => ({ requests: [mapRequestRow(row), ...state.requests] }));
    return true;
  },

  approveRequest: async (id, comment) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("profile_update_requests")
      .update({ status: "approved", review_comment: comment ?? null, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[profile-updates] approveRequest failed:", error.message);
      return false;
    }
    await supabase.from("profile_update_request_events").insert({
      request_id: id,
      event_type: "approved",
      actor_id: userId,
      comment: comment ?? null,
    });
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, status: "approved", reviewComment: comment, reviewedBy: userId, reviewedAt: new Date() } : r)),
    }));
    return true;
  },

  rejectRequest: async (id, comment) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("profile_update_requests")
      .update({ status: "rejected", review_comment: comment, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[profile-updates] rejectRequest failed:", error.message);
      return false;
    }
    await supabase.from("profile_update_request_events").insert({
      request_id: id,
      event_type: "rejected",
      actor_id: userId,
      comment,
    });
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, status: "rejected", reviewComment: comment, reviewedBy: userId, reviewedAt: new Date() } : r)),
    }));
    return true;
  },

  // Applies changes onto the actual entity row. Deliberately a separate
  // step from approveRequest — same reasoning as formulary requests'
  // approve-then-merge split — an admin can approve based on the
  // supporting documents without that same action being the one that
  // actually writes to a live profiles/facilities/organizations row.
  mergeRequest: async (id) => {
    const request = get().requests.find((r) => r.id === id);
    if (!request || request.status !== "approved") return false;

    const columnMap = FIELD_TO_COLUMN[request.entityType];
    const patch: Record<string, string | null> = {};
    for (const [fieldKey, value] of Object.entries(request.changes)) {
      const column = columnMap[fieldKey];
      if (column) patch[column] = value;
    }
    if (Object.keys(patch).length === 0) return false;

    const { error: mergeError } = await supabase
      .from(ENTITY_TABLE[request.entityType])
      .update(patch)
      .eq("id", request.entityId);
    if (mergeError) {
      console.warn("[profile-updates] mergeRequest failed:", mergeError.message);
      return false;
    }

    // phone_admin_approved has to be set in a SEPARATE update, after
    // the phone change above has already landed — the DB's own
    // clear-on-change trigger (20260921000000_phone_admin_approval.sql)
    // resets phone_admin_approved to false whenever phone changes,
    // specifically so a stray direct edit can't silently carry the
    // "admin approved" status over to a different number. Setting it
    // true in the SAME statement as the phone change itself would just
    // have that trigger clear it right back out before the row is even
    // written; this second statement doesn't touch phone, so the
    // trigger's condition never fires here.
    if ("phone" in request.changes) {
      const { error: approvalError } = await supabase
        .from(ENTITY_TABLE[request.entityType])
        .update({ phone_admin_approved: true })
        .eq("id", request.entityId);
      if (approvalError) {
        console.warn("[profile-updates] mergeRequest (phone approval) failed:", approvalError.message);
      }
    }

    const userId = await requireUserId();
    const { error } = await supabase
      .from("profile_update_requests")
      .update({ status: "merged", merged_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[profile-updates] mergeRequest (status update) failed:", error.message);
      return false;
    }
    await supabase.from("profile_update_request_events").insert({
      request_id: id,
      event_type: "merged",
      actor_id: userId,
    });
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, status: "merged", mergedAt: new Date() } : r)),
    }));

    // Refresh local profile state for the merged entity — same stores
    // other profile mutations already update, so this doesn't require a
    // full page reload to show the change.
    if (request.entityType === "user" && request.entityId === useProfileStore.getState().user.id) {
      await useProfileStore.getState().fetchMyProfile();
    } else if (request.entityType === "facility") {
      await useProfileStore.getState().fetchFacilities();
    } else if (request.entityType === "organization") {
      await useProfileStore.getState().fetchOrganizations();
    }
    return true;
  },
}));
