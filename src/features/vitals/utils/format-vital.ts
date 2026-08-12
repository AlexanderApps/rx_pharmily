import { VitalReading } from "@/features/vitals/types/vitals.types";
import { VITAL_TYPE_META } from "@/features/vitals/utils/vital-type-meta";

const GLUCOSE_CONTEXT_LABEL: Record<string, string> = {
  fasting: "Fasting",
  random: "Random",
  post_meal: "Post-meal",
};

// Plain value + unit, no interpretation. e.g. "122/80 mmHg", "96 mg/dL".
export function formatVitalValue(reading: VitalReading): string {
  switch (reading.type) {
    case "blood_pressure": {
      const bp = `${reading.systolic ?? "-"}/${reading.diastolic ?? "-"} mmHg`;
      return reading.pulse ? `${bp} · ${reading.pulse} bpm` : bp;
    }
    case "blood_glucose": {
      const unit = reading.glucoseUnit ?? "mg/dL";
      const context = reading.glucoseContext ? ` (${GLUCOSE_CONTEXT_LABEL[reading.glucoseContext]})` : "";
      return `${reading.glucoseValue ?? "-"} ${unit}${context}`;
    }
    case "heart_rate":
      return `${reading.heartRateValue ?? "-"} bpm`;
    case "temperature":
      return `${reading.temperatureValue ?? "-"}°${reading.temperatureUnit ?? "C"}`;
    case "weight":
      return `${reading.weightValue ?? "-"} ${reading.weightUnit ?? "kg"}`;
    case "oxygen_saturation":
      return `${reading.oxygenSaturationValue ?? "-"}%`;
    default:
      return "-";
  }
}

export function vitalTypeLabel(reading: VitalReading): string {
  return VITAL_TYPE_META[reading.type].label;
}
