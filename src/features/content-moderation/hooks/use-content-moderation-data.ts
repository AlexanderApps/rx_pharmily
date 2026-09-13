import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  ContentModerationAction,
  ContentModerationType,
  ModerationSearchResult,
} from "@/features/content-moderation/types/content-moderation.types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONTENT_TABLE: Record<ContentModerationType, string> = {
  rxrfq: "rxrfqs",
  rxrfq_response: "rxrfq_responses",
  mediscope_request: "mediscope_requests",
  mediscope_response: "mediscope_responses",
  job: "jobs",
  job_application: "job_applications",
  donation: "donations",
  donation_response: "donation_responses",
};

// Which columns each content type is actually searchable by, and how to
// turn a raw row into the normalized title/subtitle the admin screen
// shows — deliberately not a uniform shape, since rxrfq_responses,
// mediscope_responses, and job_applications don't have their own code
// the way rxrfqs/mediscope_requests do, and jobs never had one at all.
function mapSearchRow(contentType: ContentModerationType, row: any): ModerationSearchResult {
  switch (contentType) {
    case "rxrfq":
      return {
        id: row.id,
        contentType,
        code: row.code,
        title: row.code,
        subtitle: row.description ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
    case "rxrfq_response":
      return {
        id: row.id,
        contentType,
        title: `Response ${row.id.slice(0, 8)}`,
        subtitle: row.vendor_comment ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
    case "mediscope_request":
      return {
        id: row.id,
        contentType,
        code: row.code,
        title: row.code,
        subtitle: row.product ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
    case "mediscope_response":
      return {
        id: row.id,
        contentType,
        title: `Response ${row.id.slice(0, 8)}`,
        subtitle: row.comment ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
    case "job":
      return {
        id: row.id,
        contentType,
        title: row.title,
        subtitle: row.company_name ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
    case "job_application":
      return {
        id: row.id,
        contentType,
        title: `Application ${row.id.slice(0, 8)}`,
        subtitle: row.cover_note ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.applied_at ?? row.created_at),
      };
    case "donation":
      return {
        id: row.id,
        contentType,
        code: row.code,
        title: row.code,
        subtitle: row.comment || undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
    case "donation_response":
      return {
        id: row.id,
        contentType,
        title: `Claim ${row.id.slice(0, 8)}`,
        subtitle: row.comment ?? undefined,
        isRemoved: row.is_removed ?? false,
        removedReason: row.removed_reason ?? undefined,
        createdAt: new Date(row.created_at),
      };
  }
}

function mapActionRow(row: any): ContentModerationAction {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    actionType: row.action_type,
    reason: row.reason ?? undefined,
    actorId: row.actor_id,
    actorName: row.actor?.full_name ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

interface ContentModerationState {
  // Keyed by `${contentType}:${contentId}` — same reasoning as the
  // account moderation store: more than one piece of content's history
  // can be in view at once (e.g. an admin reviewing several responses
  // to one RFQ in the same screen) without one fetch clobbering another.
  history: Record<string, ContentModerationAction[]>;
  searchResults: ModerationSearchResult[];
  isSearching: boolean;

  fetchHistory: (contentType: ContentModerationType, contentId: string) => Promise<void>;
  removeContent: (contentType: ContentModerationType, contentId: string, reason: string) => Promise<boolean>;
  restoreContent: (contentType: ContentModerationType, contentId: string) => Promise<boolean>;
  searchContent: (contentType: ContentModerationType, query: string) => Promise<void>;
}

export const useContentModerationStore = create<ContentModerationState>((set, get) => ({
  history: {},
  searchResults: [],
  isSearching: false,

  searchContent: async (contentType, query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });

    // code is only a real column on rxrfqs/mediscope_requests — every
    // other content type is searched by id only, since neither
    // responses/applications nor jobs itself have a short code.
    const hasCode = contentType === "rxrfq" || contentType === "mediscope_request" || contentType === "donation";
    const looksLikeUuid = UUID_PATTERN.test(trimmed);
    let queryBuilder = supabase.from(CONTENT_TABLE[contentType]).select("*");
    if (hasCode && looksLikeUuid) {
      // Both conditions are safe to combine here — the query string is
      // actually a valid uuid, so id.eq won't fail to cast.
      queryBuilder = queryBuilder.or(`code.ilike.%${trimmed}%,id.eq.${trimmed}`);
    } else if (hasCode) {
      // NOT combined with id.eq — a non-uuid string (e.g. "RFQ-123...")
      // against a uuid column fails Postgres's cast for the whole query,
      // not just that one condition, which is exactly what made code
      // search never return anything at all.
      queryBuilder = queryBuilder.ilike("code", `%${trimmed}%`);
    } else if (looksLikeUuid) {
      queryBuilder = queryBuilder.eq("id", trimmed);
    } else {
      // No code column and not a valid uuid — nothing this content
      // type could actually match; skip the query entirely rather than
      // send one guaranteed to fail the same way.
      set({ isSearching: false, searchResults: [] });
      return;
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false }).limit(25);
    set({ isSearching: false });
    if (error) {
      console.warn("[content-moderation] searchContent failed:", error.message);
      set({ searchResults: [] });
      return;
    }
    set({ searchResults: (data ?? []).map((row) => mapSearchRow(contentType, row)) });
  },

  fetchHistory: async (contentType, contentId) => {
    const { data, error } = await supabase
      .from("content_moderation_actions")
      .select("*, actor:profiles!content_moderation_actions_actor_id_fkey(full_name)")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[content-moderation] fetchHistory failed:", error.message);
      return;
    }
    set((state) => ({
      history: { ...state.history, [`${contentType}:${contentId}`]: (data ?? []).map(mapActionRow) },
    }));
  },

  removeContent: async (contentType, contentId, reason) => {
    const userId = await requireUserId();
    const { error: updateError } = await supabase
      .from(CONTENT_TABLE[contentType])
      .update({ is_removed: true, removed_reason: reason, removed_by: userId, removed_at: new Date().toISOString() })
      .eq("id", contentId);
    if (updateError) {
      console.warn("[content-moderation] removeContent failed:", updateError.message);
      return false;
    }
    const { error: logError } = await supabase.from("content_moderation_actions").insert({
      content_type: contentType,
      content_id: contentId,
      action_type: "removed",
      reason,
      actor_id: userId,
    });
    if (logError) console.warn("[content-moderation] removeContent audit log failed:", logError.message);
    await get().fetchHistory(contentType, contentId);
    return true;
  },

  restoreContent: async (contentType, contentId) => {
    const userId = await requireUserId();
    const { error: updateError } = await supabase
      .from(CONTENT_TABLE[contentType])
      .update({ is_removed: false, removed_reason: null, removed_by: null, removed_at: null })
      .eq("id", contentId);
    if (updateError) {
      console.warn("[content-moderation] restoreContent failed:", updateError.message);
      return false;
    }
    const { error: logError } = await supabase.from("content_moderation_actions").insert({
      content_type: contentType,
      content_id: contentId,
      action_type: "restored",
      actor_id: userId,
    });
    if (logError) console.warn("[content-moderation] restoreContent audit log failed:", logError.message);
    await get().fetchHistory(contentType, contentId);
    return true;
  },
}));
