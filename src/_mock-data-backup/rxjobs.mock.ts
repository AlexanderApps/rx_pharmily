// NOT USED — kept only as reference/seed data. The live store
// (features/rxjobs/hooks/use-rxjobs-data.ts) now reads from Supabase.

import { Job, JobApplication } from "@/features/rxjobs/types/rxjobs.types";
import { format } from "timeago.js";

const CURRENT_APPLICANT_NAME = "You";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const RAW_JOBS: Omit<Job, "postedDate">[] = [
  {
    id: "1",
    title: "Locum Pharmacist — Weekend Cover",
    companyName: "Adenta Pharmacy",
    companyLogo: "AP",
    location: "Accra, Greater Accra",
    jobType: "Locum Shift",
    salaryRange: "GHS 800 - 1,200 / shift",
    requirements: [
      "Valid Pharmacy Council license",
      "2+ years community pharmacy experience",
      "Available Saturdays & Sundays",
    ],
    description:
      "Covering weekend shifts at a busy neighbourhood pharmacy. Duties include dispensing, patient counselling, and basic inventory checks.",
    applicantsCount: 6,
    urgency: "Immediate",
    createdAt: hoursAgo(3),
    applicationDeadline: daysFromNow(5),
    postedBy: "Adenta Pharmacy",
    status: "open",
  },
  {
    id: "2",
    title: "Clinical Pharmacist — ICU",
    companyName: "Tema General Hospital",
    companyLogo: "TG",
    location: "Tema, Greater Accra",
    jobType: "Full-Time",
    salaryRange: "GHS 6,500 - 8,000 / month",
    requirements: [
      "PharmD or equivalent",
      "Critical care experience preferred",
      "Registered with Pharmacy Council of Ghana",
    ],
    description:
      "Join our ICU clinical pharmacy team providing medication therapy management, rounding with the critical care team, and supporting antimicrobial stewardship.",
    applicantsCount: 14,
    urgency: "Standard",
    createdAt: hoursAgo(20),
    applicationDeadline: daysFromNow(21),
    postedBy: "Tema General Hospital",
    status: "open",
  },
  {
    id: "3",
    title: "Medical Science Liaison — Oncology",
    companyName: "GlobalRx Pharmaceuticals",
    companyLogo: "GP",
    location: "Accra (Field-based)",
    jobType: "MSL / Industrial",
    salaryRange: "GHS 12,000 - 15,000 / month",
    requirements: [
      "PharmD, PhD or MD",
      "3+ years MSL or clinical oncology experience",
      "Willingness to travel regionally",
    ],
    description:
      "Serve as the scientific liaison between our oncology portfolio and key opinion leaders across West Africa. Field-based role with regular travel.",
    applicantsCount: 4,
    urgency: "Standard",
    createdAt: hoursAgo(48),
    applicationDeadline: daysFromNow(30),
    postedBy: "GlobalRx Pharmaceuticals",
    status: "open",
  },
  {
    id: "4",
    title: "Hospital Specialist — Oncology Pharmacy",
    companyName: "Ridge Hospital",
    companyLogo: "RH",
    location: "Accra, Greater Accra",
    jobType: "Hospital Specialist",
    salaryRange: "GHS 9,000 - 11,500 / month",
    requirements: [
      "Board certification in oncology pharmacy (or in progress)",
      "Chemotherapy compounding experience",
      "5+ years hospital pharmacy practice",
    ],
    description:
      "Lead oncology pharmacy services including chemotherapy verification, compounding oversight, and patient education for our growing cancer care unit.",
    applicantsCount: 2,
    urgency: "Immediate",
    createdAt: hoursAgo(6),
    applicationDeadline: daysFromNow(3),
    postedBy: "Ridge Hospital",
    status: "open",
  },
  {
    id: "5",
    title: "Pharmacy Technician",
    companyName: "Madina Community Hospital",
    companyLogo: "MC",
    location: "Madina, Greater Accra",
    jobType: "Part-Time",
    salaryRange: "GHS 2,200 - 2,800 / month",
    requirements: [
      "Certified Pharmacy Technician",
      "1+ years experience in a hospital or retail setting",
      "Strong attention to detail",
    ],
    description:
      "Support our dispensary team with prescription processing, stock management, and patient-facing counter service, three days a week.",
    applicantsCount: 21,
    urgency: "Standard",
    createdAt: hoursAgo(72),
    applicationDeadline: daysFromNow(10),
    postedBy: "Madina Community Hospital",
    status: "open",
  },
  {
    id: "6",
    title: "Locum Pharmacist — Night Shifts",
    companyName: "Kumasi Regional Hospital",
    companyLogo: "KR",
    location: "Kumasi, Ashanti",
    jobType: "Locum Shift",
    salaryRange: "GHS 900 - 1,400 / shift",
    requirements: [
      "Valid Pharmacy Council license",
      "Comfortable working overnight",
      "Available on short notice",
    ],
    description:
      "Filling short-notice overnight shifts across our inpatient dispensary. Great for pharmacists looking for flexible, well-compensated locum work.",
    applicantsCount: 3,
    urgency: "Immediate",
    createdAt: hoursAgo(1),
    applicationDeadline: daysFromNow(2),
    postedBy: "Kumasi Regional Hospital",
    status: "open",
  },
  {
    id: "7",
    title: "Regulatory Affairs Pharmacist",
    companyName: "PrimeCare Pharma Ltd",
    companyLogo: "PC",
    location: "Accra, Greater Accra",
    jobType: "Full-Time",
    salaryRange: "GHS 7,000 - 9,000 / month",
    requirements: [
      "Pharmacy degree with regulatory affairs experience",
      "Familiarity with FDA Ghana submission processes",
      "Strong documentation skills",
    ],
    description:
      "Manage product registration dossiers, liaise with the FDA on submissions and renewals, and support post-market surveillance activities.",
    applicantsCount: 8,
    urgency: "Standard",
    createdAt: hoursAgo(96),
    applicationDeadline: daysFromNow(14),
    postedBy: "PrimeCare Pharma Ltd",
    status: "open",
  },
];

const MOCK_JOBS: Job[] = RAW_JOBS.map((job) => ({
  ...job,
  postedDate: format(job.createdAt),
}));
const MOCK_APPLICATIONS: JobApplication[] = [
  {
    id: "app-1",
    jobId: "5",
    applicantName: CURRENT_APPLICANT_NAME,
    coverNote:
      "I have two years of dispensary experience at a similar volume pharmacy.",
    appliedAt: hoursAgo(40),
    status: "reviewing",
  },
  {
    id: "app-2",
    jobId: "3",
    applicantName: CURRENT_APPLICANT_NAME,
    coverNote: "Available for immediate start, MSL background in cardiology.",
    appliedAt: hoursAgo(96),
    status: "shortlisted",
  },
];

