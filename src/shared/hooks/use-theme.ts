/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useEffect } from "react";
import { Colors } from "@/shared/constants/theme";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";
import { useThemeStore } from "./use-theme-store"; // Adjust path as needed

export function useTheme() {
  const scheme = useColorScheme();
  const { themeMode, setThemeMode, toggleTheme } = useThemeStore();

  // Sync with system scheme only on initial mount
  useEffect(() => {
    const systemTheme = scheme === "unspecified" ? "light" : scheme;
    setThemeMode(systemTheme);
  }, [scheme, setThemeMode]);

  return {
    colors: Colors[themeMode],
    themeMode,
    setThemeMode,
    toggleTheme,
  };
}
