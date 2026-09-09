/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/shared/constants/theme";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { useThemeStore } from "./use-theme-store";

export function useTheme() {
  // useColorScheme() returns "light" | "dark" | null — it never
  // returns the string "unspecified" (that's an Android-native
  // configuration concept, not what this JS-level hook actually
  // returns), so `scheme ?? "light"` below is the correct null guard,
  // not a string comparison that could never match.
  const scheme = useColorScheme();
  const { themeMode, setThemeMode, toggleTheme } = useThemeStore();

  // "system" resolves live to whatever the OS is currently reporting,
  // recomputed on every render — no stored/synced copy to go stale.
  // An explicit light/dark pick is never overridden by the OS scheme;
  // this replaces a previous effect that force-synced themeMode to the
  // system scheme on every change regardless of what the person had
  // actually chosen, which made a manual choice get silently discarded
  // the moment the OS scheme changed (or effectively on every render,
  // since the effect's own dependency included the scheme itself).
  const resolvedTheme = themeMode === "system" ? (scheme ?? "light") : themeMode;

  return {
    colors: Colors[resolvedTheme],
    // The user's actual preference, including "system" itself — this
    // is what the appearance picker in settings should show as
    // selected, not resolvedTheme (which would make "system" appear to
    // silently become "light" or "dark" in that UI).
    themeMode,
    // The concrete light/dark currently in effect — useful for any
    // consumer that needs the resolved value specifically rather than
    // the preference (e.g. picking a status-bar style).
    resolvedTheme,
    setThemeMode,
    toggleTheme,
  };
}
