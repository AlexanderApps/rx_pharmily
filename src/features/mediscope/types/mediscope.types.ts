// MediScope is a single-product availability search — "does anyone have
// this?" — distinct from RxRFQs' multi-line, structured procurement flow.
// It shares RxRFQs' visibility and status-lifecycle concepts, but the
// product being searched for is just a string (with an optional photo),
// and a response is a simple availability/facility/cost/comment record
// rather than a full line-item quote.

export type MediscopeStatus =
  | "draft"
  | "published"
  | "fulfilled"
  | "closed"
  | "cancelled"
  | "expired";

export type MediscopeVisibilityScope = "All" | "Restricted";

export type MediscopeVisibilityRuleType =
  | "Region"
  | "Facility Type"
  | "Specific Facility";

export interface MediscopeVisibilityRule {
  id: string;
  ruleType: MediscopeVisibilityRuleType;
  region?: string;
  facilityType?: string;
  facility?: string;
}

export interface MediscopeRequest {
  id: string;
  code: string;
  facility: string;
  facilityName: string;
  facilityLocation: string;
  // The product being searched for — a plain string, not a structured item.
  product: string;
  // True when the requester typed something that wasn't in the product
  // catalog rather than picking an existing entry — useful downstream for
  // spotting gaps in the catalog (frequently custom-typed products are
  // good formulary-request candidates).
  isCustomProduct: boolean;
  comment?: string;
  imageUrl?: string;
  status: MediscopeStatus;
  isActive: boolean;
  visibilityScope: MediscopeVisibilityScope;
  visibilityRules: MediscopeVisibilityRule[];
  submissionDeadline?: Date;
  createdAt: Date;
  createdBy: string;
  publishedAt?: Date;
  responseCount: number;
  fulfilledResponseId?: string;
}

export interface MediscopeFormData {
  facility: string;
  product: string;
  isCustomProduct: boolean;
  comment?: string;
  imageUrl?: string;
  status: MediscopeStatus;
  isActive: boolean;
  visibilityScope: MediscopeVisibilityScope;
  visibilityRules: MediscopeVisibilityRule[];
  submissionDeadline?: Date;
}

export interface MediscopeCardData {
  id: string;
  code: string;
  product: string;
  facilityName: string;
  facilityLocation: string;
  status: MediscopeStatus;
  imageUrl?: string;
  createdAt: Date;
  submissionDeadline?: Date;
  responseCount: number;
  isOwner: boolean;
}

export type MediscopeAvailability = "full" | "partial";

// Deliberately simple compared to an RxRFQ response: no line items, no
// additional-cost breakdown — just what was asked for (availability,
// where, cost, and an optional note).
export interface MediscopeResponse {
  id: string;
  requestId: string;
  vendorFacility: string;
  availability: MediscopeAvailability;
  facilityWhereAvailable: string;
  cost: number;
  currency: string;
  comment?: string;
  createdAt: Date;
  createdBy: string;
}

export interface MediscopeResponseFormData {
  requestId: string;
  vendorFacility: string;
  availability: MediscopeAvailability;
  facilityWhereAvailable: string;
  cost: number;
  currency: string;
  comment?: string;
}
