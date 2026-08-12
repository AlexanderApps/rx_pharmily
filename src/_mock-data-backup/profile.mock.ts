// NOT USED — kept only as reference/seed data. The live store
// (features/profile/hooks/use-profile-data.ts) now reads from Supabase.

import {
  CoverLetterTemplate,
  FacilityMembership,
  FacilityProfile,
  KycRecord,
  OrganizationProfile,
  PriceTemplate,
  UserProfile,
  DEFAULT_ENTITY_VISIBILITY,
  DEFAULT_USER_VISIBILITY,
} from "@/features/profile/types/profile.types";

export const CURRENT_USER_ID = "u1";
const FACILITY_ADENTA = "f1";
const FACILITY_RIDGE = "f2";
const FACILITY_TEMA = "f3";
const ORG_ADENTA_GROUP = "org1";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const MOCK_USER: UserProfile = {
  id: CURRENT_USER_ID,
  fullName: "Alexander Mensah",
  email: "alexander@adentapharmacy.com",
  phone: "+233 24 000 0000",
  role: "Pharmacist",
  licenseNumber: "PH-GH-2019-4471",
  bio: "Community pharmacist and developer, building tools for the pharmacy network.",
  avatarColor: "#0066cc",
  kyc: {
    status: "verified",
    documents: [
      { id: "kd-u1", type: "Pharmacist License", fileName: "pharmacist-license.jpg", uploadedAt: daysAgo(40) },
      { id: "kd-u2", type: "Government ID", fileName: "national-id.jpg", uploadedAt: daysAgo(40) },
    ],
    submittedAt: daysAgo(40),
    reviewedAt: daysAgo(38),
    reviewedBy: "System Admin",
  },
  createdAt: daysAgo(120),
  publicVisibility: DEFAULT_USER_VISIBILITY,
};

const OTHER_USERS: { id: string; fullName: string; email: string; avatarColor: string }[] = [
  { id: "u2", fullName: "Ama Boateng", email: "ama.boateng@example.com", avatarColor: "#16a34a" },
  { id: "u3", fullName: "Kojo Mensah", email: "kojo.mensah@example.com", avatarColor: "#9333ea" },
  { id: "u4", fullName: "Efua Owusu", email: "efua.owusu@example.com", avatarColor: "#d97706" },
];

const MOCK_FACILITIES: FacilityProfile[] = [
  {
    id: FACILITY_ADENTA,
    name: "Adenta Pharmacy",
    type: "Retail Pharmacy",
    location: "Accra",
    region: "Greater Accra",
    address: "12 Adenta Ring Road, Accra",
    phone: "+233 30 000 0000",
    email: "contact@adentapharmacy.com",
    registrationNumber: "FDA-GH-FAC-00812",
    organizationId: ORG_ADENTA_GROUP,
    adminUserId: CURRENT_USER_ID,
    kyc: {
      status: "verified",
      documents: [
        { id: "kd-f1", type: "Facility Permit", fileName: "facility-permit.pdf", uploadedAt: daysAgo(60) },
      ],
      submittedAt: daysAgo(60),
      reviewedAt: daysAgo(58),
      reviewedBy: "System Admin",
    },
    createdAt: daysAgo(200),
    publicVisibility: DEFAULT_ENTITY_VISIBILITY,
  },
  {
    id: FACILITY_RIDGE,
    name: "Ridge Hospital",
    type: "Hospital",
    location: "Accra",
    region: "Greater Accra",
    adminUserId: "u2",
    kyc: {
      status: "pending",
      documents: [
        { id: "kd-f2", type: "Facility Permit", fileName: "ridge-permit.pdf", uploadedAt: daysAgo(2) },
      ],
      submittedAt: daysAgo(2),
    },
    createdAt: daysAgo(90),
    publicVisibility: DEFAULT_ENTITY_VISIBILITY,
  },
  {
    id: FACILITY_TEMA,
    name: "Tema General Hospital",
    type: "Hospital",
    location: "Tema",
    region: "Greater Accra",
    adminUserId: "u3",
    kyc: {
      status: "verified",
      documents: [
        { id: "kd-f3", type: "Facility Permit", fileName: "tema-permit.pdf", uploadedAt: daysAgo(30) },
      ],
      submittedAt: daysAgo(30),
      reviewedAt: daysAgo(28),
      reviewedBy: "System Admin",
    },
    createdAt: daysAgo(150),
    publicVisibility: DEFAULT_ENTITY_VISIBILITY,
  },
];

const MOCK_ORGANIZATIONS: OrganizationProfile[] = [
  {
    id: ORG_ADENTA_GROUP,
    name: "Adenta Health Group",
    type: "Pharmacy Chain",
    registrationNumber: "RGD-GH-2015-0091",
    headquartersLocation: "Accra",
    email: "info@adentahealthgroup.com",
    phone: "+233 30 111 2222",
    adminUserId: CURRENT_USER_ID,
    facilityIds: [FACILITY_ADENTA],
    kyc: {
      status: "verified",
      documents: [
        { id: "kd-o1", type: "Business Registration", fileName: "org-registration.pdf", uploadedAt: daysAgo(100) },
      ],
      submittedAt: daysAgo(100),
      reviewedAt: daysAgo(97),
      reviewedBy: "System Admin",
    },
    createdAt: daysAgo(400),
    publicVisibility: DEFAULT_ENTITY_VISIBILITY,
  },
];

const MOCK_MEMBERSHIPS: FacilityMembership[] = [
  {
    id: "fm1",
    facilityId: FACILITY_ADENTA,
    userId: CURRENT_USER_ID,
    userName: MOCK_USER.fullName,
    userEmail: MOCK_USER.email,
    avatarColor: MOCK_USER.avatarColor,
    role: "Owner",
    joinedAt: daysAgo(200),
  },
  {
    id: "fm2",
    facilityId: FACILITY_ADENTA,
    userId: "u2",
    userName: "Ama Boateng",
    userEmail: "ama.boateng@example.com",
    avatarColor: "#16a34a",
    role: "Member",
    joinedAt: daysAgo(80),
  },
  {
    id: "fm3",
    facilityId: FACILITY_RIDGE,
    userId: CURRENT_USER_ID,
    userName: MOCK_USER.fullName,
    userEmail: MOCK_USER.email,
    avatarColor: MOCK_USER.avatarColor,
    role: "Member",
    joinedAt: daysAgo(20),
  },
];

const MOCK_COVER_LETTERS: CoverLetterTemplate[] = [
  {
    id: "cl1",
    userId: CURRENT_USER_ID,
    title: "General Locum Application",
    body: "I'm a licensed pharmacist with experience across community and hospital settings, comfortable stepping into locum shifts on short notice. I'd welcome the opportunity to support your team and can share references on request.",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: "cl2",
    userId: CURRENT_USER_ID,
    title: "Full-Time Hospital Pharmacist",
    body: "I'm applying for the full-time pharmacist role with a strong background in inpatient dispensing and medication reconciliation. I'm looking for a long-term position where I can grow into a clinical leadership track.",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
];

const MOCK_PRICE_TEMPLATES: PriceTemplate[] = [
  {
    id: "pt1",
    facilityId: FACILITY_ADENTA,
    title: "Q1 2026 Standard Rate Card",
    fileName: "q1-2026-rates.csv",
    uploadedAt: daysAgo(15),
    items: [
      { id: "pti1", product: "Paracetamol 500mg", rate: 0.35, unit: "tablet" },
      { id: "pti2", product: "Amoxicillin 250mg", rate: 1.2, unit: "capsule" },
      { id: "pti3", product: "Insulin Glargine 100IU/ml", rate: 145, unit: "vial" },
    ],
  },
];

