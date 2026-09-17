import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

export type FeedFeatureKind = "rxrfq" | "mediscope" | "donation" | "job";

// Same base colors already established for these 4 features elsewhere
// in the app (the home feed's own shortcut row, the Services screen) —
// reused here rather than inventing a second palette for the same
// features. Used as the text color in both themes, and as the tint
// source for the background below — never rendered as a solid fill,
// which read as too loud against the card.
const FEATURE_META: Record<FeedFeatureKind, { label: string; color: string }> = {
  rxrfq: { label: "RxRFQ", color: "#2563eb" },
  mediscope: { label: "MediScope", color: "#9333ea" },
  donation: { label: "Donation", color: "#dc2626" },
  job: { label: "Job", color: "#16a34a" },
};

// A light tint of the feature color, not a solid fill — same "soft
// badge" pattern already used everywhere else in this app for status
// badges (backgroundColor: statusColor + alpha, text in the full
// color). Dark mode gets a slightly stronger tint than light mode
// (2A vs 1E, roughly 16% vs 12% opacity) — the same low-opacity tint
// that reads clearly against a light card background goes muddy and
// low-contrast against a dark one, so it needs a touch more presence
// there to stay legible without going back to feeling loud.
const TINT_ALPHA = { light: "1E", dark: "2A" };

// Fixed, not measured — a badge whose exact height depends on its own
// content would need onLayout + state just to compute the "half above,
// half within" offset correctly, for a purely decorative label whose
// text never varies in a way that would actually change its height.
const BADGE_HEIGHT = 22;

interface FeedFeatureBadgeProps {
  kind: FeedFeatureKind;
  position?: "left" | "right";
}

// Meant to sit as a sibling of a card's own root View, inside a parent
// that has position: "relative" (or is itself the relatively-positioned
// root) — this only positions itself, it doesn't wrap the card.
const FeedFeatureBadge: React.FC<FeedFeatureBadgeProps> = ({ kind, position = "left" }) => {
  const { resolvedTheme } = useTheme();
  const meta = FEATURE_META[kind];
  const tint = meta.color + TINT_ALPHA[resolvedTheme];

  return (
    <View
      className="absolute px-2.5 rounded-full items-center justify-center z-10"
      style={{
        [position]: 14,
        top: -(BADGE_HEIGHT / 2),
        height: BADGE_HEIGHT,
        backgroundColor: tint,
        borderWidth: 1,
        borderColor: meta.color + (resolvedTheme === "dark" ? "40" : "30"),
      }}
    >
      <Text className="text-[10px] font-bold" style={{ color: meta.color }}>
        {meta.label}
      </Text>
    </View>
  );
};

export default FeedFeatureBadge;
