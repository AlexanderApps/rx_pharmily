/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundSecondary: "#F5F5F7",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    border: "#E0E1E6",
    divider: "#f0f0f0",

    secondary: "#ff8c00", // Clean, warm orange
    secondaryDark: "#e67e00",
    secondaryLight: "#fff5e6",
    // Status colors
    success: "#059669", // Teal green
    warning: "#d97706", // Amber
    error: "#dc2626", // Red
    // Accent colors
    info: "#0066cc", // Same as primary
    icon: "#6b7280", // Medium gray
    tabIconDefault: "#9ca3af",
    tabIconSelected: "#0066cc",
    adaptiveIcon: "#E6F4FE",

    primary: "#0066cc", // Rich, modern blue
    primaryDark: "#0052a3",
    primaryLight: "#e6f2ff",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundSecondary: "#1C1C1E",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    border: "#2E3135",
    divider: "#3f4757",

    // Secondary: Light Orange
    secondary: "#ffb84d", // Softer, warmer orange
    secondaryDark: "#e67e00",
    secondaryLight: "#332211", // Dark for tints

    success: "#10b981", // Teal green
    warning: "#f59e0b", // Amber
    error: "#f87171", // Light red
    info: "#6ba3ff", // Same as primary
    icon: "#d1d5db", // Medium-light gray
    tabIconDefault: "#9ca3af",
    tabIconSelected: "#6ba3ff",
    adaptiveIcon: "#E6F4FE",

    primary: "#6ba3ff", // Light, readable blue
    primaryDark: "#5a92e6",
    primaryLight: "#1a3d7a", // Dark blue for tints
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
