import { SupportingDocument } from "@/features/profile-updates/types/profile-update.types";
import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";

// Narrower than ProfileUpdateEntityType by construction — a person
// can't be "owned", so this flow only ever covers the other two. Kept
// as a subset of the same type (not a separate enum) so entity_type
// values pass between this feature and profile-updates' shared
// concepts (e.g. LOCKED_FIELDS lookups) without a cast.
export type OwnershipTransferEntityType = Extract<ProfileUpdateEntityType, "facility" | "organization">;

export type OwnershipTransferStatus = "pending" | "approved" | "rejected";
export type OwnershipTransferEventType = "submitted" | "approved" | "rejected";

export interface OwnershipTransferRequest {
  id: string;
  entityType: OwnershipTransferEntityType;
  entityId: string;
  requestedBy: string;
  requestedByName?: string;
  reason: string;
  supportingDocuments: SupportingDocument[];
  status: OwnershipTransferStatus;
  adminComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface OwnershipTransferEvent {
  id: string;
  requestId: string;
  eventType: OwnershipTransferEventType;
  actorId: string;
  actorName?: string;
  comment?: string;
  createdAt: Date;
}
