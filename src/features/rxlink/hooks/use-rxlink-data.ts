import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { uploadRxLinkImage, getRxLinkImageSignedUrls } from "@/lib/rxlink-image-storage";
import {
  RxLinkFormData,
  RxLinkImage,
  RxLinkRequest,
  RxLinkResponse,
  RxLinkStatus,
} from "@/features/rxlink/types/rxlink.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";

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

function mapResponseRow(row: any): RxLinkResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    responderId: row.responder_id,
    responderName: row.responder?.full_name ?? "Admin",
    message: row.message,
    createdAt: new Date(row.created_at),
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
  closeRequest: (id: string) => Promise<boolean>;
  respondToRequest: (requestId: string, message: string) => Promise<boolean>;
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
      .select("*, requester:created_by(id, full_name), reviewer:responded_by(id, full_name)")
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
      .select("*, responder:responder_id(id, full_name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[rxlink] fetchResponses failed:", error.message);
      set({ isLoadingResponses: false });
      return;
    }
    set((state) => ({
      responsesByRequest: { ...state.responsesByRequest, [requestId]: (data ?? []).map(mapResponseRow) },
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

    useNotificationStore.getState().addNotification(
      "rxlink_new_entry",
      "New RxLink request",
      `A new medication search request (${request.code}) needs a response.`,
      { pathname: "/admin/rxlink-requests", params: { id: request.id } },
    );

    return request.id;
  },

  closeRequest: async (id) => {
    const { error } = await supabase.from("rxlink_requests").update({ status: "closed" }).eq("id", id);
    if (error) {
      console.warn("[rxlink] closeRequest failed:", error.message);
      return false;
    }
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, status: "closed" as RxLinkStatus } : r)),
    }));
    return true;
  },

  respondToRequest: async (requestId, message) => {
    const trimmed = message.trim();
    if (!trimmed) return false;
    const responderId = await requireUserId();

    const { data: row, error } = await supabase
      .from("rxlink_responses")
      .insert({ request_id: requestId, responder_id: responderId, message: trimmed })
      .select("*, responder:responder_id(id, full_name)")
      .single();
    if (error || !row) {
      console.warn("[rxlink] respondToRequest failed:", error?.message);
      return false;
    }

    await supabase
      .from("rxlink_requests")
      .update({ status: "responded", responded_by: responderId, responded_at: new Date().toISOString() })
      .eq("id", requestId);

    const response = mapResponseRow(row);
    set((state) => ({
      responsesByRequest: {
        ...state.responsesByRequest,
        [requestId]: [...(state.responsesByRequest[requestId] ?? []), response],
      },
      requests: state.requests.map((r) =>
        r.id === requestId
          ? { ...r, status: "responded" as RxLinkStatus, respondedBy: responderId, respondedAt: new Date() }
          : r,
      ),
    }));

    const request = get().requests.find((r) => r.id === requestId);
    if (request) {
      useNotificationStore.getState().addNotification(
        "rxlink_response_received",
        "New response on your RxLink request",
        `An admin responded to your request ${request.code}.`,
        { pathname: "/rxlink/request-details", params: { id: requestId } },
      );
    }

    return true;
  },
}));
