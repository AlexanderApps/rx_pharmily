import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  Ad,
  AdAuthor,
  AdComment,
  AdFormData,
  AdPayment,
  AdPlan,
  AdReport,
  FDA_ID_REQUIRED_CATEGORIES,
  ReactionType,
} from "@/features/ads/types/ads.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { usePaymentsStore } from "@/features/payments/hooks/use-payments-data";

// Pricing plans are real reference data (what a purchased ad's plan_*
// columns snapshot at purchase time), not user-generated content — no
// database table backs this, same as RxRFQ's static incoterm options.
export const AD_PLANS: AdPlan[] = [
  {
    id: "plan-7",
    name: "7-Day Basic",
    durationDays: 7,
    price: 150,
    currency: "GHS",
    description: "Standard placement in the community feed for one week.",
  },
  {
    id: "plan-30",
    name: "30-Day Featured",
    durationDays: 30,
    price: 500,
    currency: "GHS",
    description: "Priority placement plus a featured badge for a month.",
    featured: true,
  },
  {
    id: "plan-90",
    name: "90-Day Premium",
    durationDays: 90,
    price: 1200,
    currency: "GHS",
    description: "Maximum visibility across the app for a full quarter.",
    featured: true,
  },
];

function isFdaRequired(category: AdFormData["category"]) {
  return FDA_ID_REQUIRED_CATEGORIES.includes(category);
}

function mapAuthorFromProfile(profile: any): AdAuthor {
  return {
    id: profile?.id ?? "",
    name: profile?.full_name ?? "Unknown",
    role: undefined,
    avatarColor: profile?.avatar_color ?? "#64748b",
  };
}

function mapMediaRow(row: any) {
  return {
    id: row.id,
    type: row.type,
    uri: row.uri,
    sizeBytes: Number(row.size_bytes),
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    durationMs: row.duration_ms ?? undefined,
  };
}

// The joined payments row (via ads.payment_id) — mirrors
// features/payments/hooks/use-payments-data.ts's own mapPaymentRow, kept
// separate rather than imported since ads.types.ts (and, by extension,
// this store) is deliberately self-contained from other features.
// row is null when RLS blocks this nested read — see
// 20260823000000_payments_visibility_fix.sql for the actual fix (a
// payments row is now readable by anyone who can see its linked ad, once
// approved, matching ads' own visibility). This fallback stays as a
// defensive backstop regardless — "pending" is the conservative
// assumption here since approveAd()'s own gate treats anything short of
// a confirmed "paid" as not yet payable, and this shouldn't silently
// read as paid when the real status is actually unknown.
function mapAdPaymentRow(row: any): AdPayment {
  if (!row) {
    return {
      id: "",
      reference: "—",
      status: "pending",
      amountDue: 0,
      currency: "GHS",
      initiatedBy: "",
      createdAt: new Date(),
    };
  }
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    amountDue: Number(row.amount_due),
    amountPaid: row.amount_paid != null ? Number(row.amount_paid) : undefined,
    currency: row.currency,
    initiatedBy: row.initiated_by,
    reviewedBy: row.reviewed_by ?? undefined,
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

// userReaction is resolved from a separately-fetched map of the CURRENT
// user's own reactions (see fetchMyReactions) rather than stored on the
// ad itself — the real per-user ad_reactions table replaces the mock's
// single-viewer-scoped field entirely.
function mapAdRow(row: any, myReaction: ReactionType | null): Ad {
  return {
    id: row.id,
    advertiser: mapAuthorFromProfile(row.profiles),
    title: row.title,
    text: row.text,
    media: (row.ad_media ?? []).length > 0 ? (row.ad_media ?? []).map(mapMediaRow) : undefined,
    linkUrl: row.link_url ?? undefined,
    category: row.category,
    fdaApprovalId: row.fda_approval_id ?? undefined,
    status: row.status,
    statusReason: row.status_reason ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedByName: row.reviewer?.full_name ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    plan: {
      id: row.plan_id,
      name: row.plan_name,
      durationDays: row.plan_duration_days,
      price: Number(row.plan_price),
      currency: row.plan_currency,
      description: "",
    },
    payment: mapAdPaymentRow(row.payments),
    createdAt: new Date(row.created_at),
    startsAt: row.starts_at ? new Date(row.starts_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    likeCount: row.like_count,
    dislikeCount: row.dislike_count,
    userReaction: myReaction,
    commentCount: row.comment_count,
  };
}

function mapAdReportRow(row: any): AdReport {
  return {
    id: row.id,
    adId: row.ad_id,
    reporterId: row.reporter_id,
    reporterName: row.reporter?.full_name ?? "Unknown",
    reason: row.reason,
    status: row.status,
    createdAt: new Date(row.created_at),
    resolvedBy: row.resolved_by ?? undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
  };
}

function mapCommentRow(row: any): AdComment {
  return {
    id: row.id,
    adId: row.ad_id,
    author: mapAuthorFromProfile(row.profiles),
    text: row.text,
    createdAt: new Date(row.created_at),
  };
}

const AD_SELECT =
  "*, profiles:advertiser_id(id, full_name, avatar_color), reviewer:reviewed_by(id, full_name), ad_media(*), payments:payment_id(*)";

type AdsStore = {
  ads: Ad[];
  commentsByAd: Record<string, AdComment[]>;
  myReactions: Record<string, ReactionType>;
  plans: AdPlan[];
  isLoading: boolean;
  adReports: AdReport[];
  isLoadingReports: boolean;

  fetchAds: () => Promise<void>;
  fetchAd: (id: string) => Promise<void>;
  fetchComments: (adId: string) => Promise<void>;
  fetchMyReactions: () => Promise<void>;
  fetchAdReports: () => Promise<void>;

  getAd: (id: string) => Ad | undefined;
  getComments: (adId: string) => AdComment[];
  getReportsForAd: (adId: string) => AdReport[];

  submitAd: (data: AdFormData) => Promise<string | undefined>;
  updateAd: (id: string, data: AdFormData) => Promise<boolean>;
  deleteAd: (id: string) => Promise<boolean>;

  approveAd: (id: string) => Promise<boolean>;
  rejectAd: (id: string, reason: string) => Promise<void>;
  suspendAd: (id: string, reason: string) => Promise<void>;
  reinstateAd: (id: string) => Promise<boolean>;
  banAd: (id: string, reason: string) => Promise<void>;
  dismissReport: (reportId: string) => Promise<boolean>;
  // Internal helper, not meant to be called directly from UI — bulk-
  // resolves any still-open reports against an ad once an admin has
  // actually acted on it (suspend/ban), so the reports queue doesn't
  // keep showing reports for an ad that's already been dealt with.
  resolveOpenReportsForAd: (adId: string, resolverId: string) => Promise<void>;

  // Owner self-serve lifecycle — distinct from the admin moderation
  // actions above. All three go through the set_own_ad_lifecycle RPC
  // (see 20260901000001_ad_moderation_and_reports.sql), which validates
  // the specific old-status -> new-status transition server-side.
  pauseAd: (id: string) => Promise<boolean>;
  resumeAd: (id: string) => Promise<boolean>;
  closeAd: (id: string) => Promise<boolean>;
  reportAd: (adId: string, reason: string) => Promise<boolean>;

  toggleReaction: (adId: string, reaction: ReactionType) => Promise<void>;
  addComment: (adId: string, text: string) => Promise<void>;
};

export const useAdsStore = create<AdsStore>((set, get) => ({
  ads: [],
  commentsByAd: {},
  myReactions: {},
  plans: AD_PLANS,
  isLoading: false,
  adReports: [],
  isLoadingReports: false,

  fetchAds: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("ads")
      .select(AD_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[ads] fetchAds failed:", error.message);
      set({ isLoading: false });
      return;
    }
    const myReactions = get().myReactions;
    set({
      ads: (data ?? []).map((row: any) => mapAdRow(row, myReactions[row.id] ?? null)),
      isLoading: false,
    });
  },

  fetchAd: async (id) => {
    const { data, error } = await supabase.from("ads").select(AD_SELECT).eq("id", id).single();
    if (error || !data) {
      console.warn("[ads] fetchAd failed:", error?.message);
      return;
    }
    const myReaction = get().myReactions[id] ?? null;
    const ad = mapAdRow(data, myReaction);
    set((state) => ({ ads: [ad, ...state.ads.filter((a) => a.id !== id)] }));
  },

  fetchComments: async (adId) => {
    const { data, error } = await supabase
      .from("ad_comments")
      .select("*, profiles:author_id(id, full_name, avatar_color)")
      .eq("ad_id", adId)
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[ads] fetchComments failed:", error.message);
      return;
    }
    set((state) => ({
      commentsByAd: { ...state.commentsByAd, [adId]: (data ?? []).map(mapCommentRow) },
    }));
  },

  fetchMyReactions: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("ad_reactions").select("ad_id, reaction").eq("user_id", userId);
    if (error) {
      console.warn("[ads] fetchMyReactions failed:", error.message);
      return;
    }
    const myReactions: Record<string, ReactionType> = {};
    for (const row of data ?? []) myReactions[row.ad_id] = row.reaction;
    set((state) => ({
      myReactions,
      ads: state.ads.map((a) => ({ ...a, userReaction: myReactions[a.id] ?? null })),
    }));
  },

  // Admin-only in practice — RLS only returns rows for reports the
  // caller made themselves or (if they're an admin) every report. A
  // non-admin calling this just gets their own reports back, which is
  // fine since this app's UI only ever calls it from the moderation
  // screen.
  fetchAdReports: async () => {
    set({ isLoadingReports: true });
    const { data, error } = await supabase
      .from("ad_reports")
      .select("*, reporter:reporter_id(id, full_name)")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[ads] fetchAdReports failed:", error.message);
      set({ isLoadingReports: false });
      return;
    }
    set({ adReports: (data ?? []).map(mapAdReportRow), isLoadingReports: false });
  },

  getAd: (id) => get().ads.find((a) => a.id === id),
  getComments: (adId) => get().commentsByAd[adId] ?? [],
  getReportsForAd: (adId) => get().adReports.filter((r) => r.adId === adId),

  submitAd: async (data) => {
    const userId = await requireUserId();
    const plan = get().plans.find((p) => p.id === data.planId) ?? get().plans[0];

    // Real pending payment now, not a hardcoded "already paid" — the ad
    // isn't reviewable (see approveAd's payment check, and the DB-level
    // guard in 20260822000000_payments_table.sql) until a superadmin
    // marks this payments row paid.
    const payment = await usePaymentsStore.getState().createPayment("AD", plan.price, plan.currency);
    if (!payment) {
      console.warn("[ads] submitAd failed: couldn't create payment record");
      return undefined;
    }

    const { data: row, error } = await supabase
      .from("ads")
      .insert({
        advertiser_id: userId,
        title: data.title.trim(),
        text: data.text.trim(),
        link_url: data.linkUrl?.trim() || null,
        category: data.category,
        fda_approval_id: isFdaRequired(data.category) ? data.fdaApprovalId?.trim() || null : null,
        status: "pending",
        plan_id: plan.id,
        plan_name: plan.name,
        plan_duration_days: plan.durationDays,
        plan_price: plan.price,
        plan_currency: plan.currency,
        payment_id: payment.id,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[ads] submitAd failed:", error?.message);
      return undefined;
    }

    if (data.media && data.media.length > 0) {
      const { error: mediaError } = await supabase.from("ad_media").insert(
        data.media.map((m) => ({
          ad_id: row.id,
          type: m.type,
          uri: m.uri,
          size_bytes: m.sizeBytes,
          width: m.width ?? null,
          height: m.height ?? null,
          duration_ms: m.durationMs ?? null,
        })),
      );
      if (mediaError) console.warn("[ads] submitAd (media) failed:", mediaError.message);
    }

    await get().fetchAd(row.id);
    return row.id;
  },

  updateAd: async (id, data) => {
    const { error } = await supabase
      .from("ads")
      .update({
        title: data.title.trim(),
        text: data.text.trim(),
        link_url: data.linkUrl?.trim() || null,
        category: data.category,
        fda_approval_id: isFdaRequired(data.category) ? data.fdaApprovalId?.trim() || null : null,
        // Any edit counts as a resubmission — back to the review queue.
        status: "pending",
        status_reason: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq("id", id);
    if (error) {
      console.warn("[ads] updateAd failed:", error.message);
      return false;
    }

    if (data.media) {
      await supabase.from("ad_media").delete().eq("ad_id", id);
      if (data.media.length > 0) {
        await supabase.from("ad_media").insert(
          data.media.map((m) => ({
            ad_id: id,
            type: m.type,
            uri: m.uri,
            size_bytes: m.sizeBytes,
            width: m.width ?? null,
            height: m.height ?? null,
            duration_ms: m.durationMs ?? null,
          })),
        );
      }
    }

    await get().fetchAd(id);
    return true;
  },

  deleteAd: async (id) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) {
      console.warn("[ads] deleteAd failed:", error.message);
      return false;
    }
    set((state) => {
      const { [id]: _removed, ...rest } = state.commentsByAd;
      return { ads: state.ads.filter((a) => a.id !== id), commentsByAd: rest };
    });
    return true;
  },

  approveAd: async (id) => {
    const reviewerId = await requireUserId();
    const ad = get().ads.find((a) => a.id === id);
    if (!ad) return false;
    // The database's RLS update policy is the real enforcement (see
    // 20260822000000_payments_table.sql) — this check exists to fail
    // fast with a clear message rather than let the admin hit a raw
    // policy-violation error from Supabase.
    if (ad.payment.status !== "paid") {
      console.warn("[ads] approveAd blocked: payment is not marked paid yet");
      return false;
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ad.plan.durationDays * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("ads")
      .update({
        status: "approved",
        status_reason: null,
        reviewed_by: reviewerId,
        reviewed_at: now.toISOString(),
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[ads] approveAd failed:", error.message);
      return false;
    }
    await get().fetchAd(id);

    if (ad.advertiser.id === reviewerId) return true; // shouldn't happen, but avoid self-notifying either way
    useNotificationStore.getState().addNotification(
      "ads_status_decision",
      "Your ad was approved",
      `"${ad.title}" is now live.`,
      { pathname: "/ads/ad-details", params: { id: ad.id } },
    );
    return true;
  },

  rejectAd: async (id, reason) => {
    const reviewerId = await requireUserId();
    const ad = get().ads.find((a) => a.id === id);
    if (!ad) return;

    // Payment status is deliberately left untouched here — the old code
    // auto-marked it "refunded" on rejection, but the new payments
    // system has no refund concept (see the migration's notes on this).
    // If the payment was still pending, it stays pending — a superadmin
    // can cancel it separately from the payments review screen if the
    // ad won't be resubmitted. If it was already paid, that's a real
    // mobile money transaction outside this app's scope to reverse.
    const { error } = await supabase
      .from("ads")
      .update({
        status: "rejected",
        status_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[ads] rejectAd failed:", error.message);
      return;
    }
    await get().fetchAd(id);

    useNotificationStore.getState().addNotification(
      "ads_status_decision",
      "Your ad was rejected",
      `"${ad.title}" was rejected: ${reason}`,
      { pathname: "/ads/ad-details", params: { id: ad.id } },
    );
  },

  suspendAd: async (id, reason) => {
    const reviewerId = await requireUserId();
    const { error } = await supabase
      .from("ads")
      .update({ status: "suspended", status_reason: reason, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[ads] suspendAd failed:", error.message);
      return;
    }
    await get().resolveOpenReportsForAd(id, reviewerId);
    await get().fetchAd(id);
  },

  reinstateAd: async (id) => {
    const reviewerId = await requireUserId();
    const { error } = await supabase
      .from("ads")
      .update({ status: "approved", status_reason: null, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[ads] reinstateAd failed:", error.message);
      return false;
    }
    await get().fetchAd(id);
    return true;
  },

  banAd: async (id, reason) => {
    const reviewerId = await requireUserId();
    const { error } = await supabase
      .from("ads")
      .update({ status: "banned", status_reason: reason, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[ads] banAd failed:", error.message);
      return;
    }
    await get().resolveOpenReportsForAd(id, reviewerId);
    await get().fetchAd(id);
  },

  resolveOpenReportsForAd: async (adId, resolverId) => {
    const { error } = await supabase
      .from("ad_reports")
      .update({ status: "dismissed", resolved_by: resolverId, resolved_at: new Date().toISOString() })
      .eq("ad_id", adId)
      .eq("status", "open");
    if (error) {
      console.warn("[ads] resolveOpenReportsForAd failed:", error.message);
      return;
    }
    set((state) => ({
      adReports: state.adReports.map((r) =>
        r.adId === adId && r.status === "open"
          ? { ...r, status: "dismissed" as const, resolvedBy: resolverId, resolvedAt: new Date() }
          : r,
      ),
    }));
  },

  dismissReport: async (reportId) => {
    const resolverId = await requireUserId();
    const { error } = await supabase
      .from("ad_reports")
      .update({ status: "dismissed", resolved_by: resolverId, resolved_at: new Date().toISOString() })
      .eq("id", reportId);
    if (error) {
      console.warn("[ads] dismissReport failed:", error.message);
      return false;
    }
    set((state) => ({
      adReports: state.adReports.map((r) =>
        r.id === reportId
          ? { ...r, status: "dismissed" as const, resolvedBy: resolverId, resolvedAt: new Date() }
          : r,
      ),
    }));
    return true;
  },

  reportAd: async (adId, reason) => {
    const reporterId = await requireUserId();
    const { error } = await supabase
      .from("ad_reports")
      .insert({ ad_id: adId, reporter_id: reporterId, reason: reason.trim() });
    if (error) {
      console.warn("[ads] reportAd failed:", error.message);
      return false;
    }
    return true;
  },

  // Owner self-serve lifecycle — all three call the same
  // set_own_ad_lifecycle RPC, which validates the specific transition
  // server-side (see 20260901000001_ad_moderation_and_reports.sql) and
  // rejects anything else, including transitions a raw client update
  // would otherwise be blocked from by RLS anyway.
  pauseAd: async (id) => {
    const { error } = await supabase.rpc("set_own_ad_lifecycle", { p_ad_id: id, p_new_status: "inactive" });
    if (error) {
      console.warn("[ads] pauseAd failed:", error.message);
      return false;
    }
    await get().fetchAd(id);
    return true;
  },

  resumeAd: async (id) => {
    const { error } = await supabase.rpc("set_own_ad_lifecycle", { p_ad_id: id, p_new_status: "approved" });
    if (error) {
      console.warn("[ads] resumeAd failed:", error.message);
      return false;
    }
    await get().fetchAd(id);
    return true;
  },

  closeAd: async (id) => {
    const { error } = await supabase.rpc("set_own_ad_lifecycle", { p_ad_id: id, p_new_status: "closed" });
    if (error) {
      console.warn("[ads] closeAd failed:", error.message);
      return false;
    }
    await get().fetchAd(id);
    return true;
  },

  toggleReaction: async (adId, reaction) => {
    const userId = await requireUserId();
    const previous = get().myReactions[adId] ?? null;
    const isSame = previous === reaction;

    if (isSame) {
      await supabase.from("ad_reactions").delete().eq("ad_id", adId).eq("user_id", userId);
    } else {
      await supabase.from("ad_reactions").upsert({ ad_id: adId, user_id: userId, reaction });
    }

    // Recount from the actual rows rather than incrementing/decrementing a
    // locally-read value — safe against concurrent reactions from other
    // users, which a delta-based update on stale client state wouldn't be.
    const { count: likeCount } = await supabase
      .from("ad_reactions")
      .select("*", { count: "exact", head: true })
      .eq("ad_id", adId)
      .eq("reaction", "like");
    const { count: dislikeCount } = await supabase
      .from("ad_reactions")
      .select("*", { count: "exact", head: true })
      .eq("ad_id", adId)
      .eq("reaction", "dislike");

    await supabase
      .from("ads")
      .update({ like_count: likeCount ?? 0, dislike_count: dislikeCount ?? 0 })
      .eq("id", adId);

    set((state) => ({
      myReactions: isSame
        ? Object.fromEntries(Object.entries(state.myReactions).filter(([k]) => k !== adId))
        : { ...state.myReactions, [adId]: reaction },
      ads: state.ads.map((a) =>
        a.id === adId
          ? { ...a, userReaction: isSame ? null : reaction, likeCount: likeCount ?? 0, dislikeCount: dislikeCount ?? 0 }
          : a,
      ),
    }));
  },

  addComment: async (adId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userId = await requireUserId();

    const { data: row, error } = await supabase
      .from("ad_comments")
      .insert({ ad_id: adId, author_id: userId, text: trimmed })
      .select("*, profiles:author_id(id, full_name, avatar_color)")
      .single();
    if (error || !row) {
      console.warn("[ads] addComment failed:", error?.message);
      return;
    }

    const comment = mapCommentRow(row);
    await supabase
      .from("ads")
      .update({ comment_count: (get().ads.find((a) => a.id === adId)?.commentCount ?? 0) + 1 })
      .eq("id", adId);

    set((state) => ({
      commentsByAd: { ...state.commentsByAd, [adId]: [...(state.commentsByAd[adId] ?? []), comment] },
      ads: state.ads.map((a) => (a.id === adId ? { ...a, commentCount: a.commentCount + 1 } : a)),
    }));

    const ad = get().ads.find((a) => a.id === adId);
    if (ad && ad.advertiser.id !== userId) {
      useNotificationStore.getState().addNotification(
        "ads_new_comment",
        "New comment on your ad",
        `${comment.author.name} commented on "${ad.title}".`,
        { pathname: "/ads/ad-details", params: { id: ad.id } },
      );
    }
  },
}));
