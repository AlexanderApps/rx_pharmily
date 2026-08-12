// Core identity layer: User, Facility, and Organization profiles, each with
// their own KYC verification record. Everywhere else in the app has so far
// referred to "facilities" and "the current user" as plain strings — this
// is the actual data model behind those references.
//
// Also lays groundwork for two features flagged for later: cover letter
// templates (User, for job applications) and price templates (Facility,
// for RFQ responses) — both included here in a genuinely usable form
// rather than as empty scaffolding.

// ─── KYC ─────────────────────────────────────────────────────────────────

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export type KycDocumentType =
  | "Government ID"
  | "Pharmacist License"
  | "Business Registration"
  | "Facility Permit"
  | "Other";

export interface KycDocument {
  id: string;
  type: KycDocumentType;
  imageUri?: string;
  fileName: string;
  uploadedAt: Date;
}

export interface KycRecord {
  status: KycStatus;
  documents: KycDocument[];
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type KycEntityType = "user" | "facility" | "organization";

// ─── User ────────────────────────────────────────────────────────────────

export type UserRole =
  | "Pharmacist"
  | "Pharmacy Technician"
  | "Facility Admin"
  | "Procurement Officer"
  | "Other";

// Controls what shows on the public profile card anyone sees when they tap
// this entity's avatar. Users default to everything hidden except name/
// avatar/role — email and phone are opt-in. Facilities and organizations
// default to showing this info, since it's business contact info rather
// than a person's personal details, but it stays customizable either way.
export interface PublicProfileVisibility {
  showEmail: boolean;
  showPhone: boolean;
}

export const DEFAULT_USER_VISIBILITY: PublicProfileVisibility = {
  showEmail: false,
  showPhone: false,
};

export const DEFAULT_ENTITY_VISIBILITY: PublicProfileVisibility = {
  showEmail: true,
  showPhone: true,
};

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  licenseNumber?: string;
  bio?: string;
  avatarColor: string;
  kyc: KycRecord;
  createdAt: Date;
  publicVisibility: PublicProfileVisibility;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export interface UserProfileFormData {
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  licenseNumber?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Facility ────────────────────────────────────────────────────────────

export type FacilityType =
  | "Retail Pharmacy"
  | "Hospital"
  | "Wholesale Distributor"
  | "Diagnostic Lab"
  | "Clinic"
  | "Other";

export interface FacilityProfile {
  id: string;
  name: string;
  type: FacilityType;
  location: string;
  region: string;
  address?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  organizationId?: string;
  adminUserId: string;
  kyc: KycRecord;
  publicVisibility: PublicProfileVisibility;
  createdAt: Date;
  latitude?: number;
  longitude?: number;
}

export interface FacilityProfileFormData {
  name: string;
  type: FacilityType;
  location: string;
  region: string;
  address?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  latitude?: number;
  longitude?: number;
}

// A user can work for several facilities; a facility has several members.
// Membership is only ever created once the facility itself is verified —
// enforced in the store, not just the UI — since shared resources (price
// templates, the facility chat) hinge on membership being trustworthy.
export type FacilityMemberRole = "Owner" | "Member";

export interface FacilityMembership {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatarColor: string;
  role: FacilityMemberRole;
  joinedAt: Date;
}

// ─── Creation & membership requests ────────────────────────────────────
// Facilities and organizations are no longer self-service — a verified
// user submits a creation request, an admin approves it (which creates
// the real facility/organization), and only then does the existing KYC
// flow verify it. Once verified, joining or linking to an org goes
// through the same request/approve pattern.

export type RequestStatus = "pending" | "approved" | "rejected";

export interface FacilityCreationRequest {
  id: string;
  requestedBy: string;
  name: string;
  type: FacilityType;
  location: string;
  region: string;
  address?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  status: RequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  latitude?: number;
  longitude?: number;
  resultingFacilityId?: string;
}

export interface FacilityCreationRequestFormData {
  name: string;
  type: FacilityType;
  location: string;
  region: string;
  address?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrganizationCreationRequest {
  id: string;
  requestedBy: string;
  name: string;
  type: OrganizationType;
  registrationNumber?: string;
  headquartersLocation?: string;
  email?: string;
  phone?: string;
  status: RequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  resultingOrganizationId?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrganizationCreationRequestFormData {
  name: string;
  type: OrganizationType;
  registrationNumber?: string;
  headquartersLocation?: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface FacilityMembershipRequest {
  id: string;
  facilityId: string;
  requestedBy: string;
  requesterName: string;
  requesterEmail: string;
  requesterAvatarColor: string;
  requesterKycStatus: KycStatus;
  status: RequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface FacilityOrganizationRequest {
  id: string;
  facilityId: string;
  facilityName: string;
  organizationId: string;
  organizationName: string;
  requestedBy: string;
  status: RequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

// ─── Organization ────────────────────────────────────────────────────────

export type OrganizationType =
  | "Pharmacy Chain"
  | "Healthcare Group"
  | "Distributor Network"
  | "Other";

export interface OrganizationProfile {
  id: string;
  name: string;
  type: OrganizationType;
  registrationNumber?: string;
  headquartersLocation?: string;
  email?: string;
  phone?: string;
  adminUserId: string;
  facilityIds: string[];
  kyc: KycRecord;
  createdAt: Date;
  publicVisibility: PublicProfileVisibility;
  latitude?: number;
  longitude?: number;
}

export interface OrganizationProfileFormData {
  name: string;
  type: OrganizationType;
  registrationNumber?: string;
  headquartersLocation?: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Cover letter templates (User) ─────────────────────────────────────
// Reusable text blurbs a user can attach when applying to an RxJobs
// listing, instead of writing a cover note from scratch every time.

export interface CoverLetterTemplate {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetterTemplateFormData {
  title: string;
  body: string;
}

// ─── Price templates (Facility) ─────────────────────────────────────────
// A CSV-uploaded price list a facility can reuse when responding to an
// RxRFQ, instead of re-keying rates every time. Visible to all members
// once uploaded (the facility chooses which template to draw from when
// quoting, but the template list itself isn't private).

export interface PriceTemplateItem {
  id: string;
  product: string;
  rate: number;
  unit?: string;
}

export interface PriceTemplate {
  id: string;
  facilityId: string;
  title: string;
  fileName: string;
  items: PriceTemplateItem[];
  uploadedAt: Date;
}
