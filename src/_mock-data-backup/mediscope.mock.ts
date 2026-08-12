// NOT USED — kept only as reference/seed data. The live store
// (features/mediscope/hooks/use-mediscope-data.ts) now reads from Supabase.
// Note: MEDISCOPE_FACILITIES below was mediscope's own separate mock
// facility list, disconnected from every other facility reference in the
// app (the same bug class fixed in RxRFQ and Donations this session).

import { MediscopeRequest, MediscopeResponse } from "@/features/mediscope/types/mediscope.types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export type Facility = { id: string; name: string; location: string };

export const MEDISCOPE_FACILITIES: Facility[] = [
  { id: "f1", name: "Adenta Pharmacy", location: "Accra" },
  { id: "f2", name: "Accra Central Clinic", location: "Accra" },
  { id: "f3", name: "Tema Central Clinic", location: "Tema" },
  { id: "f4", name: "Madina Community Hospital", location: "Accra" },
  { id: "f5", name: "Kumasi Regional Hospital", location: "Kumasi" },
  { id: "f6", name: "Ridge Hospital", location: "Accra" },
];

const MOCK_REQUESTS: MediscopeRequest[] = [
  {
    id: "1",
    code: generateCode("1"),
    facility: "f1",
    facilityName: "Adenta Pharmacy",
    facilityLocation: "Accra",
    product: "Enoxaparin 40mg Injection",
    isCustomProduct: false,
    comment: "Needed for a patient being discharged today, any pack size works.",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
    status: "published",
    isActive: true,
    visibilityScope: "All",
    visibilityRules: [],
    submissionDeadline: daysFromNow(2),
    createdAt: hoursAgo(3),
    createdBy: "You",
    publishedAt: hoursAgo(3),
    responseCount: 2,
  },
  {
    id: "2",
    code: generateCode("2"),
    facility: "f1",
    facilityName: "Adenta Pharmacy",
    facilityLocation: "Accra",
    product: "Insulin Glargine 100IU/ml",
    isCustomProduct: false,
    status: "published",
    isActive: true,
    visibilityScope: "Restricted",
    visibilityRules: [
      { id: "r1", ruleType: "Region", region: "Greater Accra" },
    ],
    submissionDeadline: daysFromNow(5),
    createdAt: hoursAgo(20),
    createdBy: "You",
    publishedAt: hoursAgo(20),
    responseCount: 1,
  },
  {
    id: "3",
    code: generateCode("3"),
    facility: "f2",
    facilityName: "Accra Central Clinic",
    facilityLocation: "Accra",
    product: "Amoxicillin 250mg/5ml Suspension",
    isCustomProduct: false,
    comment: "Pediatric ward running low, need urgently.",
    status: "fulfilled",
    isActive: true,
    visibilityScope: "All",
    visibilityRules: [],
    submissionDeadline: daysFromNow(-1),
    createdAt: hoursAgo(48),
    createdBy: "Accra Central Clinic",
    publishedAt: hoursAgo(48),
    responseCount: 3,
    fulfilledResponseId: "resp-3",
  },
  {
    id: "4",
    code: generateCode("4"),
    facility: "f3",
    facilityName: "Tema Central Clinic",
    facilityLocation: "Tema",
    product: "Paracetamol IV 1g",
    isCustomProduct: false,
    status: "draft",
    isActive: true,
    visibilityScope: "All",
    visibilityRules: [],
    createdAt: hoursAgo(1),
    createdBy: "Tema Central Clinic",
    responseCount: 0,
  },
  {
    id: "5",
    code: generateCode("5"),
    facility: "f4",
    facilityName: "Madina Community Hospital",
    facilityLocation: "Accra",
    product: "Ceftriaxone 1g Injection",
    isCustomProduct: false,
    status: "expired",
    isActive: false,
    visibilityScope: "All",
    visibilityRules: [],
    submissionDeadline: hoursAgo(10),
    createdAt: hoursAgo(200),
    createdBy: "Madina Community Hospital",
    publishedAt: hoursAgo(200),
    responseCount: 0,
  },
];

const MOCK_RESPONSES: MediscopeResponse[] = [
  {
    id: "resp-1",
    requestId: "1",
    vendorFacility: "MedPlus Distributors",
    availability: "full",
    facilityWhereAvailable: "MedPlus Distributors — Accra Warehouse",
    cost: 45,
    currency: "GHS",
    comment: "In stock, can deliver within 2 hours.",
    createdAt: hoursAgo(2),
    createdBy: "MedPlus Distributors",
  },
  {
    id: "resp-2",
    requestId: "1",
    vendorFacility: "Ridge Hospital",
    availability: "partial",
    facilityWhereAvailable: "Ridge Hospital Pharmacy",
    cost: 50,
    currency: "GHS",
    comment: "Only 6 units left, first come first served.",
    createdAt: hoursAgo(1),
    createdBy: "Ridge Hospital",
  },
  {
    id: "resp-3",
    requestId: "3",
    vendorFacility: "Kumasi Regional Hospital",
    availability: "full",
    facilityWhereAvailable: "Kumasi Regional Hospital Pharmacy",
    cost: 18,
    currency: "GHS",
    comment: "Plenty in stock.",
    createdAt: hoursAgo(40),
    createdBy: "Kumasi Regional Hospital",
  },
  {
    id: "resp-4",
    requestId: "2",
    vendorFacility: "Accra Central Clinic",
    availability: "full",
    facilityWhereAvailable: "Accra Central Clinic Dispensary",
    cost: 120,
    currency: "GHS",
    createdAt: hoursAgo(15),
    createdBy: "Accra Central Clinic",
  },
];

