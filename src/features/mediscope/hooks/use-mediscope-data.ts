import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  MediscopeCardData,
  MediscopeFormData,
  MediscopeRequest,
  MediscopeResponse,
  MediscopeResponseFormData,
  MediscopeStatus,
} from "@/features/mediscope/types/mediscope.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

function generateCode(id: string) {
  return `MS-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
}

function mapVisibilityRuleRow(row: any) {
  return {
    id: row.id,
    ruleType: row.rule_type,
    region: row.region ?? undefined,
    facilityType: row.facility_type ?? undefined,
    facility: row.facility_id ?? undefined,
  };
}

// facilityName/facilityLocation are resolved live from the shared
// facilities table (via useProfileStore) rather than stored on the
// request row — same fix already applied to RxRFQ and Donations, so a
// facility created or renamed after this request was posted still
// resolves correctly here too.
function mapRequestRow(row: any): MediscopeRequest {
  const facility = useProfileStore.getState().facilities.find((f) => f.id === row.facility_id);
  return {
    id: row.id,
    code: row.code,
    facility: row.facility_id,
    facilityName: facility?.name ?? "Unknown facility",
    facilityLocation: facility?.location ?? "-",
    product: row.product,
    isCustomProduct: row.is_custom_product,
    comment: row.comment ?? undefined,
    imageUrl: row.image_url ?? undefined,
    status: row.status,
    isActive: row.is_active,
    visibilityScope: row.visibility_scope,
    visibilityRules: (row.mediscope_visibility_rules ?? []).map(mapVisibilityRuleRow),
    submissionDeadline: row.submission_deadline ? new Date(row.submission_deadline) : undefined,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    responseCount: row.response_count,
    fulfilledResponseId: row.fulfilled_response_id ?? undefined,
  };
}

function mapResponseRow(row: any, vendorFacilityName: string): MediscopeResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    vendorFacility: vendorFacilityName,
    availability: row.availability,
    facilityWhereAvailable: row.facility_where_available,
    cost: Number(row.cost),
    currency: row.currency,
    comment: row.comment ?? undefined,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
  };
}

const REQUEST_SELECT = "*, mediscope_visibility_rules(*)";

export function convertToCardData(request: MediscopeRequest): MediscopeCardData {
  return {
    id: request.id,
    code: request.code,
    product: request.product,
    facilityName: request.facilityName,
    facilityLocation: request.facilityLocation,
    status: request.status,
    imageUrl: request.imageUrl,
    createdAt: request.createdAt,
    submissionDeadline: request.submissionDeadline,
    responseCount: request.responseCount,
    isOwner: request.createdBy === useProfileStore.getState().user.id,
  };
}

type MediscopeStore = {
  requests: MediscopeRequest[];
  responsesByRequest: Record<string, MediscopeResponse[]>;
  isLoading: boolean;

  fetchRequests: () => Promise<void>;
  fetchRequest: (id: string) => Promise<void>;
  fetchResponses: (requestId: string) => Promise<void>;

  getRequest: (id: string) => MediscopeRequest | undefined;
  getResponses: (requestId: string) => MediscopeResponse[];

  addRequest: (data: MediscopeFormData) => Promise<string | undefined>;
  updateRequest: (id: string, data: MediscopeFormData) => Promise<boolean>;
  updateRequestStatus: (id: string, status: MediscopeStatus) => Promise<boolean>;
  extendDeadline: (id: string, newDeadline: Date) => Promise<boolean>;
  deleteRequest: (id: string) => Promise<boolean>;

  addResponse: (data: MediscopeResponseFormData) => Promise<boolean>;
  markFulfilled: (requestId: string, responseId: string) => Promise<boolean>;
};

export const useMediscopeStore = create<MediscopeStore>((set, get) => ({
  requests: [],
  responsesByRequest: {},
  isLoading: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("mediscope_requests")
      .select(REQUEST_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[mediscope] fetchRequests failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ requests: (data ?? []).map(mapRequestRow), isLoading: false });
  },

  fetchRequest: async (id) => {
    const { data, error } = await supabase.from("mediscope_requests").select(REQUEST_SELECT).eq("id", id).single();
    if (error || !data) {
      console.warn("[mediscope] fetchRequest failed:", error?.message);
      return;
    }
    const request = mapRequestRow(data);
    set((state) => ({ requests: [request, ...state.requests.filter((r) => r.id !== id)] }));
  },

  fetchResponses: async (requestId) => {
    const { data, error } = await supabase
      .from("mediscope_responses")
      .select("*, facilities:vendor_facility_id(name)")
      .eq("request_id", requestId);
    if (error) {
      console.warn("[mediscope] fetchResponses failed:", error.message);
      return;
    }
    const responses = (data ?? []).map((row: any) => mapResponseRow(row, row.facilities?.name ?? "Unknown facility"));
    set((state) => ({
      responsesByRequest: { ...state.responsesByRequest, [requestId]: responses },
    }));
  },

  getRequest: (id) => get().requests.find((r) => r.id === id),
  getResponses: (requestId) => get().responsesByRequest[requestId] ?? [],

  addRequest: async (data) => {
    const userId = await requireUserId();
    const { visibilityRules, facility, ...rest } = data;

    const { data: row, error } = await supabase
      .from("mediscope_requests")
      .insert({
        code: generateCode(Date.now().toString()),
        facility_id: facility,
        product: rest.product,
        is_custom_product: rest.isCustomProduct,
        comment: rest.comment ?? null,
        image_url: rest.imageUrl ?? null,
        status: rest.status,
        is_active: rest.isActive,
        visibility_scope: rest.visibilityScope,
        submission_deadline: rest.submissionDeadline?.toISOString() ?? null,
        published_at: rest.status === "published" ? new Date().toISOString() : null,
        created_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[mediscope] addRequest failed:", error?.message);
      return undefined;
    }

    if (visibilityRules.length > 0) {
      await supabase.from("mediscope_visibility_rules").insert(
        visibilityRules.map((rule) => ({
          request_id: row.id,
          rule_type: rule.ruleType,
          region: rule.region ?? null,
          facility_type: rule.facilityType ?? null,
          facility_id: rule.facility ?? null,
        })),
      );
    }

    await get().fetchRequest(row.id);

    const request = get().requests.find((r) => r.id === row.id);
    if (request && request.status === "published") {
      useNotificationStore.getState().addNotification(
        "mediscope_new_entry",
        "New MediScope request",
        `${request.facilityName} is searching for ${request.product}.`,
        { pathname: "/mediscope/mediscope-market-details", params: { id: request.id } },
      );
    }

    return row.id;
  },

  updateRequest: async (id, data) => {
    const { error } = await supabase
      .from("mediscope_requests")
      .update({
        facility_id: data.facility,
        product: data.product,
        is_custom_product: data.isCustomProduct,
        comment: data.comment ?? null,
        image_url: data.imageUrl ?? null,
        status: data.status,
        is_active: data.isActive,
        visibility_scope: data.visibilityScope,
        submission_deadline: data.submissionDeadline?.toISOString() ?? null,
      })
      .eq("id", id);
    if (error) {
      console.warn("[mediscope] updateRequest failed:", error.message);
      return false;
    }

    await supabase.from("mediscope_visibility_rules").delete().eq("request_id", id);
    if (data.visibilityRules.length > 0) {
      await supabase.from("mediscope_visibility_rules").insert(
        data.visibilityRules.map((rule) => ({
          request_id: id,
          rule_type: rule.ruleType,
          region: rule.region ?? null,
          facility_type: rule.facilityType ?? null,
          facility_id: rule.facility ?? null,
        })),
      );
    }

    await get().fetchRequest(id);
    return true;
  },

  updateRequestStatus: async (id, status) => {
    const existing = get().requests.find((r) => r.id === id);
    const patch: Record<string, any> = { status };
    if (status === "published" && existing && !existing.publishedAt) {
      patch.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("mediscope_requests").update(patch).eq("id", id);
    if (error) {
      console.warn("[mediscope] updateRequestStatus failed:", error.message);
      return false;
    }
    await get().fetchRequest(id);
    return true;
  },

  extendDeadline: async (id, newDeadline) => {
    const existing = get().requests.find((r) => r.id === id);
    const patch: Record<string, any> = { submission_deadline: newDeadline.toISOString() };
    if (existing?.status === "expired") patch.status = "published";
    const { error } = await supabase.from("mediscope_requests").update(patch).eq("id", id);
    if (error) {
      console.warn("[mediscope] extendDeadline failed:", error.message);
      return false;
    }
    await get().fetchRequest(id);
    return true;
  },

  deleteRequest: async (id) => {
    const { error } = await supabase.from("mediscope_requests").delete().eq("id", id);
    if (error) {
      console.warn("[mediscope] deleteRequest failed:", error.message);
      return false;
    }
    set((state) => {
      const { [id]: _removed, ...rest } = state.responsesByRequest;
      return { requests: state.requests.filter((r) => r.id !== id), responsesByRequest: rest };
    });
    return true;
  },

  addResponse: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("mediscope_responses")
      .insert({
        request_id: data.requestId,
        vendor_facility_id: data.vendorFacility,
        availability: data.availability,
        facility_where_available: data.facilityWhereAvailable,
        cost: data.cost,
        currency: data.currency,
        comment: data.comment ?? null,
        created_by: userId,
      })
      .select("*, facilities:vendor_facility_id(name)")
      .single();
    if (error || !row) {
      console.warn("[mediscope] addResponse failed:", error?.message);
      return false;
    }

    await supabase
      .from("mediscope_requests")
      .update({ response_count: (get().requests.find((r) => r.id === data.requestId)?.responseCount ?? 0) + 1 })
      .eq("id", data.requestId);

    await get().fetchRequest(data.requestId);
    await get().fetchResponses(data.requestId);

    const request = get().requests.find((r) => r.id === data.requestId);
    if (request && request.createdBy === userId) {
      const responderName = (row as any).facilities?.name ?? "A vendor";
      useNotificationStore.getState().addNotification(
        "mediscope_response_received",
        "New response on your MediScope request",
        `${responderName} responded to your search for ${request.product}.`,
        { pathname: "/mediscope/mediscope-details", params: { id: request.id } },
      );
    }
    return true;
  },

  markFulfilled: async (requestId, responseId) => {
    const { error } = await supabase
      .from("mediscope_requests")
      .update({ status: "fulfilled", fulfilled_response_id: responseId })
      .eq("id", requestId);
    if (error) {
      console.warn("[mediscope] markFulfilled failed:", error.message);
      return false;
    }
    await get().fetchRequest(requestId);
    return true;
  },
}));
