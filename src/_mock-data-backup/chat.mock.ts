// NOT USED — kept only as reference/seed data. The live store
// (features/chat/hooks/use-chat-data.ts) now reads from Supabase.
// Note: this mock had its own disconnected "linkable entity" lists for
// RFQs and MediScope requests (the same bug class fixed across every
// other domain this session), plus a static PARTICIPANTS list standing
// in for real platform users, plus the "me"/"You" fake identity scheme.

import { create } from "zustand";
import {
  ChatLinkedEntity,
  ChatMedia,
  ChatMessage,
  ChatParticipant,
  Conversation,
} from "@/features/chat/types/chat.types";

// The logged-in user, for the purposes of this mock. Every screen in the
// chat feature treats messages with senderId === CURRENT_USER_ID as "own".
export const CURRENT_USER_ID = "me";
const CURRENT_USER_NAME = "You";

// ─── linkable entities ──────────────────────────────────────────────────
// RFQs used to be computed here from a static mock array at module load
// time — now that RxRFQ data comes from Supabase (fetched, not present at
// import time), that's moved to a live computation inside
// link-picker-sheet.tsx instead (see getLinkableRfqs there). Mediscope
// doesn't have a store yet (it's still form-only), so we keep a small
// self-contained mock list here just for linking purposes.

// A couple of self-contained example RFQs for the demo threads below — not
// pulled from the real RxRFQ store, since that data is now fetched
// asynchronously from Supabase and doesn't exist yet at module load time.
const MOCK_LINKABLE_RFQS: ChatLinkedEntity[] = [
  {
    type: "rfq",
    id: "rfq-demo-1",
    code: "RFQ-0001",
    title: "Amoxicillin 500mg, Paracetamol 500mg +3 more",
    subtitle: "Adenta Pharmacy",
    status: "published",
  },
  {
    type: "rfq",
    id: "rfq-demo-2",
    code: "RFQ-0004",
    title: "Insulin Glargine 100IU/ml",
    subtitle: "Ridge Hospital",
    status: "published",
  },
];

export const LINKABLE_MEDISCOPE_REQUESTS: ChatLinkedEntity[] = [
  {
    type: "mediscope",
    id: "ms-1",
    code: "MS-2026-001",
    title: "Enoxaparin 40mg",
    subtitle: "Adenta Pharmacy",
    status: "published",
  },
  {
    type: "mediscope",
    id: "ms-2",
    code: "MS-2026-002",
    title: "Insulin Glargine",
    subtitle: "Kaneshie Health Centre",
    status: "published",
  },
  {
    type: "mediscope",
    id: "ms-3",
    code: "MS-2026-003",
    title: "Amoxicillin Susp. 250mg/5ml",
    subtitle: "Tema General Hospital",
    status: "closed",
  },
  {
    type: "mediscope",
    id: "ms-4",
    code: "MS-2026-004",
    title: "Paracetamol IV 1g",
    subtitle: "Ridge Hospital",
    status: "draft",
  },
];

// ─── mock participants ───────────────────────────────────────────────────

const PARTICIPANTS: ChatParticipant[] = [
  { id: "p1", name: "Ama Owusu", facility: "MedPlus Distributors", avatarColor: "#2563eb" },
  { id: "p2", name: "Kwame Asante", facility: "Accra Pharma Wholesale", avatarColor: "#16a34a" },
  { id: "p3", name: "Efua Mensah", facility: "GlobalRx Supplies", avatarColor: "#9333ea" },
  { id: "p4", name: "Kojo Boateng", facility: "Northstar Healthcare Logistics", avatarColor: "#d97706" },
  { id: "p5", name: "Abena Darko", facility: "PrimeCare Pharma Ltd", avatarColor: "#dc2626" },
  { id: "p6", name: "Yaw Sarpong", facility: "Sahel Medical Traders", avatarColor: "#0891b2" },
];

function minutesAgo(mins: number) {
  return new Date(Date.now() - mins * 60 * 1000);
}

// ─── mock conversations + messages ───────────────────────────────────────

function buildMockData(): {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
} {
  const conversations: Conversation[] = [];
  const messagesByConversation: Record<string, ChatMessage[]> = {};

  const seed: {
    participant: ChatParticipant;
    context?: ChatLinkedEntity;
    unread: number;
    thread: Array<{ from: "them" | "me"; text?: string; linkedEntity?: ChatLinkedEntity; minsAgo: number }>;
  }[] = [
    {
      participant: PARTICIPANTS[0],
      context: MOCK_LINKABLE_RFQS[0],
      unread: 2,
      thread: [
        { from: "them", text: "Hi, saw your RFQ — we can fulfil most of the line items.", minsAgo: 180 },
        { from: "them", linkedEntity: MOCK_LINKABLE_RFQS[0], minsAgo: 178 },
        { from: "me", text: "Great, please submit a quote when ready.", minsAgo: 170 },
        { from: "them", text: "Will do, targeting delivery within 5 days.", minsAgo: 40 },
        { from: "them", text: "Quote is in — let us know if the pricing works.", minsAgo: 12 },
      ],
    },
    {
      participant: PARTICIPANTS[1],
      context: LINKABLE_MEDISCOPE_REQUESTS[0],
      unread: 0,
      thread: [
        { from: "me", linkedEntity: LINKABLE_MEDISCOPE_REQUESTS[0], minsAgo: 1440 },
        { from: "me", text: "Do you currently stock this, and at what MOQ?", minsAgo: 1439 },
        { from: "them", text: "Yes, MOQ is 50 units. I'll send a formal response shortly.", minsAgo: 1200 },
      ],
    },
    {
      participant: PARTICIPANTS[2],
      unread: 1,
      thread: [
        { from: "them", text: "Are you still looking for cold-chain vendors this quarter?", minsAgo: 2600 },
        { from: "them", text: "We just onboarded a new refrigerated fleet.", minsAgo: 60 },
      ],
    },
    {
      participant: PARTICIPANTS[3],
      context: MOCK_LINKABLE_RFQS[1],
      unread: 0,
      thread: [
        { from: "them", linkedEntity: MOCK_LINKABLE_RFQS[1], minsAgo: 4000 },
        { from: "them", text: "Following up on this request, deadline is close.", minsAgo: 3900 },
        { from: "me", text: "Thanks for the reminder, reviewing now.", minsAgo: 3880 },
      ],
    },
    {
      participant: PARTICIPANTS[4],
      unread: 0,
      thread: [
        { from: "me", text: "Hello! Do you have Amoxicillin suspension in stock?", minsAgo: 8000 },
        { from: "them", text: "Yes, current stock is healthy. Want a quote?", minsAgo: 7950 },
      ],
    },
  ];

  seed.forEach((s, idx) => {
    const conversationId = `conv-${idx + 1}`;
    const messages: ChatMessage[] = s.thread.map((m, mIdx) => ({
      id: `${conversationId}-m${mIdx + 1}`,
      conversationId,
      senderId: m.from === "me" ? CURRENT_USER_ID : s.participant.id,
      senderName: m.from === "me" ? CURRENT_USER_NAME : s.participant.name,
      text: m.text,
      linkedEntity: m.linkedEntity,
      createdAt: minutesAgo(m.minsAgo),
      status: m.from === "me" ? "read" : "delivered",
    }));

    messagesByConversation[conversationId] = messages;
    conversations.push({
      id: conversationId,
      participant: s.participant,
      context: s.context,
      lastMessageAt: messages[messages.length - 1]?.createdAt ?? new Date(),
      unreadCount: s.unread,
    });
  });

  return { conversations, messagesByConversation };
}

const { conversations: MOCK_CONVERSATIONS, messagesByConversation: MOCK_MESSAGES } =
  buildMockData();

let nextMessageIdCounter = 1;
let nextConversationIdCounter = MOCK_CONVERSATIONS.length + 1;

type ChatStore = {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  participants: ChatParticipant[];

  getMessages: (conversationId: string) => ChatMessage[];
  getConversation: (conversationId: string) => Conversation | undefined;

  // Sends a message with optional text, a linked RFQ/Mediscope/donation
  // reference, and/or a photo or short video. At least one of the three
  // should be provided by the caller.
  sendMessage: (
    conversationId: string,
    payload: { text?: string; linkedEntity?: ChatLinkedEntity; media?: ChatMedia },
  ) => void;

  markConversationRead: (conversationId: string) => void;

  // Starts (or reuses) a 1:1 conversation with a participant, optionally
  // anchored to an RFQ/Mediscope/donation context. Returns the conversation
  // id so the caller can navigate straight into the thread.
  startConversation: (
    participant: ChatParticipant,
    context?: ChatLinkedEntity,
  ) => string;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: MOCK_CONVERSATIONS,
  messagesByConversation: MOCK_MESSAGES,
  participants: PARTICIPANTS,

  getMessages: (conversationId) =>
    get().messagesByConversation[conversationId] ?? [],

  getConversation: (conversationId) =>
    get().conversations.find((c) => c.id === conversationId),

  sendMessage: (conversationId, { text, linkedEntity, media }) => {
    const trimmed = text?.trim();
    if (!trimmed && !linkedEntity && !media) return;

    const message: ChatMessage = {
      id: `msg-${nextMessageIdCounter++}`,
      conversationId,
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      text: trimmed || undefined,
      linkedEntity,
      media,
      createdAt: new Date(),
      status: "sent",
    };

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] ?? []),
          message,
        ],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessageAt: message.createdAt }
          : c,
      ),
    }));
  },

  markConversationRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  startConversation: (participant, context) => {
    const existing = get().conversations.find(
      (c) => c.participant.id === participant.id && !context,
    );
    if (existing) return existing.id;

    const conversationId = `conv-${nextConversationIdCounter++}`;
    const newConversation: Conversation = {
      id: conversationId,
      participant,
      context,
      lastMessageAt: new Date(),
      unreadCount: 0,
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: context
          ? [
              {
                id: `msg-${nextMessageIdCounter++}`,
                conversationId,
                senderId: CURRENT_USER_ID,
                senderName: CURRENT_USER_NAME,
                linkedEntity: context,
                createdAt: new Date(),
                status: "sent",
              },
            ]
          : [],
      },
    }));

    return conversationId;
  },
}));

