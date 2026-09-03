import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import ModernSwitch from "@/shared/components/switch";
import {
  useNotificationStore,
  CATEGORY_META,
} from "@/features/notifications/hooks/use-notifications-data";

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const settings = useNotificationStore((state) => state.settings);
  const updateSetting = useNotificationStore((state) => state.updateSetting);
  const setAllInSection = useNotificationStore((state) => state.setAllInSection);

  const sections = useMemo(() => {
    const bySection = new Map<string, typeof CATEGORY_META>();
    for (const meta of CATEGORY_META) {
      const list = bySection.get(meta.section) ?? [];
      list.push(meta);
      bySection.set(meta.section, list);
    }
    return Array.from(bySection.entries());
  }, []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Navigation Header Section */}
      <ScreenHeader
        title="Notification Settings"
        subtitle="Choose exactly what you want to hear about, per feature"
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {sections.map(([section, metas]) => {
          const allOn = metas.every((m) => settings[m.category]);
          return (
            <View key={section} className="mb-4.5">
              {/* Feature Batch Selection Controls */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[13px] font-bold uppercase tracking-wider" style={{ color: colors.text }}>
                  {section}
                </Text>
                <Pressable onPress={() => setAllInSection(section, !allOn)}>
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    {allOn ? "Turn all off" : "Turn all on"}
                  </Text>
                </Pressable>
              </View>

              {/* Toggles Container Group Card */}
              <View
                className="rounded-[14px] border overflow-hidden"
                style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
              >
                {metas.map((meta, index) => (
                  <View
                    key={meta.category}
                    className="flex-row items-center p-3.5"
                    style={
                      index > 0 ? { borderTopWidth: 0.5, borderTopColor: colors.border } : undefined
                    }
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>{meta.label}</Text>
                      <Text className="text-[11px] mt-0.5 leading-[15px]" style={{ color: colors.textSecondary }}>
                        {meta.description}
                      </Text>
                    </View>
                    <ModernSwitch
                      value={settings[meta.category]}
                      onValueChange={(value) => updateSetting(meta.category, value)}
                      activeColor={colors.primary}
                      inactiveColor={colors.border}
                    />
                  </View>
                ))}
              </View>
            </View>
          );
        })}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
