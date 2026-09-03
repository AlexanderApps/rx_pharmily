import { create } from "zustand";
import {
  AppNotification,
  NotificationCategory,
  NotificationCategoryMeta,
  NotificationSettings,
} from "@/features/notifications/types/notifications.types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// The full catalog of what can be toggled, grouped by feature section so
// the settings screen can render one block per feature. Adding a new
// notification category means adding it here — TypeScript will complain
// anywhere a Record<NotificationCategory, ...> is missing it.
export const CATEGORY_META: NotificationCategoryMeta[] = [
  {
    category: "rxrfq_new_entry",
    section: "RxRFQs",
    label: "New RxRFQ posted",
    description: "Any time a facility posts a new request for quote.",
    defaultEnabled: false,
  },
  {
    category: "rxrfq_response_received",
    section: "RxRFQs",
    label: "Response to my RxRFQ",
    description: "A vendor responds to a request for quote you posted.",
    defaultEnabled: true,
  },
  {
    category: "rxrfq_award_decision",
    section: "RxRFQs",
    label: "Award decisions",
    description: "Your quote is awarded or not, on an RxRFQ you responded to.",
    defaultEnabled: true,
  },
  {
    category: "donation_new_entry",
    section: "Donations",
    label: "New donation posted",
    description: "Any time a facility posts a new donation.",
    defaultEnabled: false,
  },
  {
    category: "donation_claim_received",
    section: "Donations",
    label: "Claim on my donation",
    description: "Someone claims items from a donation you posted.",
    defaultEnabled: true,
  },
  {
    category: "donation_claim_decision",
    section: "Donations",
    label: "My claim approved/declined",
    description: "The donor decides on a claim you submitted.",
    defaultEnabled: true,
  },
  {
    category: "mediscope_new_entry",
    section: "MediScope",
    label: "New MediScope request",
    description: "Any time a facility posts a new product search.",
    defaultEnabled: false,
  },
  {
    category: "mediscope_response_received",
    section: "MediScope",
    label: "Response to my request",
    description: "Someone responds to a MediScope request you posted.",
    defaultEnabled: true,
  },
  {
    category: "jobs_new_entry",
    section: "RxJobs",
    label: "New job posted",
    description: "Any time a new job listing goes up.",
    defaultEnabled: false,
  },
  {
    category: "jobs_application_received",
    section: "RxJobs",
    label: "New applicant",
    description: "Someone applies to a job you posted.",
    defaultEnabled: true,
  },
  {
    category: "jobs_application_status",
    section: "RxJobs",
    label: "My application status",
    description: "An employer updates the status of your application.",
    defaultEnabled: true,
  },
  {
    category: "ads_status_decision",
    section: "RxAds",
    label: "Ad approved/rejected",
    description: "Your submitted ad is reviewed.",
    defaultEnabled: true,
  },
  {
    category: "ads_new_comment",
    section: "RxAds",
    label: "New comment on my ad",
    description: "Someone comments on an ad you posted.",
    defaultEnabled: true,
  },
  {
    category: "consult_response_received",
    section: "RxHelp",
    label: "Consult replies",
    description: "A consultant responds to your consult request.",
    defaultEnabled: true,
  },
  {
    category: "pharmacist_response_received",
    section: "RxHelp",
    label: "Pharmacist answers",
    description: "A pharmacist answers a question you asked.",
    defaultEnabled: true,
  },
  {
    category: "rxlink_new_entry",
    section: "RxLink",
    label: "New RxLink request",
    description: "Someone submits a new medication search request.",
    defaultEnabled: false,
  },
  {
    category: "rxlink_response_received",
    section: "RxLink",
    label: "Response to my RxLink request",
    description: "An admin responds to your medication search request.",
    defaultEnabled: true,
  },
  {
    category: "chat_new_message",
    section: "Chat",
    label: "New messages",
    description: "Someone sends you a chat message.",
    defaultEnabled: true,
  },
  {
    category: "kyc_decision",
    section: "Account",
    label: "Verification decisions",
    description: "Your user, facility, or organization KYC is approved or rejected.",
    defaultEnabled: true,
  },
  {
    category: "facility_member_added",
    section: "Account",
    label: "Facility membership changes",
    description: "Someone is added to or removed from a facility you belong to.",
    defaultEnabled: true,
  },
  {
    category: "facility_added_to_organization",
    section: "Account",
    label: "Organization changes",
    description: "A facility is added to or removed from an organization you administer.",
    defaultEnabled: true,
  },
  {
    category: "facility_creation_decision",
    section: "Account",
    label: "Facility creation decisions",
    description: "A facility you requested to create is approved or rejected.",
    defaultEnabled: true,
  },
  {
    category: "organization_creation_decision",
    section: "Account",
    label: "Organization creation decisions",
    description: "An organization you requested to create is approved or rejected.",
    defaultEnabled: true,
  },
  {
    category: "facility_membership_request_received",
    section: "Account",
    label: "New membership requests",
    description: "Someone requests to join a facility you own.",
    defaultEnabled: false,
  },
  {
    category: "facility_membership_decision",
    section: "Account",
    label: "Membership request decisions",
    description: "Your request to join a facility is approved or rejected.",
    defaultEnabled: true,
  },
  {
    category: "facility_organization_request_received",
    section: "Account",
    label: "New facility-to-organization requests",
    description: "A facility requests to join an organization you administer.",
    defaultEnabled: false,
  },
  {
    category: "facility_organization_decision",
    section: "Account",
    label: "Facility-to-organization decisions",
    description: "A facility you own requested to join an organization, and it was approved or rejected.",
    defaultEnabled: true,
  },
  {
    category: "formulary_request_decision",
    section: "Catalog",
    label: "Formulary request decisions",
    description: "A medication you requested for the catalog is accepted or rejected.",
    defaultEnabled: true,
  },
];

function buildDefaultSettings(): NotificationSettings {
  const settings = {} as NotificationSettings;
  for (const meta of CATEGORY_META) {
    settings[meta.category] = meta.defaultEnabled;
  }
  return settings;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    category: "mediscope_response_received",
    title: "New response on your MediScope request",
    body: "Trust Hospital Pharmacy responded to your search for Insulin Glargine.",
    createdAt: hoursAgo(3),
    read: false,
    link: { pathname: "/mediscope/mediscope-details" },
  },
  {
    id: "n2",
    category: "kyc_decision",
    title: "Facility verified",
    body: "Adenta Pharmacy has been verified.",
    createdAt: hoursAgo(38),
    read: true,
    link: { pathname: "/profile/facility-profile" },
  },
  {
    id: "n3",
    category: "consult_response_received",
    title: "Consultant replied",
    body: "Dr. Efua Owusu replied to your facility setup consult request.",
    createdAt: hoursAgo(49),
    read: true,
    link: { pathname: "/help/consult-list" },
  },
];

let nextNotificationIdCounter = MOCK_NOTIFICATIONS.length + 1;

type NotificationStore = {
  notifications: AppNotification[];
  settings: NotificationSettings;

  addNotification: (
    category: NotificationCategory,
    title: string,
    body: string,
    link?: AppNotification["link"],
  ) => void;

  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;

  updateSetting: (category: NotificationCategory, enabled: boolean) => void;
  setAllInSection: (section: string, enabled: boolean) => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: MOCK_NOTIFICATIONS,
  settings: buildDefaultSettings(),

  addNotification: (category, title, body, link) => {
    if (!get().settings[category]) return;

    const notification: AppNotification = {
      id: `n${nextNotificationIdCounter++}`,
      category,
      title,
      body,
      createdAt: new Date(),
      read: false,
      link,
    };
    set((state) => ({ notifications: [notification, ...state.notifications] }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  deleteNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },

  clearAll: () => set({ notifications: [] }),

  updateSetting: (category, enabled) => {
    set((state) => ({ settings: { ...state.settings, [category]: enabled } }));
  },

  setAllInSection: (section, enabled) => {
    const categoriesInSection = CATEGORY_META.filter((m) => m.section === section).map(
      (m) => m.category,
    );
    set((state) => {
      const settings = { ...state.settings };
      for (const category of categoriesInSection) settings[category] = enabled;
      return { settings };
    });
  },
}));
