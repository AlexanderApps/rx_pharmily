// NOT USED — kept only as reference/seed data. The live store
// (features/donations/hooks/use-donation-data.ts) now reads from Supabase.
// Note: DONATION_FACILITIES below was donations' own separate mock
// facility list, disconnected from every other facility reference in the
// app (the same bug class fixed in RxRFQ this session). The live store
// resolves facility names live from the shared `facilities` table instead.

import { Donation, DonationResponse } from "@/features/donations/types/donation.types";

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export type Facility = {
  id: string;
  name: string;
  location: string;
};

export const DONATION_FACILITIES: Facility[] = [
  { id: "f1", name: "Adenta Pharmacy", location: "Accra" },
  { id: "f2", name: "Accra Central Clinic", location: "Accra" },
  { id: "f3", name: "Tema Central Clinic", location: "Tema" },
  { id: "f4", name: "Madina Community Hospital", location: "Accra" },
  { id: "f5", name: "Kumasi Regional Hospital", location: "Kumasi" },
  { id: "f6", name: "Ridge Hospital", location: "Accra" },
];

const MOCK_DONATIONS: Donation[] = [
  {
    id: "1",
    code: "DON-2026-001",
    facility: "f1",
    facilityName: "Adenta Pharmacy",
    facilityLocation: "Accra",
    categories: ["Medications"],
    termsOfService: "Items must be collected within 7 days of approval.",
    comment: "Surplus stock from a recent restock cycle.",
    isActive: true,
    status: "opened",
    createdAt: daysFromNow(-2),
    createdBy: "You",
    responseCount: 1,
    donatedItems: [
      {
        id: "1-1",
        product: "Paracetamol 500mg",
        quantity: 200,
        batch: "PCM-2201",
        expiryDate: daysFromNow(240),
        status: true,
        isActive: true,
      },
      {
        id: "1-2",
        product: "Amoxicillin 250mg Susp.",
        quantity: 40,
        batch: "AMX-1187",
        expiryDate: daysFromNow(20),
        status: true,
        isActive: true,
      },
      {
        id: "1-3",
        product: "ORS Sachets",
        quantity: 150,
        batch: "ORS-0093",
        expiryDate: daysFromNow(-10),
        status: false,
        isActive: false,
      },
    ],
  },
  {
    id: "2",
    code: "DON-2026-002",
    facility: "f4",
    facilityName: "Madina Community Hospital",
    facilityLocation: "Accra",
    categories: ["Consumables", "Devices"],
    termsOfService: "Priority given to registered NGOs.",
    comment: "",
    isActive: false,
    status: "hidden",
    createdAt: daysFromNow(-1),
    createdBy: "You",
    responseCount: 0,
    donatedItems: [
      {
        id: "2-1",
        product: "Surgical Gloves (Box)",
        quantity: 30,
        batch: "GLV-4471",
        expiryDate: daysFromNow(400),
        status: true,
        isActive: true,
      },
    ],
  },
  {
    id: "3",
    code: "DON-2026-003",
    facility: "f2",
    facilityName: "Accra Central Clinic",
    facilityLocation: "Accra",
    categories: ["Medications", "Test Kits"],
    termsOfService: "Collection by appointment only.",
    comment: "Donated ahead of facility relocation.",
    isActive: true,
    status: "opened",
    createdAt: daysFromNow(-3),
    createdBy: "You",
    responseCount: 1,
    donatedItems: [
      {
        id: "3-1",
        product: "Malaria RDT Kits",
        quantity: 80,
        batch: "RDT-3302",
        expiryDate: daysFromNow(5),
        status: true,
        isActive: true,
      },
      {
        id: "3-2",
        product: "Ibuprofen 400mg",
        quantity: 120,
        batch: "IBU-9021",
        expiryDate: daysFromNow(180),
        status: true,
        isActive: true,
      },
      {
        id: "3-3",
        product: "Insulin Glargine",
        quantity: 12,
        batch: "INS-0044",
        expiryDate: daysFromNow(60),
        status: true,
        isActive: true,
      },
    ],
  },
  {
    id: "4",
    code: "DON-2026-004",
    facility: "f3",
    facilityName: "Tema Central Clinic",
    facilityLocation: "Tema",
    categories: ["Medications"],
    termsOfService: "",
    comment: "Closed out after full claim.",
    isActive: true,
    status: "closed",
    createdAt: daysFromNow(-6),
    createdBy: "You",
    responseCount: 0,
    donatedItems: [
      {
        id: "4-1",
        product: "Ceftriaxone 1g Injection",
        quantity: 24,
        batch: "CFX-5510",
        expiryDate: daysFromNow(90),
        status: true,
        isActive: false,
      },
    ],
  },
];

const MOCK_DONATION_RESPONSES: DonationResponse[] = [
  {
    id: "dresp-1",
    donationId: "1",
    responderFacility: "Kumasi Regional Hospital",
    items: [
      { id: "dri-1", donationItemId: "1-1", product: "Paracetamol 500mg", requestedQuantity: 100 },
      { id: "dri-2", donationItemId: "1-2", product: "Amoxicillin 250mg Susp.", requestedQuantity: 20 },
    ],
    comment: "We can arrange pickup within 2 days of approval.",
    status: "pending",
    createdAt: daysFromNow(-1),
    createdBy: "Kumasi Regional Hospital",
  },
  {
    id: "dresp-2",
    donationId: "3",
    responderFacility: "Ridge Hospital",
    items: [
      { id: "dri-3", donationItemId: "3-1", product: "Malaria RDT Kits", requestedQuantity: 80 },
    ],
    comment: "Needed for an upcoming outreach screening.",
    status: "approved",
    createdAt: daysFromNow(-2),
    createdBy: "Ridge Hospital",
  },
];

