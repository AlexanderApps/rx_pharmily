import { useState, useEffect } from "react";
import { Platform, useWindowDimensions } from "react-native";

// Named tiers instead of ad hoc pixel checks scattered per screen — every
// other width-sensitive decision in the web-native plan (the max-width
// wrapper, the multi-column grid, when a screen's own mobile-style
// titlebar gets dropped in favor of a page-style header) should read
// from this same scale, not re-derive its own width logic.
//
// compact — phone width, or a narrow/split-screen browser window. Gets
//   the existing native-style single-column layout.
// regular — a typical laptop window. The primary target for the
//   max-width wrapper and a 2-column grid.
// wide    — a large/external monitor. Room for a 3-column grid before
//   things start feeling sparse rather than dense.
//
// These pixel values are a placeholder, not a final decision — the plan
// doc calls this out explicitly: worth revisiting once there's an actual
// max-width wrapper and grid rendered on screen at a few real widths,
// rather than guessed from first principles. Treat BREAKPOINTS as the
// one place to tune later, not something to duplicate elsewhere.
export const BREAKPOINTS = {
  compact: 0,
  regular: 768,
  wide: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

function resolveBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wide) return "wide";
  if (width >= BREAKPOINTS.regular) return "regular";
  return "compact";
}

// On web, the first client render can briefly disagree with whatever the
// initial/server-rendered pass assumed (see use-color-scheme.web.ts for
// the same precaution applied to color scheme) — hasHydrated defers to a
// stable "compact" default until after mount, then switches to the real
// measured width. Native has no such concern (there's no server-rendered
// pass to mismatch against), so it skips the guard entirely and returns
// the live value immediately.
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  const [hasHydrated, setHasHydrated] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS === "web") setHasHydrated(true);
  }, []);

  if (!hasHydrated) return "compact";
  return resolveBreakpoint(width);
}

// Raw width, for the rare case a component needs an actual number rather
// than a named tier — e.g. computing an exact FlatList numColumns count,
// or a max-width wrapper clamping to "90% of viewport, up to 1100px."
// Same hydration guard as useBreakpoint, for the same reason — and the
// same fallback tier: 0 resolves to "compact" via resolveBreakpoint,
// same as useBreakpoint's own pre-hydration default, so a component
// using both hooks together never sees them briefly disagree.
export function useViewportWidth(): number {
  const { width } = useWindowDimensions();
  const [hasHydrated, setHasHydrated] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS === "web") setHasHydrated(true);
  }, []);

  if (!hasHydrated) return 0;
  return width;
}
