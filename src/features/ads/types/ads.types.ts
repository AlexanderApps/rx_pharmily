// RxAds is the formal advertising surface — distinct from Posts. Ads must be
// paid for and approved by an admin before they go live, can be
// suspended/banned after the fact, and (for medication/medical-device
// categories) require an FDA approval identifier. Kept fully self-contained
// from Posts/RxRFQs/etc — no cross-feature imports.

export type AdCategory =
  | "medication"
  | "medical-device"
  | "service"
  | "equipment"
  | "other";

// Categories where advertising a specific regulated product requires proof
// of FDA registration before it can be submitted for review.
export const FDA_ID_REQUIRED_CATEGORIES: AdCategory[] = [
  "medication",
  "medical-device",
];

export type AdStatus =
  | "pending" // submitted + paid, awaiting admin review
  | "approved" // live
  | "rejected" // admin declined at review
  | "suspended" // was live, temporarily paused by admin (moderation)
  | "banned" // permanently removed by admin (moderation)
  | "inactive" // was live, temporarily paused by its own owner
  | "closed"; // permanently closed by its own owner

export type AdReportStatus = "open" | "dismissed";

export interface AdReport {
  id: string;
  adId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: AdReportStatus;
  createdAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export type AdMediaType = "image" | "video";

// Same cap as Posts, defined independently so the two features don't share
// a constant across a feature boundary.
export const MAX_AD_MEDIA_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface AdMedia {
  id: string;
  type: AdMediaType;
  uri: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface AdAuthor {
  id: string;
  name: string;
  role?: string;
  avatarColor: string;
}

export interface AdPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  currency: string;
  description: string;
  featured?: boolean;
}

// Mirrors features/payments/types/payments.types.ts's Payment shape
// exactly, kept as a separate local type rather than importing it — this
// file is deliberately self-contained (see header comment above), and a
// real Payment object is structurally assignable here without an import
// regardless.
export interface AdPayment {
  id: string;
  reference: string;
  status: "pending" | "paid" | "cancelled";
  amountDue: number;
  amountPaid?: number;
  currency: string;
  initiatedBy: string;
  reviewedBy?: string;
  paidAt?: Date;
  createdAt: Date;
}

export type ReactionType = "like" | "dislike";

export interface Ad {
  id: string;
  advertiser: AdAuthor;
  title: string;
  text: string;
  media?: AdMedia[];
  linkUrl?: string;
  category: AdCategory;
  fdaApprovalId?: string;

  status: AdStatus;
  statusReason?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;

  plan: AdPlan;
  payment: AdPayment;

  createdAt: Date;
  startsAt?: Date;
  expiresAt?: Date;

  likeCount: number;
  dislikeCount: number;
  userReaction: ReactionType | null;
  commentCount: number;
}

export interface AdComment {
  id: string;
  adId: string;
  author: AdAuthor;
  text: string;
  createdAt: Date;
}

export interface AdFormData {
  title: string;
  text: string;
  media?: AdMedia[];
  linkUrl?: string;
  category: AdCategory;
  fdaApprovalId?: string;
  planId: string;
}
