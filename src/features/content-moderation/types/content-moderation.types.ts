export type ContentModerationType =
  | "rxrfq"
  | "rxrfq_response"
  | "mediscope_request"
  | "mediscope_response"
  | "job"
  | "job_application"
  | "donation"
  | "donation_response";

export interface ContentModerationAction {
  id: string;
  contentType: ContentModerationType;
  contentId: string;
  actionType: "removed" | "restored";
  reason?: string;
  actorId: string;
  actorName?: string;
  createdAt: Date;
}

// A normalized shape for the admin search screen — each content type
// has different underlying columns, this lets that screen render one
// consistent list regardless of which type is currently selected.
export interface ModerationSearchResult {
  id: string;
  contentType: ContentModerationType;
  // The short, human-facing code (rxrfqs.code, mediscope_requests.code)
  // when the content type has one — rxrfq_responses, mediscope_responses,
  // job_applications, and jobs itself don't, so this is undefined for
  // those and the id is what's actually searched/shown instead.
  code?: string;
  title: string;
  subtitle?: string;
  isRemoved: boolean;
  removedReason?: string;
  createdAt: Date;
}

// What every one of the 6 tables now carries, uniformly — see the
// migration's own comment for why this is a flat, orthogonal set of
// columns rather than folded into each table's own (differently
// shaped) status concept.
export interface ModerationFields {
  isRemoved: boolean;
  removedReason?: string;
  removedBy?: string;
  removedAt?: Date;
}
