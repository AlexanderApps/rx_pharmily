// NOT USED — kept only as reference/seed data. The live store
// (features/vitals/hooks/use-vitals-data.ts) now reads from Supabase.

import { VitalReading } from "@/features/vitals/types/vitals.types";

const CURRENT_USER = "You";

function daysAgo(days: number, hour = 8) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const MOCK_READINGS: VitalReading[] = [
  {
    id: "v1",
    type: "blood_pressure",
    recordedAt: daysAgo(0, 7),
    systolic: 122,
    diastolic: 80,
    pulse: 74,
    createdBy: CURRENT_USER,
  },
  {
    id: "v2",
    type: "blood_glucose",
    recordedAt: daysAgo(0, 7),
    glucoseValue: 96,
    glucoseUnit: "mg/dL",
    glucoseContext: "fasting",
    createdBy: CURRENT_USER,
  },
  {
    id: "v3",
    type: "weight",
    recordedAt: daysAgo(2, 7),
    weightValue: 78.4,
    weightUnit: "kg",
    createdBy: CURRENT_USER,
  },
  {
    id: "v4",
    type: "blood_pressure",
    recordedAt: daysAgo(3, 8),
    systolic: 128,
    diastolic: 84,
    pulse: 78,
    createdBy: CURRENT_USER,
  },
  {
    id: "v5",
    type: "blood_glucose",
    recordedAt: daysAgo(5, 20),
    glucoseValue: 141,
    glucoseUnit: "mg/dL",
    glucoseContext: "post_meal",
    notes: "About an hour after dinner.",
    createdBy: CURRENT_USER,
  },
  {
    id: "v6",
    type: "oxygen_saturation",
    recordedAt: daysAgo(6, 9),
    oxygenSaturationValue: 98,
    createdBy: CURRENT_USER,
  },
];

