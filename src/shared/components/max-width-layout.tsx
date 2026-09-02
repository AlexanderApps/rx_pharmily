import React from "react";
import { View, Platform, StyleProp, ViewStyle } from "react-native";

// Distinct from useBreakpoint's compact/regular/wide (shared/hooks/
// use-breakpoint.ts) — that scale describes how wide the *viewport* is;
// this one describes how wide a given screen's *content* should be
// allowed to get, which is a per-screen design choice, not a viewport
// measurement. A "wide" viewport can still contain a "narrow" form.
//
// narrow    — forms and single-column reading. 720px matches the RFQ
//   form redesign built earlier this session, kept as the reference
//   value for anything in this tier.
// standard  — most detail/browse screens.
// wide      — dashboard- or table-like content that genuinely benefits
//   from more horizontal room.
//
// Values are a starting point, not final — same caveat as
// useBreakpoint's own BREAKPOINTS: worth revisiting once real screens
// are actually rendered inside this at a few real widths.
export const CONTENT_WIDTHS = {
  narrow: 720,
  standard: 1040,
  wide: 1400,
} as const;

export type ContentSize = keyof typeof CONTENT_WIDTHS;

interface MaxWidthLayoutProps {
  size?: ContentSize;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// A no-op passthrough on native — renders children exactly as they'd
// render without this wrapper at all, so a screen can adopt this on its
// web layout without touching (or risking) its native one. web-app-shell
// deliberately leaves individual screens' own width/padding to each
// screen (see its own comment on why) — this is the shared primitive
// screens reach for as they do that, incrementally, rather than each
// screen inventing its own maxWidth/centering.
const MaxWidthLayout: React.FC<MaxWidthLayoutProps> = ({
  size = "standard",
  children,
  style,
}) => {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View
      className="w-full self-center px-6"
      style={[{ maxWidth: CONTENT_WIDTHS[size] }, style]}
    >
      {children}
    </View>
  );
};

export default MaxWidthLayout;
