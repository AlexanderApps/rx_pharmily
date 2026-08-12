// RxHelp has three distinct sections:
//  - Help & Report: how-to-use-the-app content, FAQ, and a place to report
//    bugs or other users.
//  - Consult: a formal request queue to get advice from an experienced
//    pharmacist on business/career topics (facility setup, procurement,
//    career moves, regulatory questions).
//  - Ask Your Pharmacist: informal medication Q&A (interactions, how to
//    take a medication, side effects). This one carries real safety weight
//    — see EMERGENCY_CATEGORY handling in the store/UI, which routes
//    anything flagged urgent to immediate crisis guidance rather than
//    queuing it for an async reply.

// ─── Help & Report ──────────────────────────────────────────────────────

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export type ReportType = "bug" | "user" | "content" | "other";
export type ReportStatus = "submitted" | "in_review" | "resolved" | "dismissed";

export interface ReportTicket {
  id: string;
  type: ReportType;
  subject: string;
  description: string;
  reportedUser?: string;
  status: ReportStatus;
  createdAt: Date;
  createdBy: string;
}

export interface ReportFormData {
  type: ReportType;
  subject: string;
  description: string;
  reportedUser?: string;
}

// ─── Consult ─────────────────────────────────────────────────────────────

export type ConsultCategory =
  | "New Facility Setup"
  | "Procurement Trends"
  | "Career Pivoting"
  | "Regulatory Advice"
  | "Other";

export type ConsultFormat = "chat" | "call" | "in_person";
export type ConsultStatus = "pending" | "accepted" | "completed" | "cancelled";

export interface ConsultRequest {
  id: string;
  code: string;
  category: ConsultCategory;
  subject: string;
  description: string;
  preferredFormat: ConsultFormat;
  status: ConsultStatus;
  consultantName?: string;
  scheduledAt?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface ConsultFormData {
  category: ConsultCategory;
  subject: string;
  description: string;
  preferredFormat: ConsultFormat;
}

export interface ConsultResponse {
  id: string;
  requestId: string;
  consultantName: string;
  message: string;
  createdAt: Date;
}

// ─── Ask Your Pharmacist ────────────────────────────────────────────────

export type PharmacistQuestionCategory =
  | "Drug Interaction"
  | "Dosage & Administration"
  | "Side Effects"
  | "Overdose / Emergency"
  | "General";

// Categories that should never sit in an async queue — the UI shows
// immediate crisis/emergency guidance for these instead of just submitting
// a ticket and waiting.
export const URGENT_PHARMACIST_CATEGORIES: PharmacistQuestionCategory[] = [
  "Overdose / Emergency",
];

export type PharmacistQuestionStatus = "pending" | "answered" | "closed";

export interface PharmacistAnswer {
  id: string;
  pharmacistName: string;
  message: string;
  createdAt: Date;
}

export interface PharmacistQuestion {
  id: string;
  category: PharmacistQuestionCategory;
  medicationName?: string;
  question: string;
  status: PharmacistQuestionStatus;
  createdAt: Date;
  createdBy: string;
  answer?: PharmacistAnswer;
}

export interface PharmacistQuestionFormData {
  category: PharmacistQuestionCategory;
  medicationName?: string;
  question: string;
}
