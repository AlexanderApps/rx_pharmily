export type ProfileUpdateEntityType = "user" | "facility" | "organization";
export type ProfileUpdateRequestStatus = "pending" | "approved" | "rejected" | "merged";
export type ProfileUpdateEventType = "submitted" | "approved" | "rejected" | "merged";

export interface SupportingDocument {
  name: string;
  uri: string;
}

export interface ProfileUpdateRequest {
  id: string;
  entityType: ProfileUpdateEntityType;
  entityId: string;
  requestedBy: string;
  // { fieldKey: newValue } — only the fields actually being changed.
  changes: Record<string, string | null>;
  // { fieldKey: oldValue }, captured at submission — a real diff for
  // the reviewer without reconstructing "what was this before" from a
  // row that may have moved on since.
  previousValues: Record<string, string | null>;
  supportingDocuments: SupportingDocument[];
  status: ProfileUpdateRequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  mergedAt?: Date;
  createdAt: Date;
}

export interface ProfileUpdateRequestFormData {
  entityType: ProfileUpdateEntityType;
  entityId: string;
  changes: Record<string, string | null>;
  previousValues: Record<string, string | null>;
  supportingDocuments: SupportingDocument[];
}

// The audit trail — one row per state transition, kept separate from
// ProfileUpdateRequest's own (mutable) status columns. See the
// migration's own comment for why a request row alone can't serve as
// its own audit trail.
export interface ProfileUpdateAuditEvent {
  id: string;
  requestId: string;
  eventType: ProfileUpdateEventType;
  actorId: string;
  actorName: string;
  comment?: string;
  createdAt: Date;
}

// Drives both the owner-facing request form and the admin merge
// screen — one definition per field, not duplicated across both UIs.
export interface LockedFieldDef {
  key: string;
  label: string;
  kind: "text" | "picker" | "region";
  options?: string[]; // for kind: "picker" only — "region" pulls live from reference data instead
  keyboardType?: "email-address" | "phone-pad";
}

const USER_ROLES = ["Pharmacist", "Pharmacy Technician", "Facility Admin", "Procurement Officer", "Other"];
const USER_PROFESSIONS = ["Pharmacist", "Technician", "MCA", "Other"];
const USER_TITLES = ["Mr.", "Mrs.", "Ms.", "Dr. (PharmD)", "Dr. (PhD)", "Dr. (MD)", "Prof.", "Other"];
const FACILITY_TYPES = ["Retail Pharmacy", "Hospital", "Wholesale Distributor", "Diagnostic Lab", "Clinic", "Other"];
const ORGANIZATION_TYPES = ["Pharmacy Chain", "Healthcare Group", "Distributor Network", "Other"];

// The exact field sets requested: user (Fullname, Phone, Profession,
// Title, License number, Role), facility (Name, Type, Location, region,
// address, phone, email, Registration number), organization (Name,
// Type, Headquarters Location, region, address, phone, email).
// Deliberately excludes latitude/longitude ("current location") on
// facility/organization — per the request, GPS capture stays freely
// self-editable, only these listed fields go through the request flow.
export const LOCKED_FIELDS: Record<ProfileUpdateEntityType, LockedFieldDef[]> = {
  user: [
    { key: "fullName", label: "Full Name", kind: "text" },
    { key: "phone", label: "Phone", kind: "text", keyboardType: "phone-pad" },
    { key: "profession", label: "Profession", kind: "picker", options: USER_PROFESSIONS },
    { key: "title", label: "Title", kind: "picker", options: USER_TITLES },
    { key: "licenseNumber", label: "License Number", kind: "text" },
    { key: "role", label: "Role", kind: "picker", options: USER_ROLES },
  ],
  facility: [
    { key: "name", label: "Name", kind: "text" },
    { key: "type", label: "Type", kind: "picker", options: FACILITY_TYPES },
    { key: "location", label: "Ghana Post GPS", kind: "text" },
    { key: "region", label: "Region", kind: "region" },
    { key: "address", label: "Address", kind: "text" },
    { key: "phone", label: "Phone", kind: "text", keyboardType: "phone-pad" },
    { key: "email", label: "Email", kind: "text", keyboardType: "email-address" },
    { key: "registrationNumber", label: "Registration Number", kind: "text" },
  ],
  organization: [
    { key: "name", label: "Name", kind: "text" },
    { key: "type", label: "Type", kind: "picker", options: ORGANIZATION_TYPES },
    { key: "location", label: "Ghana Post GPS (Headquarters)", kind: "text" },
    { key: "region", label: "Region", kind: "region" },
    { key: "address", label: "Address", kind: "text" },
    { key: "phone", label: "Phone", kind: "text", keyboardType: "phone-pad" },
    { key: "email", label: "Email", kind: "text", keyboardType: "email-address" },
  ],
};
