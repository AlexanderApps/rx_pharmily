// RxVitals is a personal, at-home record of vital signs — nothing more.
// It never interprets a reading (no "normal/high/low" labels, no color
// coding by value, no thresholds, no alerts). It only records what the
// user enters and helps them export a clean, structured PDF to share with
// a medical professional, who does the actual interpreting.

export type VitalType =
  | "blood_pressure"
  | "blood_glucose"
  | "heart_rate"
  | "temperature"
  | "weight"
  | "oxygen_saturation";

// Purely descriptive context for a glucose reading (when it was taken
// relative to a meal) — not a clinical classification of the result.
export type GlucoseContext = "fasting" | "random" | "post_meal";

export interface VitalReading {
  id: string;
  type: VitalType;
  recordedAt: Date;
  createdBy: string;
  notes?: string;

  // Blood pressure
  systolic?: number;
  diastolic?: number;
  pulse?: number;

  // Blood glucose (RBS)
  glucoseValue?: number;
  glucoseUnit?: "mg/dL" | "mmol/L";
  glucoseContext?: GlucoseContext;

  // Heart rate (standalone, when not captured alongside BP)
  heartRateValue?: number;

  // Temperature
  temperatureValue?: number;
  temperatureUnit?: "C" | "F";

  // Weight
  weightValue?: number;
  weightUnit?: "kg" | "lb";

  // Oxygen saturation
  oxygenSaturationValue?: number;
}

export type VitalReadingFormData = Omit<VitalReading, "id" | "createdBy">;
