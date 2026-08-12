export type RfqsFilter = "regions" | "categories" | "facilityTypes";

export type FilterType = "region" | "category" | "facilityType";

export type RxRfqStatusType =
  | "draft"
  | "published"
  | "closed"
  | "awarded"
  | "cancelled"
  | "expired";

export type RxRfqVisibilityScope = "All" | "Restricted";

export type RxRfqVisibilityRuleType =
  | "Region"
  | "Facility Type"
  | "Specific Facility";

export interface RxRfqVisibilityRule {
  id?: string;
  ruleType: RxRfqVisibilityRuleType;
  region?: string;
  facilityType?: string;
  facility?: string;
}

export interface RxRfqItem {
  id: string;
  productId: string;
  quantity: number;
  uom: string;
  allowAlternatives: boolean;
  comment?: string;
}

export interface RxRfqsFormData {
  id: string;
  facilityId: string;
  description: string;
  categories: string[];
  termsOfService: string;
  incoterms: string;
  currency: string;
  submissionDeadline: Date;
  minShelfLifeMonths: number;
  strictMinShelfLife: boolean;
  deliveryDate: Date;
  comment: string;
  isActive: boolean;
  status: RxRfqStatusType;
  items: RxRfqItem[];
  visibilityScope: RxRfqVisibilityScope;
  visibilityRules: RxRfqVisibilityRule[];
}

export interface RxRfqsData extends RxRfqsFormData {
  id: string;
  code: string;
  publishedAt: Date;
  createdAt: Date;
  createdBy: string;
  isBanned: boolean;
  bannedAt: Date;
  productCount: number;
  responseCount: number;
  awardedVendorId?: string;
  awardDate?: Date;
  justificationNotes?: string;
}

// A read-optimized view for list/card rendering — facilityName/Location
// here are resolved (joined) from facilityId at conversion time, not
// stored as the source of truth. See convertMarketPlaceToCardData.
export interface RxRfqCardData {
  id: string;
  code: string;
  facilityName: string;
  facilityLocation: string;
  status: RxRfqStatusType;
  publishedAt: Date;
  submissionDeadline: Date;
  productCount: number;
  responseCount: number;
}

export interface RxRfqMarketPlaceData extends Omit<
  RxRfqsData,
  "isBanned" | "bannedAt" | "justificationNotes"
> {}

export type RxRfqResponseStatusType =
  | "draft"
  | "submitted"
  | "underReview"
  | "accepted"
  | "rejected";

export type RxRfqAdditionalCostType =
  | "delivery"
  | "insurance"
  | "handling"
  | "tax"
  | "other";

export interface RxRfqAdditionalCostItem {
  id: string;
  costType: RxRfqAdditionalCostType;
  description: string;
  amount: number;
  isRequired: boolean;
}

export interface RxRfqResponseItem {
  id: string;
  rfqItemId: string;
  productId: string;
  quantity: number;
  rate: number;
  amount: number;
  offeredAlternative: boolean;
  alternativeProductDetails?: string;
  comment?: string;
}

export interface RxRfqResponseFormData {
  id: string;
  rfqId: string;
  vendorFacility: string;
  status: RxRfqResponseStatusType;
  quoteValidUntil: Date;
  estimatedDeliveryDate: Date;
  incoterms: string;
  currency: string;
  paymentTerms: string;
  vendorComment?: string;
  items: RxRfqResponseItem[];

  additionalCosts: RxRfqAdditionalCostItem[];
}

export interface RxRfqResponseData extends RxRfqResponseFormData {
  id: string;
  createdAt: Date;
  submittedAt?: Date;
  createdBy: string;
  totalItemsAmount: number;
  totalRequiredCosts: number;
  totalOptionalCosts: number;
  grandTotal: number;
}

export interface RxRfqResponseCardData {
  id: string;
  rxRfqRequestId: string;
  code: string;
  vendorFacility: string;
  estimatedDeliveryDate: Date;
  submittedAt?: Date;
  totalItemsAmount: number;
  totalRequiredCosts: number;
  totalOptionalCosts: number;
  grandTotal: number;
}
