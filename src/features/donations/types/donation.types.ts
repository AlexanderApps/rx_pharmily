export type DonationStatus = "opened" | "hidden" | "closed";

export type DonationVisibilityScope = "All" | "Restricted";

export type DonationVisibilityRuleType =
  | "Region"
  | "Facility Type"
  | "Specific Facility";

export interface DonationVisibilityRule {
  id: string;
  ruleType: DonationVisibilityRuleType;
  region?: string;
  facilityType?: string;
  facility?: string;
}

// A single donated line item within a donation posting. `status` is a
// verified/needs-review flag (set by whoever logs the item), separate from
// `isActive` which controls whether the item is still available to claim.
export interface DonationItem {
  id: string;
  product: string;
  quantity: number;
  batch?: string;
  expiryDate: Date;
  status: boolean;
  isActive: boolean;
  // Whether `product` was typed as a one-off entry or matched an
  // existing catalog product via the ProductComboBox.
  isCustomProduct: boolean;
}

// The full donation posting as stored/edited.
export interface Donation {
  id: string;
  code: string;
  facility: string;
  facilityName: string;
  facilityLocation: string;
  categories: string[];
  termsOfService: string;
  comment: string;
  isActive: boolean;
  status: DonationStatus;
  visibilityScope: DonationVisibilityScope;
  visibilityRules: DonationVisibilityRule[];
  donatedItems: DonationItem[];
  createdAt: Date;
  createdBy: string;
  responseCount: number;
}

// Shape used by the add/edit form — everything except the server-assigned
// identity fields (id, code, facilityName/Location, createdAt, createdBy,
// responseCount).
export interface DonationFormData {
  facility: string;
  categories: string[];
  termsOfService: string;
  comment: string;
  isActive: boolean;
  status: DonationStatus;
  visibilityScope: DonationVisibilityScope;
  visibilityRules: DonationVisibilityRule[];
  donatedItems: DonationItem[];
}

// Lightweight summary used by list/card views.
export interface DonationCardData {
  id: string;
  facilityName: string;
  location: string;
  createdAt: Date;
  itemCount: number;
  status: DonationStatus;
  isActive: boolean;
  responseCount: number;
  isOwner: boolean;
}

// ─── responses (claims) ────────────────────────────────────────────────
// Mirrors RxRFQ's line-item response pattern — a claimant picks which
// donated items they want and how much of each — but without pricing,
// since donations are given away rather than quoted on.

export type DonationResponseStatus = "pending" | "approved" | "rejected";

export interface DonationResponseItem {
  id: string;
  donationItemId: string;
  // Snapshot of the product name at claim time, so the claim still reads
  // sensibly even if the underlying donated item is edited later.
  product: string;
  requestedQuantity: number;
}

export interface DonationResponse {
  id: string;
  donationId: string;
  responderFacility: string;
  items: DonationResponseItem[];
  comment?: string;
  status: DonationResponseStatus;
  createdAt: Date;
  createdBy: string;
}

export interface DonationResponseFormData {
  donationId: string;
  responderFacility: string;
  items: DonationResponseItem[];
  comment?: string;
}
