// NOT USED — kept only as reference/seed data. The live store
// (features/ads/hooks/use-ads-data.ts) now reads from Supabase.
// Note: CURRENT_ADVERTISER/ADVERTISERS below was ads' own separate mock
// identity scheme (same bug class fixed in RxRFQ/Donations/MediScope/
// RxJobs this session, applied to authors instead of facilities here).

import { Ad, AdAuthor, AdComment } from "@/features/ads/types/ads.types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
let paymentRefCounter = 1000;
function mockPaymentReference() {
  return `PAY-${paymentRefCounter++}`;
}

export const CURRENT_ADVERTISER: AdAuthor = {
  id: "me",
  name: "You",
  role: "Advertiser",
  avatarColor: "#0066cc",
};

const ADVERTISERS: AdAuthor[] = [
  { id: "adv1", name: "GlobalRx Pharmaceuticals", role: "Manufacturer", avatarColor: "#2563eb" },
  { id: "adv2", name: "MedPlus Distributors", role: "Distributor", avatarColor: "#16a34a" },
  { id: "adv3", name: "PrimeCare Pharma Ltd", role: "Manufacturer", avatarColor: "#9333ea" },
  { id: "adv4", name: "Northstar Healthcare Logistics", role: "Logistics", avatarColor: "#d97706" },
];

const MOCK_ADS: Ad[] = [
  {
    id: "1",
    advertiser: ADVERTISERS[0],
    title: "New Once-Daily Insulin Now Available Nationwide",
    text: "GlobalRx's newest long-acting insulin formulation is now in stock at distributors across Ghana. Ask your rep about introductory pricing for pharmacies.",
    media: [
      {
        id: "am1",
        type: "image",
        uri: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=900&q=80",
        sizeBytes: 2_100_000,
        width: 900,
        height: 600,
      },
    ],
    linkUrl: "https://globalrx-pharma.example.com/insulin",
    category: "medication",
    fdaApprovalId: "FDA-GH-2025-04471",
    status: "approved",
    reviewedBy: "System Admin",
    reviewedAt: hoursAgo(60),
    plan: AD_PLANS[1],
    payment: {
      planId: AD_PLANS[1].id,
      amount: AD_PLANS[1].price,
      currency: AD_PLANS[1].currency,
      status: "paid",
      paidAt: hoursAgo(62),
      reference: mockPaymentReference(),
    },
    createdAt: hoursAgo(62),
    startsAt: hoursAgo(60),
    expiresAt: daysFromNow(18),
    likeCount: 24,
    dislikeCount: 1,
    userReaction: null,
    commentCount: 1,
  },
  {
    id: "2",
    advertiser: ADVERTISERS[1],
    title: "Bulk Cold-Chain Delivery — 10% Off First Order",
    text: "Reliable cold-chain distribution for vaccines and biologics. New pharmacy partners get 10% off their first bulk order this month.",
    linkUrl: "https://medplus-distributors.example.com",
    category: "service",
    status: "approved",
    reviewedBy: "System Admin",
    reviewedAt: hoursAgo(100),
    plan: AD_PLANS[0],
    payment: {
      planId: AD_PLANS[0].id,
      amount: AD_PLANS[0].price,
      currency: AD_PLANS[0].currency,
      status: "paid",
      paidAt: hoursAgo(101),
      reference: mockPaymentReference(),
    },
    createdAt: hoursAgo(101),
    startsAt: hoursAgo(100),
    expiresAt: daysFromNow(-3),
    likeCount: 9,
    dislikeCount: 0,
    userReaction: null,
    commentCount: 0,
  },
  {
    id: "3",
    advertiser: ADVERTISERS[2],
    title: "Portable Blood Glucose Monitor — Clinic Bundle Pricing",
    text: "Our FDA-registered glucose monitoring kits are now available in bundles of 20, ideal for outreach clinics and community screening days.",
    media: [
      {
        id: "am2",
        type: "image",
        uri: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=900&q=80",
        sizeBytes: 1_800_000,
        width: 900,
        height: 600,
      },
    ],
    category: "medical-device",
    fdaApprovalId: "FDA-GH-2025-01123",
    status: "pending",
    plan: AD_PLANS[0],
    payment: {
      planId: AD_PLANS[0].id,
      amount: AD_PLANS[0].price,
      currency: AD_PLANS[0].currency,
      status: "paid",
      paidAt: hoursAgo(3),
      reference: mockPaymentReference(),
    },
    createdAt: hoursAgo(3),
    likeCount: 0,
    dislikeCount: 0,
    userReaction: null,
    commentCount: 0,
  },
  {
    id: "4",
    advertiser: ADVERTISERS[3],
    title: "Same-Day Courier for Urgent Pharmacy Restocks",
    text: "Need emergency stock moved across town? Our same-day courier network now covers Accra, Tema, and Kumasi.",
    category: "service",
    status: "rejected",
    statusReason:
      'Claims of "same-day, guaranteed" delivery require supporting documentation before approval.',
    reviewedBy: "System Admin",
    reviewedAt: hoursAgo(20),
    plan: AD_PLANS[0],
    payment: {
      planId: AD_PLANS[0].id,
      amount: AD_PLANS[0].price,
      currency: AD_PLANS[0].currency,
      status: "refunded",
      paidAt: hoursAgo(22),
      reference: mockPaymentReference(),
    },
    createdAt: hoursAgo(22),
    likeCount: 0,
    dislikeCount: 0,
    userReaction: null,
    commentCount: 0,
  },
  {
    id: "5",
    advertiser: ADVERTISERS[0],
    title: "Herbal Immune Booster Capsules — Wholesale Available",
    text: "Popular herbal supplement now offering wholesale pricing for retail pharmacies.",
    category: "medication",
    fdaApprovalId: "FDA-GH-2022-00098",
    status: "suspended",
    statusReason:
      "Marketing claims are under review following a labelling complaint. Ad paused pending outcome.",
    reviewedBy: "System Admin",
    reviewedAt: hoursAgo(12),
    plan: AD_PLANS[1],
    payment: {
      planId: AD_PLANS[1].id,
      amount: AD_PLANS[1].price,
      currency: AD_PLANS[1].currency,
      status: "paid",
      paidAt: hoursAgo(200),
      reference: mockPaymentReference(),
    },
    createdAt: hoursAgo(200),
    startsAt: hoursAgo(198),
    expiresAt: daysFromNow(10),
    likeCount: 3,
    dislikeCount: 2,
    userReaction: null,
    commentCount: 0,
  },
];

const MOCK_COMMENTS: AdComment[] = [
  {
    id: "ac1",
    adId: "1",
    author: ADVERTISERS[1],
    text: "Do you have a rep covering the Kumasi region for this?",
    createdAt: hoursAgo(50),
  },
];

