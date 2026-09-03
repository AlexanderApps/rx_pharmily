export type RxLinkStatus = "pending" | "responded" | "closed";
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
  responderId: string;
  responderName: string;
  message: string;
  createdAt: Date;
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
