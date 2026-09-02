import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  // Defaults to router.back() — override only when a screen's back
  // action needs to go somewhere more specific than history-back.
  onBack?: () => void;
  // Slot for whatever a specific screen needs beyond back+title — an
  // edit button, a "+" add button, a print button, several of the
  // above. Rendered as-is, right-aligned.
  actions?: React.ReactNode;
  // A handful of profile screens center the title instead of
  // left-aligning it, and never pair it with a subtitle. Replicates
  // that exact existing markup (a single flex-1 + text-center Text, no
  // wrapping View) rather than approximating it — this is still a pure
  // extraction of what was already there, just a second variant of it.
  centered?: boolean;
  // Modal-style forms (e.g. a single "record a reading" screen entered
  // and exited as a self-contained action, not a drill-down) use a
  // "close" (X) icon instead of "arrow-left" — a real semantic
  // difference (dismiss vs. go back), not inconsistency, so it's a
  // prop rather than something normalized away.
  backIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

// Consolidates the mobile-style header pattern that was duplicated
// inline across ~35 screens (back-arrow icon, gated off on web per the
// earlier "remove back router from web" work + title/subtitle +
// optional actions). Same exact visual behavior as what's currently
// hand-rolled everywhere — this is a pure extraction, not a redesign.
//
// Deliberately shares its props shape (title/subtitle/onBack/actions)
// with shared/components/page-header.tsx, the earlier web-specific
// titlebar redesign that's currently unused (its rollout was reverted
// "for now"). That alignment is intentional: when web customization
// resumes, a screen-header.web.tsx can reuse PageHeader's existing
// design almost verbatim as this component's web variant, rather than
// needing a bespoke .web.tsx written from scratch per screen.
const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  centered,
  backIcon = "arrow-left",
}) => {
  const { colors } = useTheme();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      className="flex-row items-center gap-2 px-3 py-3 border-b"
      style={{ borderBottomColor: colors.border }}
    >
      {Platform.OS !== "web" && (
        <Pressable onPress={handleBack} className="p-1.5">
          <MaterialCommunityIcons name={backIcon} size={22} color={colors.text} />
        </Pressable>
      )}
      {centered ? (
        <Text
          className="text-base font-bold flex-1 text-center"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : (
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: colors.text }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {actions && <View className="flex-row items-center gap-2">{actions}</View>}
    </View>
  );
};

export default ScreenHeader;
