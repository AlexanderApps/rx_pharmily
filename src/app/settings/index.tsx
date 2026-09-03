import React, { useRef, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import BottomSheet, { BottomSheetModalHandle } from "@/shared/components/bottom-sheet";

type SettingRow = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  valueText?: string;
  onPress: () => void;
};

export default function SettingsScreen() {
  // This is a route screen (app/settings/index.tsx) — Expo Router
  // renders it with no props, so the currentTheme/onThemeChange props
  // this component used to declare were always undefined at runtime.
  // Read the real theme state directly, same as every other screen in
  // this app does.
  const { colors, themeMode, setThemeMode } = useTheme();

  const filterModalRef = useRef<BottomSheetModalHandle>(null);
  const snapPoints = useMemo(() => ["30%"], []);

  // Compute uniform platform active tints natively via string combinations
  const activeBg =
    colors.text === "#ffffff" ? "active:bg-white/5" : "active:bg-black/3";

  const themeLabels = {
    light: "Light Mode",
    dark: "Dark Mode",
  };

  const settingsGroups: { title: string; rows: SettingRow[] }[] = [
    {
      title: "Account Settings",
      rows: [
        {
          id: "personal_info",
          label: "Personal Information",
          icon: "account-card-outline",
          onPress: () => router.push("/settings/personal-info"),
        },
        {
          id: "notifications",
          label: "Notification Settings",
          icon: "bell-cog-outline",
          onPress: () => router.push("/notifications/settings"),
        },
      ],
    },
    {
      title: "Customization & Security",
      rows: [
        {
          id: "appearance",
          label: "Appearance",
          icon: "palette-outline",
          valueText: themeLabels[themeMode],
          onPress: () => filterModalRef.current?.expand(),
        },
        {
          id: "security",
          label: "Security & Privacy",
          icon: "shield-lock-outline",
          onPress: () => router.push("/settings/security"),
        },
      ],
    },
  ];

  return (
    <ThemedView className="flex-1">
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header Bar */}
        <View className="flex-row items-center px-4 py-3">
          {Platform.OS !== "web" && (
          <Pressable
            onPress={() => router.back()}
            className="p-1 mr-3 active:opacity-70"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </Pressable>
          )}
          <Text
            className="text-[20px] font-semibold"
            style={{ color: colors.text }}
          >
            Settings
          </Text>
        </View>

        {/* Scrollable Container */}
        <ScrollView
          contentContainerClassName="px-4 pt-4 pb-10 gap-6"
          showsVerticalScrollIndicator={false}
        >
          {settingsGroups.map((group) => (
            <View key={group.title} className="gap-2">
              <Text
                className="text-[12px] font-semibold uppercase tracking-[0.6px] pl-1"
                style={{ color: colors.textSecondary }}
              >
                {group.title}
              </Text>

              <View
                className="rounded-[16px] overflow-hidden"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                {group.rows.map((row, index) => {
                  const isLast = index === group.rows.length - 1;
                  return (
                    <Pressable
                      key={row.id}
                      onPress={row.onPress}
                      className={`flex-row items-center justify-between px-4 py-[15px] min-h-[56px] ${activeBg}`}
                      style={
                        !isLast
                          ? {
                              borderBottomColor: colors.border,
                              borderBottomWidth: 0.5,
                            }
                          : undefined
                      }
                    >
                      <View className="flex-row items-center gap-3.5 flex-1">
                        <MaterialCommunityIcons
                          name={row.icon}
                          size={22}
                          color={colors.textSecondary}
                        />
                        <Text
                          className="text-[15px] font-medium"
                          style={{ color: colors.text }}
                        >
                          {row.label}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1">
                        {row.valueText && (
                          <Text
                            className="text-[14px] font-normal"
                            style={{ color: colors.textSecondary }}
                          >
                            {row.valueText}
                          </Text>
                        )}
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={colors.border}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Sheet Context Window */}
        <BottomSheet
          ref={filterModalRef}
          snapPoints={snapPoints}
          showHandle={false}
          cornerRadius={16}
          padding={20}
          enablePanDownToClose
          onChange={() => {}}
          backgroundColor={colors.backgroundSecondary}
        >
          <ThemedView type="backgroundSecondary">
            <Text
              className="text-[18px] font-bold mb-4 pl-1"
              style={{ color: colors.text }}
            >
              Choose Theme
            </Text>

            <View className="gap-1">
              {(["light", "dark"] as const).map((mode) => {
                const isSelected = themeMode === mode;
                const icons = {
                  light: "white-balance-sunny",
                  dark: "weather-night",
                };
                return (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setThemeMode(mode);
                      filterModalRef.current?.dismiss();
                    }}
                    className={`flex-row items-center justify-between py-3.5 px-3 rounded-[12px] ${activeBg}`}
                  >
                    <View className="flex-row items-center gap-3.5 flex-1">
                      <MaterialCommunityIcons
                        name={icons[mode] as any}
                        size={22}
                        color={isSelected ? colors.text : colors.textSecondary}
                      />
                      <Text
                        className="text-[16px]"
                        style={{
                          color: colors.text,
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {themeLabels[mode]}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={22}
                        color={colors.text}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>
        </BottomSheet>
      </SafeAreaView>
    </ThemedView>
  );
}
