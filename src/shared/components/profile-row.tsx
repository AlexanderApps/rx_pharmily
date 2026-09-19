import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

// A card-row design: an uppercase, small label above a base-size
// value, inside a rounded card shared by every row in its section.
// Always shows the divider rather than computing which row is
// actually last — several fields across the 3 profile screens that
// use this (user, facility, organization) are conditionally hidden
// per-viewer via canSee(), so "is this the last visible row" would
// need real bookkeeping for a cosmetic difference (one extra hairline
// at a card's bottom edge) that's not worth that complexity.
export function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View className="px-4 py-3.5" style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}>
      <Text className="text-xs font-medium uppercase mb-1 tracking-[0.3px]" style={{ color: colors.textSecondary }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View className="mt-5">
      <Text className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]" style={{ color: colors.textSecondary }}>
        {title}
      </Text>
      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundSecondary }}>
        {children}
      </View>
    </View>
  );
}

// The value style every row's display (non-editing) content uses.
export const PROFILE_VALUE_TEXT_CLASS = "text-base font-normal leading-[22px]";
