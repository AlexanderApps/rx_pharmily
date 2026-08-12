import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
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

function mapFaqRow(row: any): FaqItem {
  return { id: row.id, question: row.question, answer: row.answer, category: row.category };
}

function mapReportRow(row: any): ReportTicket {
  return {
    id: row.id,
    type: row.type,
    subject: row.subject,
    description: row.description,
    reportedUser: row.reported_user ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
  };
}

function mapConsultRequestRow(row: any): ConsultRequest {
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    subject: row.subject,
    description: row.description,
    preferredFormat: row.preferred_format,
    status: row.status,
    consultantName: row.consultant_name ?? undefined,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
  };
}

function mapConsultResponseRow(row: any): ConsultResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    consultantName: row.consultant_name,
    message: row.message,
    createdAt: new Date(row.created_at),
  };
}

function mapQuestionRow(row: any): PharmacistQuestion {
  return {
    id: row.id,
    category: row.category,
    medicationName: row.medication_name ?? undefined,
    question: row.question,
    status: row.status,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    answer: row.pharmacist_answers?.[0] ? mapAnswerRow(row.pharmacist_answers[0]) : undefined,
  };
}

function mapAnswerRow(row: any): PharmacistAnswer {
  return {
    id: row.id,
    pharmacistName: row.pharmacist_name,
    message: row.message,
    createdAt: new Date(row.created_at),
  };
}

function generateConsultCode(seed: string) {
  return `CON-${new Date().getFullYear()}-${seed.slice(0, 6).toUpperCase()}`;
}

const QUESTION_SELECT = "*, pharmacist_answers(*)";

type HelpStore = {
  faqItems: FaqItem[];
  reports: ReportTicket[];
  consultRequests: ConsultRequest[];
  consultResponsesByRequest: Record<string, ConsultResponse[]>;
  questions: PharmacistQuestion[];
  isLoadingReports: boolean;
  isLoadingConsultRequests: boolean;
  isLoadingQuestions: boolean;

  fetchFaqItems: () => Promise<void>;
  addFaqItem: (data: Omit<FaqItem, "id">) => Promise<boolean>;
  updateFaqItem: (id: string, data: Omit<FaqItem, "id">) => Promise<boolean>;
  deleteFaqItem: (id: string) => Promise<boolean>;
  fetchReports: () => Promise<void>;
  fetchConsultRequests: () => Promise<void>;
  fetchConsultResponses: (requestId: string) => Promise<void>;
  fetchQuestions: () => Promise<void>;

  getConsultResponses: (requestId: string) => ConsultResponse[];

  addReport: (data: ReportFormData) => Promise<boolean>;
  // Admin action — moves a report through submitted -> in_review -> resolved/dismissed.
  updateReportStatus: (id: string, status: ReportTicket["status"]) => Promise<boolean>;

  addConsultRequest: (data: ConsultFormData) => Promise<string | undefined>;
  cancelConsultRequest: (id: string) => Promise<boolean>;
  // Posts a reply on a consult request. A pending request moves to
  // "accepted" the moment it gets its first response.
  respondToConsult: (requestId: string, consultantName: string, message: string) => Promise<boolean>;
  completeConsultRequest: (id: string) => Promise<boolean>;

  addQuestion: (data: PharmacistQuestionFormData) => Promise<string | undefined>;
  // Posts the pharmacist's reply to a question and marks it answered.
  answerQuestion: (questionId: string, pharmacistName: string, message: string) => Promise<boolean>;
};

export const useHelpStore = create<HelpStore>((set, get) => ({
  faqItems: [],
  reports: [],
  consultRequests: [],
  consultResponsesByRequest: {},
  questions: [],
  isLoadingReports: false,
  isLoadingConsultRequests: false,
  isLoadingQuestions: false,

  fetchFaqItems: async () => {
    const { data, error } = await supabase.from("faq_items").select("*").order("category");
    if (error) {
      console.warn("[help] fetchFaqItems failed:", error.message);
      return;
    }
    set({ faqItems: (data ?? []).map(mapFaqRow) });
  },

  addFaqItem: async (data) => {
    const { data: row, error } = await supabase
      .from("faq_items")
      .insert({ question: data.question, answer: data.answer, category: data.category })
      .select()
      .single();
    if (error || !row) {
      console.warn("[help] addFaqItem failed:", error?.message);
      return false;
    }
    set((state) => ({ faqItems: [...state.faqItems, mapFaqRow(row)] }));
    return true;
  },

  updateFaqItem: async (id, data) => {
    const { error } = await supabase
      .from("faq_items")
      .update({ question: data.question, answer: data.answer, category: data.category })
      .eq("id", id);
    if (error) {
      console.warn("[help] updateFaqItem failed:", error.message);
      return false;
    }
    set((state) => ({
      faqItems: state.faqItems.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
    return true;
  },

  deleteFaqItem: async (id) => {
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) {
      console.warn("[help] deleteFaqItem failed:", error.message);
      return false;
    }
    set((state) => ({ faqItems: state.faqItems.filter((f) => f.id !== id) }));
    return true;
  },

  fetchReports: async () => {
    set({ isLoadingReports: true });
    const { data, error } = await supabase
      .from("report_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[help] fetchReports failed:", error.message);
      set({ isLoadingReports: false });
      return;
    }
    set({ reports: (data ?? []).map(mapReportRow), isLoadingReports: false });
  },

  fetchConsultRequests: async () => {
    set({ isLoadingConsultRequests: true });
    const { data, error } = await supabase
      .from("consult_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[help] fetchConsultRequests failed:", error.message);
      set({ isLoadingConsultRequests: false });
      return;
    }
    set({ consultRequests: (data ?? []).map(mapConsultRequestRow), isLoadingConsultRequests: false });
  },

  fetchConsultResponses: async (requestId) => {
    const { data, error } = await supabase
      .from("consult_responses")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[help] fetchConsultResponses failed:", error.message);
      return;
    }
    set((state) => ({
      consultResponsesByRequest: { ...state.consultResponsesByRequest, [requestId]: (data ?? []).map(mapConsultResponseRow) },
    }));
  },

  fetchQuestions: async () => {
    set({ isLoadingQuestions: true });
    const { data, error } = await supabase
      .from("pharmacist_questions")
      .select(QUESTION_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[help] fetchQuestions failed:", error.message);
      set({ isLoadingQuestions: false });
      return;
    }
    set({ questions: (data ?? []).map(mapQuestionRow), isLoadingQuestions: false });
  },

  getConsultResponses: (requestId) => get().consultResponsesByRequest[requestId] ?? [],

  addReport: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("report_tickets")
      .insert({
        type: data.type,
        subject: data.subject,
        description: data.description,
        reported_user: data.reportedUser ?? null,
        created_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[help] addReport failed:", error?.message);
      return false;
    }
    set((state) => ({ reports: [mapReportRow(row), ...state.reports] }));
    return true;
  },

  updateReportStatus: async (id, status) => {
    const { error } = await supabase.from("report_tickets").update({ status }).eq("id", id);
    if (error) {
      console.warn("[help] updateReportStatus failed:", error.message);
      return false;
    }
    set((state) => ({ reports: state.reports.map((r) => (r.id === id ? { ...r, status } : r)) }));
    return true;
  },

  addConsultRequest: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("consult_requests")
      .insert({
        code: generateConsultCode(Date.now().toString()),
        category: data.category,
        subject: data.subject,
        description: data.description,
        preferred_format: data.preferredFormat,
        status: "pending",
        created_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[help] addConsultRequest failed:", error?.message);
      return undefined;
    }
    const request = mapConsultRequestRow(row);
    set((state) => ({ consultRequests: [request, ...state.consultRequests] }));
    return request.id;
  },

  cancelConsultRequest: async (id) => {
    const { error } = await supabase.from("consult_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      console.warn("[help] cancelConsultRequest failed:", error.message);
      return false;
    }
    set((state) => ({
      consultRequests: state.consultRequests.map((c) =>
        c.id === id ? { ...c, status: "cancelled" as ConsultStatus } : c,
      ),
    }));
    return true;
  },

  respondToConsult: async (requestId, consultantName, message) => {
    const trimmedName = consultantName.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return false;

    const { data: row, error } = await supabase
      .from("consult_responses")
      .insert({ request_id: requestId, consultant_name: trimmedName, message: trimmedMessage })
      .select()
      .single();
    if (error || !row) {
      console.warn("[help] respondToConsult failed:", error?.message);
      return false;
    }

    const response = mapConsultResponseRow(row);
    const existing = get().consultRequests.find((c) => c.id === requestId);
    const nextStatus: ConsultStatus = existing?.status === "pending" ? "accepted" : (existing?.status ?? "accepted");

    await supabase
      .from("consult_requests")
      .update({ consultant_name: existing?.consultantName ?? trimmedName, status: nextStatus })
      .eq("id", requestId);

    set((state) => ({
      consultResponsesByRequest: {
        ...state.consultResponsesByRequest,
        [requestId]: [...(state.consultResponsesByRequest[requestId] ?? []), response],
      },
      consultRequests: state.consultRequests.map((c) =>
        c.id === requestId ? { ...c, consultantName: c.consultantName ?? trimmedName, status: nextStatus } : c,
      ),
    }));

    const request = get().consultRequests.find((c) => c.id === requestId);
    useNotificationStore.getState().addNotification(
      "consult_response_received",
      "Consultant replied",
      `${trimmedName} replied to your request${request ? `: "${request.subject}"` : ""}.`,
      { pathname: "/help/consult-details", params: { id: requestId } },
    );
    return true;
  },

  completeConsultRequest: async (id) => {
    const { error } = await supabase.from("consult_requests").update({ status: "completed" }).eq("id", id);
    if (error) {
      console.warn("[help] completeConsultRequest failed:", error.message);
      return false;
    }
    set((state) => ({
      consultRequests: state.consultRequests.map((c) =>
        c.id === id ? { ...c, status: "completed" as ConsultStatus } : c,
      ),
    }));
    return true;
  },

  addQuestion: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("pharmacist_questions")
      .insert({
        category: data.category,
        medication_name: data.medicationName ?? null,
        question: data.question,
        status: "pending",
        created_by: userId,
      })
      .select(QUESTION_SELECT)
      .single();
    if (error || !row) {
      console.warn("[help] addQuestion failed:", error?.message);
      return undefined;
    }
    const question = mapQuestionRow(row);
    set((state) => ({ questions: [question, ...state.questions] }));
    return question.id;
  },

  answerQuestion: async (questionId, pharmacistName, message) => {
    const trimmedName = pharmacistName.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return false;

    const { data: row, error } = await supabase
      .from("pharmacist_answers")
      .insert({ question_id: questionId, pharmacist_name: trimmedName, message: trimmedMessage })
      .select()
      .single();
    if (error || !row) {
      console.warn("[help] answerQuestion failed:", error?.message);
      return false;
    }

    await supabase.from("pharmacist_questions").update({ status: "answered" }).eq("id", questionId);

    const answer = mapAnswerRow(row);
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
    return true;
  },
}));
