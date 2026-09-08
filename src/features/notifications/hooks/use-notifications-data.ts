import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  AppNotification,
  NotificationCategory,
  NotificationCategoryMeta,
  NotificationSettings,
} from "@/features/notifications/types/notifications.types";

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

function mapNotificationRow(row: any): AppNotification {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    createdAt: new Date(row.created_at),
    read: row.read,
    link: row.link_pathname
      ? { pathname: row.link_pathname, params: row.link_params ?? undefined }
      : undefined,
  };
}

type NotificationStore = {
  notifications: AppNotification[];
  settings: NotificationSettings;
  isLoading: boolean;
  // Tracked so unsubscribe has something to call — not read by any UI.
  realtimeChannel: RealtimeChannel | null;

  fetchNotifications: () => Promise<void>;
  fetchSettings: () => Promise<void>;

  // Live delivery on top of fetchNotifications — that one-time fetch
  // still owns the initial list (including everything that arrived
  // before this session started); this covers what arrives afterward
  // without needing a reload or a return trip to this screen. Call once
  // per signed-in session (app/_layout.tsx does this); safe to call
  // again since it tears down any existing channel first.
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;

  // Fire-and-forget from every call site's point of view — none of the
  // ~30 places this is called from need to await it, since notification
  // delivery is never on the critical path of the action it's attached
  // to. recipientId is the person who should SEE this, which is very
  // often not the current user (e.g. "your RFQ got a response" is
  // triggered by the responder, but delivered to the RFQ's owner).
  addNotification: (
    recipientId: string,
    category: NotificationCategory,
    title: string,
    body: string,
    link?: AppNotification["link"],
  ) => Promise<void>;

  // For "_new_entry" style categories — a new listing genuinely has no
  // single recipient, it's meant for everyone who's opted into hearing
  // about new posts in that category (which is why every _new_entry
  // category in CATEGORY_META defaults to OFF — this is the noisy,
  // opt-in tier, unlike "someone responded to your own thing"). Finds
  // every profile that's explicitly turned this category on and writes
  // one row per recipient.
  addBroadcastNotification: (
    category: NotificationCategory,
    title: string,
    body: string,
    link?: AppNotification["link"],
    adminOnly?: boolean,
  ) => Promise<void>;

  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  updateSetting: (category: NotificationCategory, enabled: boolean) => Promise<void>;
  setAllInSection: (section: string, enabled: boolean) => Promise<void>;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  settings: buildDefaultSettings(),
  isLoading: false,
  realtimeChannel: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.warn("[notifications] fetchNotifications failed:", error.message);
      set({ isLoading: false });
      return;
    }
    // Categories a person has turned off are filtered out here, at read
    // time, rather than skipped at write time — the inserting client
    // (almost always a different user than the recipient) has no
    // reliable way to check the recipient's own preferences without an
    // extra round trip on every one of the ~30 call sites, so every
    // notification gets written and each recipient's own client hides
    // what they've opted out of.
    const settings = get().settings;
    const raw = (data ?? []).map(mapNotificationRow);
    const visible = raw.filter((n) => settings[n.category] !== false);
    console.log(
      `[notifications] fetchNotifications: ${raw.length} row(s) from the database, ` +
        `${visible.length} visible after this account's own settings filter`,
    );
    set({ notifications: visible, isLoading: false });
  },

  fetchSettings: async () => {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch {
      console.warn("[notifications] fetchSettings skipped: not signed in (yet)");
      return;
    }
    const { data, error } = await supabase
      .from("notification_settings")
      .select("category, enabled")
      .eq("user_id", userId);
    if (error) {
      console.warn("[notifications] fetchSettings failed:", error.message);
      return;
    }
    const overrides: Partial<NotificationSettings> = {};
    for (const row of data ?? []) {
      overrides[row.category as NotificationCategory] = row.enabled;
    }
    set({ settings: { ...buildDefaultSettings(), ...overrides } });
  },

  subscribeToNotifications: (userId) => {
    // Tear down any existing channel first — calling this twice for the
    // same user (or across a sign-out/sign-in without an explicit
    // unsubscribe in between) would otherwise leave a stale channel
    // running alongside the new one, delivering every event twice.
    get().unsubscribeFromNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = mapNotificationRow(payload.new);
          // Same settings-based visibility rule as fetchNotifications —
          // a category this account has turned off shouldn't pop in
          // live just because a row happened to be written for it.
          if (get().settings[notification.category] === false) return;
          console.log(`[notifications] realtime: new notification (${notification.category})`);
          set((state) => ({ notifications: [notification, ...state.notifications] }));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          // Keeps read/unread state in sync across tabs or devices —
          // e.g. marking something read on your phone clears it here
          // too, without a manual refresh.
          const updated = mapNotificationRow(payload.new);
          set((state) => ({
            notifications: state.notifications.map((n) => (n.id === updated.id ? updated : n)),
          }));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (!deletedId) return;
          set((state) => ({ notifications: state.notifications.filter((n) => n.id !== deletedId) }));
        },
      )
      .subscribe((status) => {
        console.log(`[notifications] realtime channel status: ${status}`);
      });

    set({ realtimeChannel: channel });
  },

  unsubscribeFromNotifications: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
    }
  },

  addNotification: async (recipientId, category, title, body, link) => {
    const currentUserId = await requireUserId();
    // No point notifying someone about their own action.
    if (recipientId === currentUserId) {
      console.log(`[notifications] addNotification(${category}): skipped, recipient is the current user`);
      return;
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: recipientId,
      category,
      title,
      body,
      link_pathname: link?.pathname ?? null,
      link_params: link?.params ?? null,
    });
    if (error) {
      console.warn(`[notifications] addNotification(${category}) insert failed:`, {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      });
    } else {
      console.log(`[notifications] addNotification(${category}): sent to ${recipientId}`);
    }
  },

  addBroadcastNotification: async (category, title, body, link, adminOnly) => {
    const currentUserId = await requireUserId();
    // IMPORTANT STRUCTURAL LIMITATION, not just a logging nuance:
    // notification_settings' RLS policy is "user_id = auth.uid()" — a
    // regular authenticated client can only ever see its OWN row here,
    // never another user's. That means this query can never actually
    // discover who else has this category enabled; optedInIds below can
    // only ever come out as [] or [currentUserId], regardless of how
    // many other accounts are genuinely opted in. This function has
    // effectively never been able to broadcast correctly to anyone but
    // possibly-yourself. The Edge Function version of this same logic
    // (supabase/functions/notify-dispatch/helpers.ts) doesn't have this
    // problem — it runs with the service role key, which bypasses RLS
    // entirely, so it can see every user's real settings. That's the
    // actual fix; once a table's webhook is verified working (see that
    // function's README), remove the matching client-side call here
    // rather than trying to patch this one further.
    const { data: settingsRows, error: settingsError } = await supabase
      .from("notification_settings")
      .select("user_id")
      .eq("category", category)
      .eq("enabled", true);
    if (settingsError) {
      console.warn(`[notifications] addBroadcastNotification(${category}) settings lookup failed:`, settingsError.message);
      return;
    }
    const optedInIds = (settingsRows ?? []).map((r) => r.user_id as string);
    let recipientIds = optedInIds.filter((id) => id !== currentUserId);
    if (recipientIds.length === 0) {
      console.log(
        `[notifications] addBroadcastNotification(${category}): 0 recipients visible to this client — this ` +
          `does NOT mean nobody else is opted in. RLS restricts this query to the acting user's own ` +
          `notification_settings row, so other accounts' settings are invisible here by design. Check the ` +
          `Edge Function's logs instead once its webhook is set up — it uses the service role and can see ` +
          `everyone's real settings.`,
      );
      return;
    }

    if (adminOnly) {
      // Some categories (RxLink today) are meaningless for a regular
      // user to receive — only admins/superadmins can actually act on
      // them, matching that feature's own response-permission design.
      // Two queries + a client-side intersection rather than a
      // relational join, to keep this predictable rather than betting
      // on embedded-resource filter syntax.
      const { data: adminRows, error: adminError } = await supabase
        .from("profiles")
        .select("id")
        .in("account_role", ["admin", "superadmin"])
        .in("id", recipientIds);
      if (adminError) {
        console.warn(`[notifications] addBroadcastNotification(${category}) admin lookup failed:`, adminError.message);
        return;
      }
      const adminIds = new Set((adminRows ?? []).map((r) => r.id as string));
      recipientIds = recipientIds.filter((id) => adminIds.has(id));
      if (recipientIds.length === 0) {
        console.log(`[notifications] addBroadcastNotification(${category}): 0 recipients after admin-only filter`);
        return;
      }
    }

    const { error: insertError } = await supabase.from("notifications").insert(
      recipientIds.map((userId) => ({
        user_id: userId,
        category,
        title,
        body,
        link_pathname: link?.pathname ?? null,
        link_params: link?.params ?? null,
      })),
    );
    if (insertError) {
      console.warn(`[notifications] addBroadcastNotification(${category}) insert failed:`, {
        message: insertError.message,
        code: (insertError as any).code,
        details: (insertError as any).details,
        hint: (insertError as any).hint,
      });
    } else {
      console.log(`[notifications] addBroadcastNotification(${category}): sent to ${recipientIds.length} recipient(s)`);
    }
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) console.warn("[notifications] markAsRead failed:", error.message);
  },

  markAllRead: async () => {
    const unreadIds = get().notifications.filter((n) => !n.read).map((n) => n.id);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    if (error) console.warn("[notifications] markAllRead failed:", error.message);
  },

  deleteNotification: async (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) console.warn("[notifications] deleteNotification failed:", error.message);
  },

  clearAll: async () => {
    const ids = get().notifications.map((n) => n.id);
    set({ notifications: [] });
    if (ids.length === 0) return;
    const { error } = await supabase.from("notifications").delete().in("id", ids);
    if (error) console.warn("[notifications] clearAll failed:", error.message);
  },

  updateSetting: async (category, enabled) => {
    const previousValue = get().settings[category];
    set((state) => ({ settings: { ...state.settings, [category]: enabled } }));
    const userId = await requireUserId();
    const { error } = await supabase
      .from("notification_settings")
      .upsert({ user_id: userId, category, enabled }, { onConflict: "user_id,category" });
    if (error) {
      console.warn(`[notifications] updateSetting(${category}) failed, reverting toggle:`, error.message);
      // The toggle was already flipped optimistically above — undo that
      // rather than leave the UI showing "on" when it never actually
      // saved, which would otherwise look fine right up until this
      // exact category's broadcast notifications mysteriously never
      // reach this account.
      set((state) => ({ settings: { ...state.settings, [category]: previousValue } }));
    } else {
      console.log(`[notifications] updateSetting(${category}): saved as ${enabled}`);
    }
  },

  setAllInSection: async (section, enabled) => {
    const categoriesInSection = CATEGORY_META.filter((m) => m.section === section).map(
      (m) => m.category,
    );
    const nextSettings = { ...get().settings };
    for (const category of categoriesInSection) nextSettings[category] = enabled;
    set({ settings: nextSettings });
    const userId = await requireUserId();
    const { error } = await supabase
      .from("notification_settings")
      .upsert(
        categoriesInSection.map((category) => ({ user_id: userId, category, enabled })),
        { onConflict: "user_id,category" },
      );
    if (error) console.warn("[notifications] setAllInSection failed:", error.message);
  },
}));
