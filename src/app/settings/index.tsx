import React, { useState, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
// Import your custom BottomSheet component here
import BottomSheet from "@/shared/components/bottom-sheet";

interface SettingsScreenProps {
  currentTheme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

type SettingRow = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  valueText?: string;
  onPress: () => void;
};

export default function SettingsScreen({
  currentTheme,
  onThemeChange,
}: SettingsScreenProps) {
  const { colors, setThemeMode } = useTheme();

  const changeTheme = (theme: "light" | "dark" | "system") => {
    // onThemeChange(theme);
    setThemeMode(theme === "system" ? "light" : theme);
  };

  // 1. Setup the reference and layout snap points for your custom sheet
  const filterModalRef = useRef<any>(null);
  const snapPoints = useMemo(() => ["35%"], []);

  const pressedOverlay =
    colors.text === "#ffffff"
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(0, 0, 0, 0.03)";

  const themeLabels = {
    light: "Light Mode",
    dark: "Dark Mode",
    system: "System Default",
  };

  const handleClearCache = async () => {
    const ok = await confirm({
      title: "Clear Cache",
      message: "Are you sure you want to clear local app cache? This frees up storage space.",
      confirmLabel: "Clear",
      destructive: true,
    });
    if (!ok) return;
    toast.success("Cache cleared.");
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
          onPress: () => router.push("/settings/notifications"),
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
          valueText: themeLabels[currentTheme],
          // 2. Present the bottom sheet using its reference interface
          onPress: () =>
            filterModalRef.current?.expand?.() ||
            filterModalRef.current?.present?.(),
        },
        {
          id: "security",
          label: "Security & Privacy",
          icon: "shield-lock-outline",
          onPress: () => router.push("/settings/security"),
        },
      ],
    },
    {
      title: "System Utilities",
      rows: [
        {
          id: "cache",
          label: "Clear Local Cache",
          icon: "cached",
          onPress: handleClearCache,
        },
      ],
    },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Settings
          </Text>
        </View>

        {/* Main Settings List */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {settingsGroups.map((group) => (
            <View key={group.title} style={styles.sectionContainer}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                {group.title}
              </Text>
              <View
                style={[
                  styles.cardWrapper,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                {group.rows.map((row, index) => {
                  const isLast = index === group.rows.length - 1;

                  return (
                    <Pressable
                      key={row.id}
                      onPress={row.onPress}
                      style={({ pressed }) => [
                        styles.rowItem,
                        {
                          backgroundColor: pressed
                            ? pressedOverlay
                            : "transparent",
                        },
                        !isLast && {
                          borderBottomColor: colors.border,
                          borderBottomWidth: 0.5,
                        },
                      ]}
                    >
                      <View style={styles.rowLeft}>
                        <MaterialCommunityIcons
                          name={row.icon}
                          size={22}
                          color={colors.textSecondary}
                        />
                        <Text style={[styles.rowText, { color: colors.text }]}>
                          {row.label}
                        </Text>
                      </View>

                      <View style={styles.rowRight}>
                        {row.valueText && (
                          <Text
                            style={[
                              styles.valueText,
                              { color: colors.textSecondary },
                            ]}
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

        {/* Your Custom Bottom Sheet Integration */}
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
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Choose Theme
            </Text>

            <View style={styles.sheetOptionsContainer}>
              {(["light", "dark", "system"] as const).map((mode) => {
                const isSelected = currentTheme === mode;
                const icons = {
                  light: "white-balance-sunny",
                  dark: "weather-night",
                  system: "cellphone-cog",
                };

                return (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      // onThemeChange(mode);
                      changeTheme(mode);
                      // 3. Dismiss sheet safely upon selecting an alternative look layout
                      filterModalRef.current?.close?.() ||
                        filterModalRef.current?.dismiss?.();
                    }}
                    style={({ pressed }) => [
                      styles.sheetOptionRow,
                      {
                        backgroundColor: pressed
                          ? pressedOverlay
                          : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <MaterialCommunityIcons
                        name={icons[mode] as any}
                        size={22}
                        color={isSelected ? colors.text : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.sheetOptionText,
                          {
                            color: colors.text,
                            fontWeight: isSelected ? "600" : "400",
                          },
                        ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingLeft: 4,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowText: {
    fontSize: 15,
    fontWeight: "500",
  },
  valueText: {
    fontSize: 14,
    fontWeight: "400",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingLeft: 4,
  },
  sheetOptionsContainer: {
    gap: 4,
  },
  sheetOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sheetOptionText: {
    fontSize: 16,
  },
});
