import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface AppSettingsStore {
  showUserTitleInBrackets: boolean;
  hasFetched: boolean;
  fetchAppSettings: () => Promise<void>;
  // Superadmin-only in practice — RLS enforces this regardless of what
  // calls it, this isn't itself a permission check.
  updateSetting: (key: string, value: boolean) => Promise<boolean>;
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  showUserTitleInBrackets: false,
  hasFetched: false,

  fetchAppSettings: async () => {
    const { data, error } = await supabase.from("app_settings").select("key, value");
    if (error) {
      console.warn("[app-settings] fetchAppSettings failed:", error.message);
      set({ hasFetched: true });
      return;
    }
    const row = (data ?? []).find((r) => r.key === "show_user_title_in_brackets");
    set({ showUserTitleInBrackets: row?.value === true, hasFetched: true });
  },

  updateSetting: async (key, value) => {
    const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
    if (error) {
      console.warn(`[app-settings] updateSetting(${key}) failed:`, error.message);
      return false;
    }
    if (key === "show_user_title_in_brackets") {
      set({ showUserTitleInBrackets: value });
    }
    return true;
  },
}));
