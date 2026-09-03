// Every notification belongs to a category, and every category has its own
// on/off toggle in NotificationSettings — that's the "even more granularity"
// piece: someone can want "response to my own MediScope request" without
// wanting "every new MediScope request posted by anyone," and vice versa.

export type NotificationCategory =
  // RxRFQ
  | "rxrfq_new_entry"
  | "rxrfq_response_received"
  | "rxrfq_award_decision"
  // Donations
  | "donation_new_entry"
  | "donation_claim_received"
  | "donation_claim_decision"
  // MediScope
  | "mediscope_new_entry"
  | "mediscope_response_received"
  // RxJobs
  | "jobs_new_entry"
  | "jobs_application_received"
  | "jobs_application_status"
  // RxAds
  | "ads_status_decision"
  | "ads_new_comment"
  // RxHelp — Consult
  | "consult_response_received"
  // RxHelp — Ask Your Pharmacist
  | "pharmacist_response_received"
  // RxLink
  | "rxlink_new_entry"
  | "rxlink_response_received"
  // Chat
  | "chat_new_message"
  // Identity / KYC
  | "kyc_decision"
  | "facility_member_added"
  | "facility_added_to_organization"
  | "facility_creation_decision"
  | "organization_creation_decision"
  | "facility_membership_request_received"
  | "facility_membership_decision"
  | "facility_organization_request_received"
  | "facility_organization_decision"
  // Catalog
  | "formulary_request_decision";

export interface NotificationCategoryMeta {
  category: NotificationCategory;
  section: string;
  label: string;
  description: string;
  // "new entry" style categories default OFF (noisy, opt-in); "response to
  // my own thing" and account-level categories default ON.
  defaultEnabled: boolean;
}

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
  // Where tapping the notification should navigate to.
  link?: { pathname: string; params?: Record<string, string> };
}

// One boolean per category — Record keeps this in lockstep with
// NotificationCategory so a new category can't be added without also
// wiring its settings toggle.
export type NotificationSettings = Record<NotificationCategory, boolean>;
