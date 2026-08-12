import {
  UserData,
  MembershipChangeRequestType,
  MembershipChangeRequestStatus,
} from "@/models/user";

export type FacilityType =
  | "Retail Pharmacy"
  | "Wholesale Pharmacy"
  | "Hospital Pharmacy"
  | "Clinic"
  | "Hospital"
  | "Laboratory"
  | "Manufacturer"
  | "Distributor"
  | "Importer";

export type FacilityStatus =
  | "pending"
  | "underReview"
  | "verified"
  | "rejected"
  | "suspended";

export interface FacilityDataM {
  id: string;

  name: string;
  logo?: string;

  facilityType: FacilityType;

  region: string;
  district?: string;

  address?: string;
  location?: {
    lat: number;
    lng: number;
  };

  email?: string;
  phone?: string;

  licenseNumber?: string;

  status: FacilityStatus;

  isActive: boolean;

  verifiedAt?: Date;
  verifiedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityInfo {
  id: string;
  name: string;
  facilityType: FacilityType;

  region: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export type FacilityMembershipRole =
  | "Owner"
  | "Administrator"
  | "Manager"
  | "Procurement Officer"
  | "Sales Officer"
  | "Viewer";

export interface FacilityMembership {
  id: string;

  userId: string;

  facilityId: string;

  role: FacilityMembershipRole;

  isPrimary: boolean;

  isActive: boolean;

  createdAt: Date;
}

export type FacilityKycStatus =
  | "pending"
  | "underReview"
  | "verified"
  | "rejected";

export interface FacilityKycData {
  id: string;

  facilityId: string;

  status: FacilityKycStatus;

  submittedAt?: Date;

  verifiedAt?: Date;

  verifiedBy?: string;

  rejectionReason?: string;

  notes?: string;
}

export interface FacilityMembershipChangeRequest {
  id: string;

  userId: string;

  facilityId: string;

  requestType: MembershipChangeRequestType;

  status: MembershipChangeRequestStatus;

  submittedAt: Date;

  reviewedAt?: Date;

  reviewedBy?: string;

  comment?: string;
}

export interface UserFacilityContext {
  user: UserData;

  // facilities: FacilityData[];

  memberships: FacilityMembership[];
}

export interface EligibleFacility {
  facilityId: string;

  facilityName: string;

  facilityType: FacilityType;

  region: string;

  role: FacilityMembershipRole;
}
