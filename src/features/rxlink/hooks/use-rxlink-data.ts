import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { uploadRxLinkImage, getRxLinkImageSignedUrls } from "@/lib/rxlink-image-storage";
import {
  RxLinkFormData,
  RxLinkImage,
  RxLinkRequest,
  RxLinkResponse,
} from "@/features/rxlink/types/rxlink.types";

function generateCode(id: string) {
  return `RL-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
}

function mapRequestRow(row: any): RxLinkRequest {
  return {
    id: row.id,
    code: row.code,
    createdBy: row.created_by,
    createdByName: row.requester?.full_name ?? "Unknown",
    comment: row.comment ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    respondedBy: row.responded_by ?? undefined,
    respondedByName: row.reviewer?.full_name ?? undefined,
    respondedAt: row.responded_at ? new Date(row.responded_at) : undefined,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
    acknowledgedByName: row.acknowledger?.full_name ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    requesterClosedAt: row.requester_closed_at ? new Date(row.requester_closed_at) : undefined,
    adminClosedAt: row.admin_closed_at ? new Date(row.admin_closed_at) : undefined,
    adminClosedByName: row.admin_closer?.full_name ?? undefined,
  };
}

function mapImageRow(row: any): RxLinkImage {
  return {
    id: row.id,
    requestId: row.request_id,
    storagePath: row.storage_path,
    imageType: row.image_type,
    createdAt: new Date(row.created_at),
  };
}

// requestCreatedBy is the parent request's own creator — passed in
// rather than looked up per-row, since every response in one fetch
// belongs to the same request and it'd be wasteful to re-derive this
// per row. "From admin" is whoever isn't the request's own creator,
// not a stored column — this request only ever has two participants.
function mapResponseRow(row: any, requestCreatedBy: string): RxLinkResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    senderId: row.sender_id,
    senderName: row.sender?.full_name ?? "Unknown",
    isFromAdmin: row.sender_id !== requestCreatedBy,
    message: row.message,
    createdAt: new Date(row.created_at),
    attachmentType: row.attachment_type ?? undefined,
    attachmentData: row.attachment_data ?? undefined,
  };
}

type RxLinkStore = {
  requests: RxLinkRequest[];
  imagesByRequest: Record<string, RxLinkImage[]>;
  responsesByRequest: Record<string, RxLinkResponse[]>;
  // Resolved signed URLs, keyed by storage path — a cache so re-viewing
  // a request within the same session doesn't re-request a fresh signed
  // URL for every image every time.
  signedUrlByPath: Record<string, string>;
  isLoading: boolean;
  isLoadingImages: boolean;
  isLoadingResponses: boolean;

  fetchRequests: () => Promise<void>;
  fetchImages: (requestId: string) => Promise<void>;
  fetchResponses: (requestId: string) => Promise<void>;

  getRequest: (id: string) => RxLinkRequest | undefined;
  getImages: (requestId: string) => RxLinkImage[];
  getResponses: (requestId: string) => RxLinkResponse[];

  submitRequest: (data: RxLinkFormData) => Promise<string | undefined>;
  // One message thread, either direction — a requester's own follow-up
  // and an admin's response are the same underlying row, distinguished
  // at render time by RxLinkResponse.isFromAdmin, not by two separate
  // methods or tables.
  sendMessage: (requestId: string, message: string) => Promise<boolean>;

  acknowledgeRequest: (id: string) => Promise<{ ok: boolean; error?: string }>;
  rejectRequest: (id: string, reason: string) => Promise<{ ok: boolean; error?: string }>;
  closeRequestAsRequester: (id: string) => Promise<{ ok: boolean; error?: string }>;
  closeRequestAsAdmin: (id: string) => Promise<{ ok: boolean; error?: string }>;
};

export const useRxLinkStore = create<RxLinkStore>((set, get) => ({
  requests: [],
  imagesByRequest: {},
  responsesByRequest: {},
  signedUrlByPath: {},
  isLoading: false,
  isLoadingImages: false,
  isLoadingResponses: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    // RLS scopes this automatically: a regular user gets back only
    // their own requests, an admin gets every request. No client-side
    // filtering needed either way.
    const { data, error } = await supabase
      .from("rxlink_requests")
      .select(
        "*, requester:created_by(id, full_name), reviewer:responded_by(id, full_name), acknowledger:acknowledged_by(id, full_name), admin_closer:admin_closed_by(id, full_name)",
      )
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[rxlink] fetchRequests failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ requests: (data ?? []).map(mapRequestRow), isLoading: false });
  },

  fetchImages: async (requestId) => {
    set({ isLoadingImages: true });
    const { data, error } = await supabase
      .from("rxlink_images")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[rxlink] fetchImages failed:", error.message);
      set({ isLoadingImages: false });
      return;
    }
    const images = (data ?? []).map(mapImageRow);
    const resolved = await getRxLinkImageSignedUrls(images.map((img) => img.storagePath));
    set((state) => ({
      imagesByRequest: { ...state.imagesByRequest, [requestId]: images },
      signedUrlByPath: { ...state.signedUrlByPath, ...resolved },
      isLoadingImages: false,
    }));
  },

  fetchResponses: async (requestId) => {
    set({ isLoadingResponses: true });
    const { data, error } = await supabase
      .from("rxlink_responses")
      .select("*, sender:sender_id(id, full_name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[rxlink] fetchResponses failed:", error.message);
      set({ isLoadingResponses: false });
      return;
    }
    const requestCreatedBy = get().requests.find((r) => r.id === requestId)?.createdBy ?? "";
    set((state) => ({
      responsesByRequest: {
        ...state.responsesByRequest,
        [requestId]: (data ?? []).map((row) => mapResponseRow(row, requestCreatedBy)),
      },
      isLoadingResponses: false,
    }));
  },

  getRequest: (id) => get().requests.find((r) => r.id === id),
  getImages: (requestId) => get().imagesByRequest[requestId] ?? [],
  getResponses: (requestId) => get().responsesByRequest[requestId] ?? [],

  submitRequest: async (data) => {
    const userId = await requireUserId();
    if (data.images.length === 0) return undefined;

    const { data: row, error } = await supabase
      .from("rxlink_requests")
      .insert({
        code: generateCode(Date.now().toString()),
        comment: data.comment.trim() || null,
        status: "pending",
        created_by: userId,
      })
      .select("*, requester:created_by(id, full_name)")
      .single();
    if (error || !row) {
      console.warn("[rxlink] submitRequest failed:", error?.message);
      return undefined;
    }

    // Upload every image, then insert their rows. If an upload fails
    // partway through, the request itself still exists with whichever
    // images made it — better than losing the whole submission, and
    // the requester can still be reached even with a partial set.
    for (const draft of data.images) {
      const uploaded = await uploadRxLinkImage(draft.localUri, draft.fileName);
      if (!uploaded.ok) {
        console.warn("[rxlink] image upload failed:", uploaded.error);
        continue;
      }
      const { error: imageError } = await supabase.from("rxlink_images").insert({
        request_id: row.id,
        storage_path: uploaded.path,
        image_type: draft.imageType,
      });
      if (imageError) {
        console.warn("[rxlink] rxlink_images insert failed:", imageError.message);
      }
    }

    const request = mapRequestRow(row);
    set((state) => ({ requests: [request, ...state.requests] }));

    return request.id;
  },

  sendMessage: async (requestId, message) => {
    const trimmed = message.trim();
    if (!trimmed) return false;
    const senderId = await requireUserId();

    const { data: row, error } = await supabase
      .from("rxlink_responses")
      .insert({ request_id: requestId, sender_id: senderId, message: trimmed })
      .select("*, sender:sender_id(id, full_name)")
      .single();
    if (error || !row) {
      console.warn("[rxlink] sendMessage failed:", error?.message);
      return false;
    }

    const requestCreatedBy = get().requests.find((r) => r.id === requestId)?.createdBy ?? "";
    const response = mapResponseRow(row, requestCreatedBy);
    set((state) => ({
      responsesByRequest: {
        ...state.responsesByRequest,
        [requestId]: [...(state.responsesByRequest[requestId] ?? []), response],
      },
    }));

    // The DB trigger already advances status to 'responded' server-side
    // when the sender is an admin — this just re-fetches so the local
    // list reflects that without hand-computing the same logic twice.
    if (response.isFromAdmin) {
      await get().fetchRequests();
    }

    return true;
  },

  acknowledgeRequest: async (id) => {
    const { error } = await supabase.rpc("acknowledge_rxlink_request", { p_request_id: id });
    if (error) {
      console.warn("[rxlink] acknowledgeRequest failed:", error.message);
      return { ok: false, error: error.message };
    }
    await get().fetchRequests();
    return { ok: true };
  },

  rejectRequest: async (id, reason) => {
    const { error } = await supabase.rpc("reject_rxlink_request", { p_request_id: id, p_reason: reason.trim() });
    if (error) {
      console.warn("[rxlink] rejectRequest failed:", error.message);
      return { ok: false, error: error.message };
    }
    await get().fetchRequests();
    return { ok: true };
  },

  closeRequestAsRequester: async (id) => {
    const { error } = await supabase.rpc("close_rxlink_request_as_requester", { p_request_id: id });
    if (error) {
      console.warn("[rxlink] closeRequestAsRequester failed:", error.message);
      return { ok: false, error: error.message };
    }
    await get().fetchRequests();
    return { ok: true };
  },

  closeRequestAsAdmin: async (id) => {
    const { error } = await supabase.rpc("close_rxlink_request_as_admin", { p_request_id: id });
    if (error) {
      console.warn("[rxlink] closeRequestAsAdmin failed:", error.message);
      return { ok: false, error: error.message };
    }
    await get().fetchRequests();
    return { ok: true };
  },
}));
