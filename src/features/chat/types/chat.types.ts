// Types for RxChat — the in-app messaging feature.
//
// Two kinds of conversation: a plain 1:1 between two specific people, or
// one addressed to a facility as a whole — visible to whoever currently
// belongs to that facility, like a group chat where facility membership
// *is* group membership. Message content is either plain text, a linked
// entity (RFQ / Mediscope request / donation), or both together (a
// comment attached to a shared link). Every message always carries its
// own sender_id/senderName regardless of conversation kind, so a facility
// conversation's bubbles correctly show which specific member sent each
// message, not just "the facility."

export type ChatLinkedEntityType = "rfq" | "mediscope" | "donation";

export type ChatMediaType = "image" | "video";

// Same cap used by Posts/Ads, defined independently per feature so chat
// doesn't reach into another feature just to reuse a constant.
export const MAX_CHAT_MEDIA_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface ChatMedia {
  type: ChatMediaType;
  uri: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
}

// A lightweight, renderable snapshot of an RFQ / Mediscope request / donation
// that can be shared inside a chat message. We snapshot the fields needed to
// render the preview card rather than storing a live reference, so a message
// still displays sensibly even if the underlying record changes later.
export interface ChatLinkedEntity {
  type: ChatLinkedEntityType;
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  status: string;
}

export type ChatMessageStatus =
  "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text?: string;
  linkedEntity?: ChatLinkedEntity;
  media?: ChatMedia;
  createdAt: Date;
  status: ChatMessageStatus;
}

export interface ChatParticipantUser {
  kind: "user";
  id: string;
  name: string;
  facility: string;
  avatarColor: string;
}

// The facility IS the target here — there's no separate "their facility"
// field the way a user-target has, and no single avatarColor since
// there's no single person to color a bubble for.
export interface ChatParticipantFacility {
  kind: "facility";
  id: string;
  name: string;
  memberCount: number;
}

export type ChatParticipant = ChatParticipantUser | ChatParticipantFacility;

export interface Conversation {
  id: string;
  participant: ChatParticipant;
  // Optional anchor this conversation was started from, e.g. "message the
  // vendor about this RFQ" — shown as a pinned banner in the thread.
  context?: ChatLinkedEntity;
  lastMessageAt: Date;
  unreadCount: number;
}
