import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { SupportingDocument } from "@/features/profile-updates/types/profile-update.types";
import {
  OwnershipTransferEntityType,
  OwnershipTransferEvent,
  OwnershipTransferRequest,
} from "@/features/ownership-transfer/types/ownership-transfer.types";

const ENTITY_TABLE: Record<OwnershipTransferEntityType, string> = {
  facility: "facilities",
  organization: "organizations",
};

const ENTITY_PROFILE_ROUTE: Record<OwnershipTransferEntityType, string> = {
  facility: "/profile/facility-profile",
  organization: "/profile/organization-profile",
};

function mapRequestRow(row: any): OwnershipTransferRequest {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestedBy: row.requested_by,
    requestedByName: row.requester?.full_name ?? undefined,
    reason: row.reason,
    supportingDocuments: row.supporting_documents ?? [],
    status: row.status,
    adminComment: row.admin_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapEventRow(row: any): OwnershipTransferEvent {
  return {
    id: row.id,
    requestId: row.request_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorName: row.actor?.full_name ?? undefined,
    comment: row.comment ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

interface FinalizeOwnershipRequestInput {
  requestId: string;
  reason: string;
  supportingDocuments: SupportingDocument[];
}

interface OwnershipTransferState {
  // Same single-list convention as useProfileUpdateStore — populated by
  // whichever fetch function was last called (the requester's own
  // history, or an admin's full pending queue), never both at once.
  requests: OwnershipTransferRequest[];
  auditEvents: Record<string, OwnershipTransferEvent[]>;
  isLoading: boolean;

  fetchMyRequests: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchAuditTrail: (requestId: string) => Promise<void>;

  // Two-step, deliberately — a supporting document's storage path is
  // scoped by request id (see the storage helper's own comment on why
  // it can't be scoped by entity the way profile-update documents are),
  // so a request row has to exist before any document can be uploaded
  // against it. createDraftRequest makes that row (empty reason,
  // no documents, not yet logged as 'submitted') purely so its id
  // exists for uploads to target; finalizeRequest is the real
  // submission moment — it fills in the actual reason/documents and is
  // what actually logs the 'submitted' audit event. A request that
  // never reaches finalizeRequest (someone opens the form, then
  // abandons it) sits as an empty, undocumented draft an admin would
  // simply see has nothing to review — not attempted to auto-clean up
  // here, since that's a housekeeping concern, not a correctness one.
  createDraftRequest: (entityType: OwnershipTransferEntityType, entityId: string) => Promise<{ ok: boolean; requestId?: string; error?: string }>;
  finalizeRequest: (data: FinalizeOwnershipRequestInput) => Promise<boolean>;
  approveRequest: (id: string, comment: string) => Promise<boolean>;
  rejectRequest: (id: string, comment: string) => Promise<boolean>;
}

export const useOwnershipTransferStore = create<OwnershipTransferState>((set, get) => ({
  requests: [],
  auditEvents: {},
  isLoading: false,

  fetchMyRequests: async () => {
    const userId = await requireUserId();
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("ownership_transfer_requests")
      .select("*")
      .eq("requested_by", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[ownership-transfer] fetchMyRequests failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ requests: (data ?? []).map(mapRequestRow), isLoading: false });
  },

  fetchPendingRequests: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("ownership_transfer_requests")
      .select("*, requester:profiles!ownership_transfer_requests_requested_by_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[ownership-transfer] fetchPendingRequests failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ requests: (data ?? []).map(mapRequestRow), isLoading: false });
  },

  fetchAuditTrail: async (requestId) => {
    const { data, error } = await supabase
      .from("ownership_transfer_events")
      .select("*, actor:profiles!ownership_transfer_events_actor_id_fkey(full_name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[ownership-transfer] fetchAuditTrail failed:", error.message);
      return;
    }
    set((state) => ({
      auditEvents: { ...state.auditEvents, [requestId]: (data ?? []).map(mapEventRow) },
    }));
  },

  createDraftRequest: async (entityType, entityId) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("ownership_transfer_requests")
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        requested_by: userId,
        // A placeholder — real content is filled in by finalizeRequest.
        // The column is not null, so an empty string rather than
        // omitting it, since this row only exists to give document
        // uploads somewhere to target before the actual submission.
        reason: "",
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[ownership-transfer] createDraftRequest failed:", error?.message);
      return { ok: false, error: error?.message ?? "Couldn't start request" };
    }
    return { ok: true, requestId: row.id };
  },

  finalizeRequest: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("ownership_transfer_requests")
      .update({ reason: data.reason, supporting_documents: data.supportingDocuments })
      .eq("id", data.requestId)
      .select()
      .single();
    if (error || !row) {
      console.warn("[ownership-transfer] finalizeRequest failed:", error?.message);
      return false;
    }
    await supabase.from("ownership_transfer_events").insert({
      request_id: row.id,
      event_type: "submitted",
      actor_id: userId,
    });
    set((state) => ({ requests: [mapRequestRow(row), ...state.requests] }));
    return true;
  },

  rejectRequest: async (id, comment) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("ownership_transfer_requests")
      .update({ status: "rejected", admin_comment: comment, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[ownership-transfer] rejectRequest failed:", error.message);
      return false;
    }
    await supabase.from("ownership_transfer_events").insert({
      request_id: id,
      event_type: "rejected",
      actor_id: userId,
      comment,
    });

    const request = get().requests.find((r) => r.id === id);
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, status: "rejected", adminComment: comment, reviewedBy: userId, reviewedAt: new Date() } : r)),
    }));

    if (request) {
      await useNotificationStore.getState().addNotification(
        request.requestedBy,
        "ownership_transfer_decision",
        "Ownership request declined",
        comment,
        { pathname: ENTITY_PROFILE_ROUTE[request.entityType], params: { id: request.entityId } },
      );
    }
    return true;
  },

  // Combines the review decision and the actual ownership grant into
  // one atomic action, unlike profile update requests' deliberate
  // approve-then-merge split — there's no meaningful "approved, but
  // ownership not yet granted" state for this flow the way there is
  // for a batch of profile field changes; an admin clicking Approve
  // here IS the decision to reassign the account.
  approveRequest: async (id, comment) => {
    const userId = await requireUserId();
    const request = get().requests.find((r) => r.id === id);
    if (!request || request.status !== "pending") return false;

    const table = ENTITY_TABLE[request.entityType];

    // Identify the current owner BEFORE changing anything — this is
    // who gets the demotion notification below, and there's no way to
    // recover "who used to own this" once the update after this point
    // has actually run.
    let previousOwnerId: string | null = null;
    if (request.entityType === "facility") {
      const { data: ownerRow } = await supabase
        .from("facility_memberships")
        .select("user_id")
        .eq("facility_id", request.entityId)
        .eq("role", "Owner")
        .maybeSingle();
      previousOwnerId = ownerRow?.user_id ?? null;
    } else {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("admin_user_id")
        .eq("id", request.entityId)
        .maybeSingle();
      previousOwnerId = orgRow?.admin_user_id ?? null;
    }

    const { error: adminUserIdError } = await supabase
      .from(table)
      .update({ admin_user_id: request.requestedBy })
      .eq("id", request.entityId);
    if (adminUserIdError) {
      console.warn("[ownership-transfer] approveRequest (admin_user_id update) failed:", adminUserIdError.message);
      return false;
    }

    if (request.entityType === "facility") {
      // is_facility_owner() (checked throughout this app — profile
      // update requests, phone verification, etc.) reads
      // facility_memberships.role = 'Owner', NOT facilities.admin_user_id
      // — that's the operative permission check this flow actually
      // needs to update, or the new "owner" wouldn't be able to use any
      // ownership-gated feature despite admin_user_id now naming them.
      const { error: demoteError } = await supabase
        .from("facility_memberships")
        .update({ role: "Member" })
        .eq("facility_id", request.entityId)
        .eq("role", "Owner");
      if (demoteError) {
        console.warn("[ownership-transfer] approveRequest (demote previous owner) failed:", demoteError.message);
      }

      // Upsert, not insert — the new owner may already be an existing
      // 'Member' of this facility (unique (facility_id, user_id) would
      // otherwise reject a plain insert), in which case this promotes
      // their existing row rather than creating a duplicate.
      const { error: promoteError } = await supabase
        .from("facility_memberships")
        .upsert(
          { facility_id: request.entityId, user_id: request.requestedBy, role: "Owner" },
          { onConflict: "facility_id,user_id" },
        );
      if (promoteError) {
        console.warn("[ownership-transfer] approveRequest (promote new owner) failed:", promoteError.message);
        return false;
      }
    }

    const { error: statusError } = await supabase
      .from("ownership_transfer_requests")
      .update({ status: "approved", admin_comment: comment, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (statusError) {
      console.warn("[ownership-transfer] approveRequest (status update) failed:", statusError.message);
      return false;
    }
    await supabase.from("ownership_transfer_events").insert({
      request_id: id,
      event_type: "approved",
      actor_id: userId,
      comment,
    });

    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, status: "approved", adminComment: comment, reviewedBy: userId, reviewedAt: new Date() } : r)),
    }));

    const notificationsStore = useNotificationStore.getState();
    await notificationsStore.addNotification(
      request.requestedBy,
      "ownership_transfer_decision",
      "Ownership request approved",
      comment,
      { pathname: ENTITY_PROFILE_ROUTE[request.entityType], params: { id: request.entityId } },
    );
    if (previousOwnerId) {
      await notificationsStore.addNotification(
        previousOwnerId,
        "ownership_transferred",
        "Ownership has changed",
        "You are no longer the owner of this account. Contact support if you believe this was a mistake.",
        { pathname: ENTITY_PROFILE_ROUTE[request.entityType], params: { id: request.entityId } },
      );
    }

    // Refresh local state for the affected entity, same as
    // mergeRequest already does for profile update requests.
    if (request.entityType === "facility") {
      await useProfileStore.getState().fetchFacilities();
    } else {
      await useProfileStore.getState().fetchOrganizations();
    }
    return true;
  },
}));
