import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { VitalReading, VitalReadingFormData } from "@/features/vitals/types/vitals.types";

function mapRow(row: any): VitalReading {
  return {
    id: row.id,
    type: row.type,
    recordedAt: new Date(row.recorded_at),
    createdBy: row.user_id,
    notes: row.notes ?? undefined,
    systolic: row.systolic ?? undefined,
    diastolic: row.diastolic ?? undefined,
    pulse: row.pulse ?? undefined,
    glucoseValue: row.glucose_value ?? undefined,
    glucoseUnit: row.glucose_unit ?? undefined,
    glucoseContext: row.glucose_context ?? undefined,
    heartRateValue: row.heart_rate_value ?? undefined,
    temperatureValue: row.temperature_value ?? undefined,
    temperatureUnit: row.temperature_unit ?? undefined,
    weightValue: row.weight_value ?? undefined,
    weightUnit: row.weight_unit ?? undefined,
    oxygenSaturationValue: row.oxygen_saturation_value ?? undefined,
  };
}

type VitalsStore = {
  readings: VitalReading[];
  isLoading: boolean;

  fetchReadings: () => Promise<void>;
  addReading: (data: VitalReadingFormData) => Promise<void>;
  deleteReading: (id: string) => Promise<void>;
};

export const useVitalsStore = create<VitalsStore>((set) => ({
  readings: [],
  isLoading: false,

  fetchReadings: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("vital_readings")
      .select("*")
      .order("recorded_at", { ascending: false });
    if (error) {
      console.warn("[vitals] fetchReadings failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ readings: (data ?? []).map(mapRow), isLoading: false });
  },

  addReading: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("vital_readings")
      .insert({
        user_id: userId,
        type: data.type,
        recorded_at: data.recordedAt.toISOString(),
        notes: data.notes ?? null,
        systolic: data.systolic ?? null,
        diastolic: data.diastolic ?? null,
        pulse: data.pulse ?? null,
        glucose_value: data.glucoseValue ?? null,
        glucose_unit: data.glucoseUnit ?? null,
        glucose_context: data.glucoseContext ?? null,
        heart_rate_value: data.heartRateValue ?? null,
        temperature_value: data.temperatureValue ?? null,
        temperature_unit: data.temperatureUnit ?? null,
        weight_value: data.weightValue ?? null,
        weight_unit: data.weightUnit ?? null,
        oxygen_saturation_value: data.oxygenSaturationValue ?? null,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[vitals] addReading failed:", error?.message);
      return;
    }
    set((state) => ({ readings: [mapRow(row), ...state.readings] }));
  },

  deleteReading: async (id) => {
    const { error } = await supabase.from("vital_readings").delete().eq("id", id);
    if (error) {
      console.warn("[vitals] deleteReading failed:", error.message);
      return;
    }
    set((state) => ({ readings: state.readings.filter((r) => r.id !== id) }));
  },
}));
