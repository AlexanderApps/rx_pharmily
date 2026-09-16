// 'closed' still exists in the DB enum (Postgres can't cheaply drop
// enum values) but nothing sets it anymore — the migration that added
// the statuses below also migrated every existing 'closed' row away
// from it, so no row will ever have this value going forward. Left out
// of this type for that reason, not by oversight.
export type RxLinkStatus = "pending" | "acknowledged" | "responded" | "rejected" | "resolved";
export type RxLinkImageType = "prescription" | "medication";

export interface RxLinkImage {
  id: string;
  requestId: string;
  // Storage path within the private rxlink-images bucket — not a
  // display-ready URL. Resolve via getRxLinkImageSignedUrl() /
  // getRxLinkImageSignedUrls() (lib/rxlink-image-storage.ts) before
  // rendering.
  storagePath: string;
  imageType: RxLinkImageType;
  createdAt: Date;
}

export interface RxLinkResponse {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  // Derived from whether senderId is the request's own creator, not a
  // stored column — a message is "from admin" precisely when it isn't
  // from the requester, on their own request.
  isFromAdmin: boolean;
  message: string;
  createdAt: Date;
  // Both always undefined for now (text-only messages) — present so a
  // future attachment feature (images, location) can populate them
  // without another type change. attachmentData's shape depends on
  // attachmentType and isn't modeled further until that feature exists.
  attachmentType?: string;
  attachmentData?: Record<string, unknown>;
}

export interface RxLinkRequest {
  id: string;
  code: string;
  createdBy: string;
  createdByName: string;
  comment?: string;
  status: RxLinkStatus;
  createdAt: Date;
  respondedBy?: string;
  respondedByName?: string;
  respondedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedByName?: string;
  rejectionReason?: string;
  requesterClosedAt?: Date;
  adminClosedAt?: Date;
  adminClosedByName?: string;
}

export interface RxLinkImageDraft {
  // A local file URI, staged before upload.
  localUri: string;
  fileName: string;
  imageType: RxLinkImageType;
}

export interface RxLinkFormData {
  comment: string;
  images: RxLinkImageDraft[];
}
