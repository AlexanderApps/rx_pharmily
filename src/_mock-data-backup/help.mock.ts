// NOT USED — kept only as reference/seed data. The live store
// (features/help/hooks/use-help-data.ts) now reads from Supabase.
// Note: CURRENT_USER below was the same "You" fake-identity placeholder
// fixed across every other domain this session — the requester's real
// identity needs to be an actual auth.uid() for RLS's created_by checks
// to work at all.

import { create } from "zustand";
import {
  ConsultFormData,
  ConsultRequest,
  ConsultResponse,
  ConsultStatus,
  FaqItem,
  PharmacistAnswer,
  PharmacistQuestion,
  PharmacistQuestionFormData,
  ReportFormData,
  ReportTicket,
} from "@/features/help/types/help.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";

const CURRENT_USER = "You";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// ─── FAQ ─────────────────────────────────────────────────────────────────

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    category: "Getting Started",
    question: "How do I post an RxRFQ or a MediScope request?",
    answer:
      "Open RxRFQs or MediScope from the Services tab, tap the + button, fill in what you're looking for, and publish. Other facilities on the network can then respond.",
  },
  {
    id: "2",
    category: "Getting Started",
    question: "How does a donation claim work?",
    answer:
      "When you find a donation you'd like, open it and tap Claim Items to select what you need and how much. The donor reviews and approves claims from their donation's details page.",
  },
  {
    id: "3",
    category: "Account",
    question: "How do I switch between light and dark theme?",
    answer: "Go to Settings and choose your preferred appearance under Theme.",
  },
  {
    id: "4",
    category: "RxJobs",
    question: "Can I edit a job listing after posting it?",
    answer:
      "Yes — open the listing from My Jobs and use the edit icon. Applicant details and application counts are preserved.",
  },
  {
    id: "5",
    category: "RxAds",
    question: "How long does ad approval take?",
    answer:
      "Ads are reviewed by a system admin after payment. Most are reviewed within one business day; you'll see the status change from Pending to Live once approved.",
  },
  {
    id: "6",
    category: "Privacy",
    question: "Who can see my posts and requests?",
    answer:
      "Posts appear in the community feed to everyone. RxRFQs and MediScope requests respect the visibility settings you choose when creating them — you can restrict them to a region, facility type, or specific facilities.",
  },
  {
    id: "7",
    category: "Community",
    question: "Can I remove a comment or post I made?",
    answer:
      "Currently posts and comments don't have a delete option from your device — reach out via Report a Bug if you need something removed urgently.",
  },
];

// ─── Reports ─────────────────────────────────────────────────────────────

const MOCK_REPORTS: ReportTicket[] = [
  {
    id: "rep-1",
    type: "bug",
    subject: "App crashes when attaching a video to a post",
    description: "Happens every time on Android after picking a video longer than a minute.",
    status: "in_review",
    createdAt: hoursAgo(30),
    createdBy: CURRENT_USER,
  },
  {
    id: "rep-2",
    type: "user",
    subject: "Suspicious pricing on repeated RFQ responses",
    description: "This vendor has quoted well below market rate on three separate RFQs this week — worth a look.",
    reportedUser: "Sahel Medical Traders",
    status: "submitted",
    createdAt: hoursAgo(6),
    createdBy: CURRENT_USER,
  },
  {
    id: "rep-3",
    type: "content",
    subject: "Inappropriate image in community post",
    description: "A post in the community feed contains an image unrelated to pharmacy content.",
    status: "resolved",
    createdAt: hoursAgo(96),
    createdBy: CURRENT_USER,
  },
];

// ─── Consult ─────────────────────────────────────────────────────────────

const MOCK_CONSULT_REQUESTS: ConsultRequest[] = [
  {
    id: "con-1",
    code: "CON-2026-001",
    category: "New Facility Setup",
    subject: "Licensing timeline for a second pharmacy branch",
    description:
      "We're opening a second location in Tema and want a realistic sense of the licensing and inspection timeline before we sign a lease.",
    preferredFormat: "call",
    status: "completed",
    consultantName: "Dr. Efua Owusu, PharmD",
    scheduledAt: hoursAgo(50),
    createdAt: hoursAgo(96),
    createdBy: CURRENT_USER,
  },
  {
    id: "con-2",
    code: "CON-2026-002",
    category: "Procurement Trends",
    subject: "Diversifying suppliers for cold-chain products",
    description:
      "Looking for guidance on vetting a second cold-chain distributor without disrupting current supply.",
    preferredFormat: "chat",
    status: "pending",
    createdAt: hoursAgo(5),
    createdBy: CURRENT_USER,
  },
];

const MOCK_CONSULT_RESPONSES: ConsultResponse[] = [
  {
    id: "conr-1",
    requestId: "con-1",
    consultantName: "Dr. Efua Owusu, PharmD",
    message:
      "Thanks for the call today — as discussed, budget 8–12 weeks from application submission to final inspection sign-off, and start your facility inspection checklist now rather than after the lease is signed.",
    createdAt: hoursAgo(49),
  },
];

// ─── Ask Your Pharmacist ─────────────────────────────────────────────────
// Mock answers here are intentionally general (no specific doses/regimens)
// and consistently point back to a licensed pharmacist or prescriber for
// anything personalized — that's the right posture for canned/demo content
// in this space, not just a style choice.

const MOCK_QUESTIONS: PharmacistQuestion[] = [
  {
    id: "q-1",
    category: "Drug Interaction",
    medicationName: "Warfarin",
    question: "Is it safe to take an over-the-counter pain reliever alongside warfarin?",
    status: "answered",
    createdAt: hoursAgo(20),
    createdBy: CURRENT_USER,
    answer: {
      id: "a-1",
      pharmacistName: "Kojo Mensah, RPh",
      message:
        "Some common OTC pain relievers can increase bleeding risk when combined with warfarin. Please check with your prescribing doctor or pharmacist before starting any new OTC medication, and mention it at your next INR check.",
      createdAt: hoursAgo(18),
    },
  },
  {
    id: "q-2",
    category: "Dosage & Administration",
    medicationName: "Metformin",
    question: "Should I take my metformin with food or on an empty stomach?",
    status: "answered",
    createdAt: hoursAgo(40),
    createdBy: CURRENT_USER,
    answer: {
      id: "a-2",
      pharmacistName: "Ama Boateng, PharmD",
      message:
        "Metformin is generally taken with meals to reduce stomach upset. Follow the specific instructions on your prescription label, and let your pharmacist know if you're having ongoing digestive side effects.",
      createdAt: hoursAgo(38),
    },
  },
  {
    id: "q-3",
    category: "Side Effects",
    medicationName: "Amoxicillin",
    question: "I've developed a mild rash two days into a course of amoxicillin — what should I do?",
    status: "pending",
    createdAt: hoursAgo(2),
    createdBy: CURRENT_USER,
  },
];

let nextReportIdCounter = 1;
let nextConsultIdCounter =
  MOCK_CONSULT_REQUESTS.reduce((max, c) => Math.max(max, Number(c.id.split("-")[1]) || 0), 0) + 1;
let nextQuestionIdCounter =
  MOCK_QUESTIONS.reduce((max, q) => Math.max(max, Number(q.id.split("-")[1]) || 0), 0) + 1;
let nextConsultResponseIdCounter = MOCK_CONSULT_RESPONSES.length + 1;
let nextAnswerIdCounter = 1;

function generateConsultCode(numericId: string) {
  return `CON-${new Date().getFullYear()}-${numericId.padStart(3, "0")}`;
}

type HelpStore = {
  faqItems: FaqItem[];
  reports: ReportTicket[];
  consultRequests: ConsultRequest[];
  consultResponsesByRequest: Record<string, ConsultResponse[]>;
  questions: PharmacistQuestion[];

  addReport: (data: ReportFormData) => void;
  // Admin action — moves a report through submitted -> in_review -> resolved/dismissed.
  updateReportStatus: (id: string, status: ReportTicket["status"]) => void;

  addConsultRequest: (data: ConsultFormData) => string;
  getConsultResponses: (requestId: string) => ConsultResponse[];
  cancelConsultRequest: (id: string) => void;
  // Posts a reply on a consult request. A pending request moves to
  // "accepted" the moment it gets its first response.
  respondToConsult: (requestId: string, consultantName: string, message: string) => void;
  completeConsultRequest: (id: string) => void;

  addQuestion: (data: PharmacistQuestionFormData) => string;
  // Posts the pharmacist's reply to a question and marks it answered.
  answerQuestion: (questionId: string, pharmacistName: string, message: string) => void;
};

export const useHelpStore = create<HelpStore>((set, get) => ({
  faqItems: FAQ_ITEMS,
  reports: MOCK_REPORTS,
  consultRequests: MOCK_CONSULT_REQUESTS,
  consultResponsesByRequest: MOCK_CONSULT_RESPONSES.reduce<Record<string, ConsultResponse[]>>(
    (acc, r) => {
      acc[r.requestId] = [...(acc[r.requestId] ?? []), r];
      return acc;
    },
    {},
  ),
  questions: MOCK_QUESTIONS,

  addReport: (data) => {
    const report: ReportTicket = {
      ...data,
      id: `rep-${nextReportIdCounter++}`,
      status: "submitted",
      createdAt: new Date(),
      createdBy: CURRENT_USER,
    };
    set((state) => ({ reports: [report, ...state.reports] }));
  },

  updateReportStatus: (id, status) => {
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },

  addConsultRequest: (data) => {
    const numericId = `${nextConsultIdCounter++}`;
    const id = `con-${numericId}`;
    const request: ConsultRequest = {
      ...data,
      id,
      code: generateConsultCode(numericId),
      status: "pending" as ConsultStatus,
      createdAt: new Date(),
      createdBy: CURRENT_USER,
    };
    set((state) => ({ consultRequests: [request, ...state.consultRequests] }));
    return id;
  },

  getConsultResponses: (requestId) => get().consultResponsesByRequest[requestId] ?? [],

  cancelConsultRequest: (id) => {
    set((state) => ({
      consultRequests: state.consultRequests.map((c) =>
        c.id === id ? { ...c, status: "cancelled" as ConsultStatus } : c,
      ),
    }));
  },

  respondToConsult: (requestId, consultantName, message) => {
    const trimmedName = consultantName.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;

    const response: ConsultResponse = {
      id: `conr-${nextConsultResponseIdCounter++}`,
      requestId,
      consultantName: trimmedName,
      message: trimmedMessage,
      createdAt: new Date(),
    };

    set((state) => ({
      consultResponsesByRequest: {
        ...state.consultResponsesByRequest,
        [requestId]: [...(state.consultResponsesByRequest[requestId] ?? []), response],
      },
      consultRequests: state.consultRequests.map((c) =>
        c.id === requestId
          ? {
              ...c,
              consultantName: c.consultantName ?? trimmedName,
              status: c.status === "pending" ? ("accepted" as ConsultStatus) : c.status,
            }
          : c,
      ),
    }));

    const request = get().consultRequests.find((c) => c.id === requestId);
    useNotificationStore.getState().addNotification(
      "consult_response_received",
      "Consultant replied",
      `${trimmedName} replied to your request${request ? `: "${request.subject}"` : ""}.`,
      { pathname: "/help/consult-details", params: { id: requestId } },
    );
  },

  completeConsultRequest: (id) => {
    set((state) => ({
      consultRequests: state.consultRequests.map((c) =>
        c.id === id ? { ...c, status: "completed" as ConsultStatus } : c,
      ),
    }));
  },

  addQuestion: (data) => {
    const id = `q-${nextQuestionIdCounter++}`;
    const question: PharmacistQuestion = {
      ...data,
      id,
      status: "pending",
      createdAt: new Date(),
      createdBy: CURRENT_USER,
    };
    set((state) => ({ questions: [question, ...state.questions] }));
    return id;
  },

  answerQuestion: (questionId, pharmacistName, message) => {
    const trimmedName = pharmacistName.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;

    const answer: PharmacistAnswer = {
      id: `a-${nextAnswerIdCounter++}`,
      pharmacistName: trimmedName,
      message: trimmedMessage,
      createdAt: new Date(),
    };

    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId ? { ...q, status: "answered", answer } : q,
      ),
    }));

    const question = get().questions.find((q) => q.id === questionId);
    useNotificationStore.getState().addNotification(
      "pharmacist_response_received",
      "Your question was answered",
      `${trimmedName} answered your question${question?.medicationName ? ` about ${question.medicationName}` : ""}.`,
      { pathname: "/help/question-details", params: { id: questionId } },
    );
  },
}));

