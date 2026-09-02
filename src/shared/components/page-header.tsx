import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

interface PageHeaderProps {
  title: string;
  // The description the mobile titlebar used to carry — a facility
  // name, a status summary, a count, whatever that screen's subtitle
  // Text held. Preserved here rather than dropped, per the explicit
  // requirement this component exists to satisfy.
  subtitle?: string;
  // Defaults to router.back() — only needs overriding when a screen's
  // "back" should go somewhere more specific than history-back (rare;
  // most screens won't pass this).
  onBack?: () => void;
  // Screen-specific controls that used to live in the old mobile
  // header's row (a MoreMenu, a share button, etc). WebTopBar already
  // owns the persistent search/notifications — this is only for
  // whatever a specific screen needs beyond that.
  actions?: React.ReactNode;
}

// Renders below WebTopBar (see web-app-shell.tsx) — the persistent
// search/notification bar stays there; this is what identifies which
// specific screen the user is on, replacing the mobile back-arrow +
// centered-title pattern with something that reads as a page header on
// a desktop rather than a resized phone screen. A text back-link plus a
// left-aligned title/subtitle is deliberately the shape here, not
// another icon-only affordance — see the app's own reasoning on this:
// the browser's native back button and the sidebar are both already
// available regardless, so this is a discoverable in-page option, not
// the only way back.
//
// Screens render this ALONGSIDE their existing mobile header (guarded
// by Platform.OS), not as a replacement for it — the native path stays
// completely untouched, matching every other item in this plan.
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, onBack, actions }) => {
  const { colors } = useTheme();
  const handleBack = onBack ?? (() => router.back());

  return (
    <View
      className="flex-row items-center justify-between gap-4 px-6 py-4 border-b"
      style={{ borderBottomColor: colors.border }}
    >
      <View className="flex-1 gap-1">
        <Pressable
          onPress={handleBack}
          className="flex-row items-center gap-1 self-start cursor-pointer hover:opacity-70"
          hitSlop={8}
        >
          <MaterialCommunityIcons name="arrow-left" size={14} color={colors.textSecondary} />
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary, ...noSelectStyle }}>
            Back
          </Text>
        </Pressable>
        <Text className="text-xl font-bold" style={{ color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {actions && <View className="flex-row items-center gap-2">{actions}</View>}
    </View>
  );
};

export default PageHeader;
