export type UserStatus = "pending" | "verified" | "suspended";

export interface UserData {
  id: string;

  firstName: string;
  lastName: string;

  email: string;
  phone?: string;

  profilePhoto?: string;

  status: UserStatus;

  isActive: boolean;

  verifiedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type UserKycStatus =
  | "pending"
  | "underReview"
  | "verified"
  | "rejected";


  export interface UserKycData {
    id: string;
  
    userId: string;
  
    status: UserKycStatus;
  
    submittedAt?: Date;
  
    verifiedAt?: Date;
  
    verifiedBy?: string;
  
    rejectionReason?: string;
  }

  export type MembershipChangeRequestType =
    | "addFacility"
    | "removeFacility";
  
  export type MembershipChangeRequestStatus =
    | "pending"
    | "underReview"
    | "approved"
    | "rejected";