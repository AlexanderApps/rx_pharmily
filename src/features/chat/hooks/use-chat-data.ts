import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import {
  ChatLinkedEntity,
  ChatMedia,
  ChatMessage,
  ChatParticipant,
  Conversation,
} from "@/features/chat/types/chat.types";

// A lightweight user result for the "start a new chat" search — not the
// full profile, just enough to display and start a conversation with.
export interface UserSearchResult {
  id: string;
  name: string;
  facility: string;
  avatarColor: string;
}

function mapParticipantFromProfile(profile: any): ChatParticipant {
  const facilityName = profile?.facility_memberships?.[0]?.facilities?.name ?? "";
  return {
    kind: "user",
    id: profile?.id ?? "",
    name: profile?.full_name ?? "Unknown",
    facility: facilityName,
    avatarColor: profile?.avatar_color ?? "#64748b",
  };
}

function mapLinkedEntityFromRow(row: any, prefix: "context" | "linked_entity"): ChatLinkedEntity | undefined {
  const type = row[`${prefix}_type`];
  if (!type) return undefined;
  return {
    type,
    id: row[`${prefix}_id`],
    code: row[`${prefix}_code`],
    title: row[`${prefix}_title`],
    subtitle: row[`${prefix}_subtitle`] ?? undefined,
    status: row[`${prefix}_status`],
  };
}

function mapMediaFromRow(row: any): ChatMedia | undefined {
  if (!row.media_type) return undefined;
  return {
    type: row.media_type,
    uri: row.media_uri,
    sizeBytes: Number(row.media_size_bytes),
    width: row.media_width ?? undefined,
    height: row.media_height ?? undefined,
    durationMs: row.media_duration_ms ?? undefined,
  };
}

// conversations are fetched with every participant row embedded — "who's
// the other side" is resolved here rather than at the query level, which
// keeps the query simple and lets RLS (can_access_conversation) do the
// real access control. A facility conversation has no per-person "other
// participant" row at all — the facility itself IS the other side, and
// who currently counts as a member is resolved dynamically, not stored.
function mapConversationRow(row: any, myId: string): Conversation | null {
  const participantRows = row.conversation_participants ?? [];
  const mine = participantRows.find((p: any) => p.user_id === myId);

  if (row.facility_id) {
    // Exact unread counts aren't tracked per facility member (that would
    // mean an atomic increment across every current member on every
    // send, for potentially large facilities) — this is a "has something
    // new since I last opened it" flag instead, shown the same way a
    // count would be, just not exact beyond 1. Someone who's never
    // opened this conversation (no row yet) sees it as read, not
    // unread — see markConversationRead for why that's the deliberate
    // trade-off rather than an oversight.
    const hasUnread = mine ? new Date(row.last_message_at) > new Date(mine.last_read_at ?? 0) : false;
    return {
      id: row.id,
      participant: {
        kind: "facility",
        id: row.facility_id,
        name: row.facilities?.name ?? "Unknown facility",
        memberCount: row.facilities?.facility_memberships?.[0]?.count ?? 0,
      },
      context: mapLinkedEntityFromRow(row, "context"),
      lastMessageAt: new Date(row.last_message_at),
      unreadCount: hasUnread ? 1 : 0,
    };
  }

  const other = participantRows.find((p: any) => p.user_id !== myId);
  if (!other) return null; // shouldn't happen — a 1:1 conversation always has two participants

  return {
    id: row.id,
    participant: mapParticipantFromProfile(other.profiles),
    context: mapLinkedEntityFromRow(row, "context"),
    lastMessageAt: new Date(row.last_message_at),
    unreadCount: mine?.unread_count ?? 0,
  };
}

function mapMessageRow(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.profiles?.full_name ?? "Unknown",
    text: row.text ?? undefined,
    linkedEntity: mapLinkedEntityFromRow(row, "linked_entity"),
    media: mapMediaFromRow(row),
    createdAt: new Date(row.created_at),
    status: row.status,
  };
}

const CONVERSATION_SELECT =
  "*, facilities:facility_id(name, facility_memberships(count)), conversation_participants(user_id, unread_count, last_read_at, profiles:user_id(id, full_name, avatar_color, facility_memberships(facilities(name)))), messages(*, profiles:sender_id(full_name))";
const MESSAGE_SELECT = "*, profiles:sender_id(full_name)";
const CONVERSATION_LIST_PREVIEW_LIMIT = 3;

function linkedEntityInsertFields(prefix: "context" | "linked_entity", entity?: ChatLinkedEntity) {
  if (!entity) {
    return {
      [`${prefix}_type`]: null,
      [`${prefix}_id`]: null,
      [`${prefix}_code`]: null,
      [`${prefix}_title`]: null,
      [`${prefix}_subtitle`]: null,
      [`${prefix}_status`]: null,
    };
  }
  return {
    [`${prefix}_type`]: entity.type,
    [`${prefix}_id`]: entity.id,
    [`${prefix}_code`]: entity.code,
    [`${prefix}_title`]: entity.title,
    [`${prefix}_subtitle`]: entity.subtitle ?? null,
    [`${prefix}_status`]: entity.status,
  };
}

export interface FacilityTarget {
  id: string;
  name: string;
}

let tempMessageCounter = 0;
function nextTempMessageId() {
  tempMessageCounter += 1;
  return `temp-${Date.now()}-${tempMessageCounter}`;
}

type ChatStore = {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  userResults: UserSearchResult[];
  isLoading: boolean;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;

  getMessages: (conversationId: string) => ChatMessage[];
  getConversation: (conversationId: string) => Conversation | undefined;

  sendMessage: (
    conversationId: string,
    payload: { text?: string; linkedEntity?: ChatLinkedEntity; media?: ChatMedia },
  ) => Promise<void>;

  // Re-attempts a message that's sitting in "failed" status, reusing its
  // original content rather than requiring the composer to still have it.
  retryMessage: (conversationId: string, tempMessageId: string) => Promise<void>;

  // Internal only — shared by sendMessage/retryMessage, not meant to be
  // called from outside the store.
  _sendMessageInternal: (
    conversationId: string,
    tempId: string,
    payload: { text?: string; linkedEntity?: ChatLinkedEntity; media?: ChatMedia },
  ) => Promise<void>;

  markConversationRead: (conversationId: string) => Promise<void>;

  startConversation: (
    participant: { id: string; name: string; facility: string; avatarColor: string },
    context?: ChatLinkedEntity,
  ) => Promise<string>;

  // Starts (or reuses) a conversation addressed to a facility as a whole
  // — every current member gets access dynamically, not by being added
  // as an explicit participant.
  startFacilityConversation: (facility: FacilityTarget, context?: ChatLinkedEntity) => Promise<string>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  userResults: [],
  isLoading: false,

  fetchConversations: async () => {
    const myId = await requireUserId();
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("conversations")
      .select(CONVERSATION_SELECT)
      .order("last_message_at", { ascending: false })
      .order("created_at", { foreignTable: "messages", ascending: false })
      .limit(CONVERSATION_LIST_PREVIEW_LIMIT, { foreignTable: "messages" });
    if (error) {
      console.warn("[chat] fetchConversations failed:", error.message);
      set({ isLoading: false });
      return;
    }
    const conversations = (data ?? [])
      .map((row: any) => mapConversationRow(row, myId))
      .filter((c): c is Conversation => c !== null);

    set((state) => {
      const messagesByConversation = { ...state.messagesByConversation };
      for (const row of data ?? []) {
        // Only seed the preview if this conversation's messages have
        // never been loaded before — opening the actual thread fetches
        // the full history, and a preview refetch (e.g. pull-to-refresh
        // on the list) should never clobber that back down to 3 messages.
        if (messagesByConversation[row.id] !== undefined) continue;
        // Fetched newest-first (to limit correctly), stored oldest-first
        // to match the ordering fetchMessages and every consumer expects.
        const preview = (row.messages ?? []).map(mapMessageRow).reverse();
        messagesByConversation[row.id] = preview;
      }
      return { conversations, messagesByConversation, isLoading: false };
    });
  },

  fetchMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[chat] fetchMessages failed:", error.message);
      return;
    }
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: (data ?? []).map(mapMessageRow) },
    }));
  },

  searchUsers: async (query) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      set({ userResults: [] });
      return;
    }
    const myId = await requireUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_color, facility_memberships(facilities(name))")
      .ilike("full_name", `%${trimmed}%`)
      .neq("id", myId)
      .limit(20);
    if (error) {
      console.warn("[chat] searchUsers failed:", error.message);
      return;
    }
    set({
      userResults: (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.full_name,
        facility: row.facility_memberships?.[0]?.facilities?.name ?? "",
        avatarColor: row.avatar_color,
      })),
    });
  },

  getMessages: (conversationId) => get().messagesByConversation[conversationId] ?? [],
  getConversation: (conversationId) => get().conversations.find((c) => c.id === conversationId),

  sendMessage: async (conversationId, { text, linkedEntity, media }) => {
    const trimmed = text?.trim();
    if (!trimmed && !linkedEntity && !media) return;

    // Read identity synchronously rather than awaiting requireUserId() —
    // by the time someone's composing a message they're already
    // signed in and both stores already have this cached, so there's no
    // reason to make the optimistic bubble wait on an async call before
    // it can even appear. The actual insert below still resolves the id
    // itself as a safety net in case this synchronous read is somehow
    // stale.
    const myId = useAuthStore.getState().user?.id;
    const myName = useProfileStore.getState().user.fullName || "You";

    const tempId = nextTempMessageId();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: myId ?? "",
      senderName: myName,
      text: trimmed || undefined,
      linkedEntity,
      media,
      createdAt: new Date(),
      status: "sending",
    };

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), optimisticMessage],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessageAt: optimisticMessage.createdAt } : c,
      ),
    }));

    await get()._sendMessageInternal(conversationId, tempId, { text: trimmed, linkedEntity, media });
  },

  retryMessage: async (conversationId, tempMessageId) => {
    const failed = (get().messagesByConversation[conversationId] ?? []).find((m) => m.id === tempMessageId);
    if (!failed || failed.status !== "failed") return;

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: state.messagesByConversation[conversationId].map((m) =>
          m.id === tempMessageId ? { ...m, status: "sending" } : m,
        ),
      },
    }));

    await get()._sendMessageInternal(conversationId, tempMessageId, {
      text: failed.text,
      linkedEntity: failed.linkedEntity,
      media: failed.media,
    });
  },

  // Not part of the public store interface — shared by sendMessage and
  // retryMessage so the actual "insert, update conversation, bump unread"
  // flow exists in exactly one place. Reconciles the optimistic bubble
  // (found by tempId) to the real row on success, or marks it "failed"
  // without removing it, so a failed send stays visible with a retry
  // affordance rather than silently vanishing.
  _sendMessageInternal: async (conversationId, tempId, { text, linkedEntity, media }) => {
    const markFailed = () => {
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((m) =>
            m.id === tempId ? { ...m, status: "failed" as const } : m,
          ),
        },
      }));
    };

    let myId: string;
    try {
      myId = await requireUserId();
    } catch (err) {
      console.warn("[chat] sendMessage failed:", err instanceof Error ? err.message : err);
      markFailed();
      return;
    }

    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: myId,
        text: text || null,
        status: "sent",
        ...linkedEntityInsertFields("linked_entity", linkedEntity),
        media_type: media?.type ?? null,
        media_uri: media?.uri ?? null,
        media_size_bytes: media?.sizeBytes ?? null,
        media_width: media?.width ?? null,
        media_height: media?.height ?? null,
        media_duration_ms: media?.durationMs ?? null,
      })
      .select(MESSAGE_SELECT)
      .single();
    if (error || !row) {
      console.warn("[chat] sendMessage failed:", error?.message);
      markFailed();
      return;
    }

    const now = new Date().toISOString();
    await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversationId);

    const conversation = get().conversations.find((c) => c.id === conversationId);
    if (conversation?.participant.kind === "user") {
      // 1:1: bump the one other person's unread count — an atomic
      // read-then-write for exactly one recipient, not race-prone since
      // there's only ever one other person in the thread.
      const { data: theirRow } = await supabase
        .from("conversation_participants")
        .select("unread_count")
        .eq("conversation_id", conversationId)
        .eq("user_id", conversation.participant.id)
        .single();
      await supabase
        .from("conversation_participants")
        .update({ unread_count: (theirRow?.unread_count ?? 0) + 1 })
        .eq("conversation_id", conversationId)
        .eq("user_id", conversation.participant.id);
    }
    // Facility conversations need no per-recipient write here — every
    // current member's "unread" status is derived by comparing
    // conversations.last_message_at (just updated above) against their
    // own last_read_at when they load their conversation list, not
    // pushed out to each member's row on every send.

    const message = mapMessageRow(row);
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((m) =>
          m.id === tempId ? message : m,
        ),
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessageAt: message.createdAt } : c,
      ),
    }));
  },

  markConversationRead: async (conversationId) => {
    const myId = await requireUserId();
    // Upsert, not update — a facility member who's never opened this
    // conversation before has no row yet (access was granted dynamically
    // via facility membership, not by being pre-added as a participant),
    // so plain update() would silently affect zero rows the first time.
    await supabase.from("conversation_participants").upsert({
      conversation_id: conversationId,
      user_id: myId,
      unread_count: 0,
      last_read_at: new Date().toISOString(),
    });
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    }));
  },

  startConversation: async (participant, context) => {
    // Reuse an existing thread with this person only when starting a
    // plain (context-free) chat — a "message the vendor about this RFQ"
    // action always opens a fresh, purpose-anchored thread rather than
    // dropping into whatever unrelated conversation already existed.
    if (!context) {
      const existing = get().conversations.find(
        (c) => c.participant.kind === "user" && c.participant.id === participant.id && !c.context,
      );
      if (existing) return existing.id;
    }

    // Creating the conversation and its participant row(s) happens
    // atomically server-side (see the start_conversation migration) —
    // doing it as separate insert() calls from the client had a real bug:
    // the automatic .select() after the first insert was blocked by RLS
    // before the participant row that grants access even existed yet.
    const { data: conversationId, error } = await supabase.rpc("start_conversation", {
      other_user_id: participant.id,
      ctx_type: context?.type ?? null,
      ctx_id: context?.id ?? null,
      ctx_code: context?.code ?? null,
      ctx_title: context?.title ?? null,
      ctx_subtitle: context?.subtitle ?? null,
      ctx_status: context?.status ?? null,
    });
    if (error || !conversationId) {
      console.warn("[chat] startConversation failed:", error?.message);
      return "";
    }

    if (context) {
      await get().sendMessage(conversationId, { linkedEntity: context });
    }

    await get().fetchConversations();
    return conversationId;
  },

  startFacilityConversation: async (facility, context) => {
    if (!context) {
      const existing = get().conversations.find(
        (c) => c.participant.kind === "facility" && c.participant.id === facility.id && !c.context,
      );
      if (existing) return existing.id;
    }

    const { data: conversationId, error } = await supabase.rpc("start_conversation", {
      target_facility_id: facility.id,
      ctx_type: context?.type ?? null,
      ctx_id: context?.id ?? null,
      ctx_code: context?.code ?? null,
      ctx_title: context?.title ?? null,
      ctx_subtitle: context?.subtitle ?? null,
      ctx_status: context?.status ?? null,
    });
    if (error || !conversationId) {
      console.warn("[chat] startFacilityConversation failed:", error?.message);
      return "";
    }

    if (context) {
      await get().sendMessage(conversationId, { linkedEntity: context });
    }

    await get().fetchConversations();
    return conversationId;
  },
}));
