import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  // The user's actual preference — "system" is a real, persisted choice
  // here, not just a fallback computed elsewhere. Resolving "system" to
  // an actual light/dark value happens in useTheme (shared/hooks/
  // use-theme.ts), which combines this with the live OS scheme; this
  // store only ever holds what the person picked.
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// AsyncStorage is already a proven cross-platform dependency in this
// project (lib/supabase.ts uses it for session persistence on both web
// and native), so reusing it here needs no new package.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // "system" by default — respects the OS unless the person
      // explicitly overrides it, which is the more considerate default
      // for someone who's never touched this setting at all.
      themeMode: "system",
      setThemeMode: (mode) => set({ themeMode: mode }),
      // Not currently called from any screen (grepped for every
      // consumer before touching this) — kept simple rather than
      // over-engineered for a caller that doesn't exist yet: cycles
      // dark -> light, anything else -> dark.
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "rxpharmily-theme",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
