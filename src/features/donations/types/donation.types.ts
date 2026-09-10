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
  uom?: string;
  batch?: string;
  expiryDate: Date;
  status: boolean;
  isActive: boolean;
  // Whether `product` was typed as a one-off entry or matched an
  // existing catalog product via the ProductComboBox.
  isCustomProduct: boolean;
}

// The actual "is this line item available for donation" answer —
// isActive alone is just the creator's manual toggle (also auto-set to
// false when a claim brings quantity to zero — see approveResponse in
// use-donation-data.ts), it says nothing about whether the item has
// since expired. A line item that's still marked active but is past
// its expiry date is not actually available, regardless of that flag.
export function isDonationItemAvailable(item: DonationItem): boolean {
  return item.isActive && new Date(item.expiryDate).getTime() >= Date.now();
}

// A color KEY, not a resolved color — theme colors only exist inside
// useTheme(), which this file has no access to (it's not a component).
// Every consumer resolves this against its own `colors` object
// (colors[tier.colorKey]), keeping this function pure and reusable
// across every screen that shows an expiry date, rather than each one
// re-deriving its own thresholds (which is exactly what had happened
// before this — several screens each had their own local, inconsistent
// version of "is this expiring soon").
export interface ExpiryTier {
  label: string;
  colorKey: "error" | "warning" | "info" | "textSecondary" | "success";
}

// The lower-level primitive both getExpiryTier and any summary count
// (e.g. donation-details.tsx's "N expiring soon" stat) need — kept
// separate from getExpiryTier itself since not every consumer wants the
// full label+color computation, just the raw day count to bucket by.
export function daysUntilExpiry(expiryDate: Date): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function getExpiryTier(expiryDate: Date): ExpiryTier {
  const daysLeft = daysUntilExpiry(expiryDate);

  if (daysLeft < 0) return { label: "Expired", colorKey: "error" };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, colorKey: "error" };
  if (daysLeft <= 90) return { label: `${Math.ceil(daysLeft / 7)}w left`, colorKey: "warning" };
  if (daysLeft <= 180) return { label: `${Math.ceil(daysLeft / 30)}mo left`, colorKey: "info" };
  if (daysLeft <= 365) return { label: `${Math.ceil(daysLeft / 30)}mo left`, colorKey: "textSecondary" };
  return { label: "1yr+ left", colorKey: "success" };
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
