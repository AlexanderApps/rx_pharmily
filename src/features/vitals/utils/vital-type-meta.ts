import { VitalType } from "@/features/vitals/types/vitals.types";

export interface VitalTypeMeta {
  type: VitalType;
  label: string;
  shortLabel: string;
  icon: string;
  unit: string;
}

// Deliberately no "normal range" data here — this app only records and
// displays what the user enters, never characterizes it.
export const VITAL_TYPE_META: Record<VitalType, VitalTypeMeta> = {
  blood_pressure: {
    type: "blood_pressure",
    label: "Blood Pressure",
    shortLabel: "BP",
    icon: "heart-pulse",
    unit: "mmHg",
  },
  blood_glucose: {
    type: "blood_glucose",
    label: "Blood Glucose (RBS)",
    shortLabel: "Glucose",
    icon: "water-outline",
    unit: "mg/dL",
  },
  heart_rate: {
    type: "heart_rate",
    label: "Heart Rate",
    shortLabel: "Pulse",
    icon: "pulse",
    unit: "bpm",
  },
  temperature: {
    type: "temperature",
    label: "Temperature",
    shortLabel: "Temp",
    icon: "thermometer",
    unit: "°C",
  },
  weight: {
    type: "weight",
    label: "Weight",
    shortLabel: "Weight",
    icon: "scale-bathroom",
    unit: "kg",
  },
  oxygen_saturation: {
    type: "oxygen_saturation",
    label: "Oxygen Saturation",
    shortLabel: "SpO2",
    icon: "lungs",
    unit: "%",
  },
};

export const VITAL_TYPES_ORDERED: VitalType[] = [
  "blood_pressure",
  "blood_glucose",
  "heart_rate",
  "temperature",
  "weight",
  "oxygen_saturation",
];
