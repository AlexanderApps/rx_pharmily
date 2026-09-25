import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AppSettingsStore {
  showUserTitleInBrackets: boolean;
  // Fallback window (days from createdAt) for a MediScope request with
  // no submissionDeadline of its own — see the migration that seeds
  // this for the full rationale.
  mediscopeDefaultDeadlineDays: number;
  hasFetched: boolean;
  fetchAppSettings: () => Promise<void>;
  // Superadmin-only in practice — RLS enforces this regardless of what
  // calls it, this isn't itself a permission check.
  updateSetting: (key: string, value: boolean | number) => Promise<boolean>;
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  showUserTitleInBrackets: false,
  mediscopeDefaultDeadlineDays: 30,
  hasFetched: false,

  fetchAppSettings: async () => {
    const { data, error } = await supabase.from("app_settings").select("key, value");
    if (error) {
      console.warn("[app-settings] fetchAppSettings failed:", error.message);
      set({ hasFetched: true });
      return;
    }
    const titleRow = (data ?? []).find((r) => r.key === "show_user_title_in_brackets");
    const deadlineRow = (data ?? []).find((r) => r.key === "mediscope_default_deadline_days");
    set({
      showUserTitleInBrackets: titleRow?.value === true,
      // Falls back to the same 30 the migration seeds if the row is
      // somehow missing (e.g. a fetch that races an in-progress
      // migration) — this is a display/filtering default, not
      // security-sensitive, so failing open to a sane number beats
      // failing to 0 (which would hide every undated request).
      mediscopeDefaultDeadlineDays:
        typeof deadlineRow?.value === "number" ? deadlineRow.value : 30,
      hasFetched: true,
    });
  },

  updateSetting: async (key, value) => {
    const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
    if (error) {
      console.warn(`[app-settings] updateSetting(${key}) failed:`, error.message);
      return false;
    }
    if (key === "show_user_title_in_brackets" && typeof value === "boolean") {
      set({ showUserTitleInBrackets: value });
    } else if (key === "mediscope_default_deadline_days" && typeof value === "number") {
      set({ mediscopeDefaultDeadlineDays: value });
    }
    return true;
  },
}));
