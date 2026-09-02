import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ModernSwitch from "@/shared/components/switch";

export default function SecurityScreen() {
  const { colors } = useTheme();

  // Security Toggles State
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Handler for session clearing
  const handleTerminateSessions = async () => {
    const ok = await confirm({
      title: "Sign Out Everywhere",
      message: "Are you sure you want to sign out of all other active sessions and devices?",
      confirmLabel: "Sign Out",
      destructive: true,
    });
    if (!ok) return;
    console.log("Other sessions terminated");
    toast.success("Signed out of other sessions.");
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header Row */}
        <View className="flex-row items-center px-4 py-3">
          {Platform.OS !== "web" && (
          <Pressable
            onPress={() => router.back()}
            className="p-1 mr-3"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </Pressable>
          )}
          <Text className="text-xl font-semibold" style={{ color: colors.text }}>
            Security Settings
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Device Authentication */}
          <View className="mt-6">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Access & Authentication
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Biometric Toggle Row */}
              <Pressable
                onPress={() => setBiometricsEnabled(!biometricsEnabled)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => ({
                  borderBottomColor: colors.border,
                  borderBottomWidth: 0.5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Biometric Sign-In
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Use Face ID or Fingerprint scanner
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={biometricsEnabled}
                  onValueChange={setBiometricsEnabled}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>

              {/* Two-Factor Toggle Row */}
              <Pressable
                onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="shield-account-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Two-Factor Auth (2FA)
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Secure account actions via SMS or App
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={twoFactorEnabled}
                  onValueChange={setTwoFactorEnabled}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>
            </View>
          </View>

          {/* SECTION 2: Credentials Management */}
          <View className="mt-6">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Credentials
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Change Password Link */}
              <Pressable
                onPress={() => console.log("Navigate to Change Password")}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => ({
                  borderBottomColor: colors.border,
                  borderBottomWidth: 0.5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Change Password
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Last updated 3 months ago
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>

              {/* Pin Code Setup */}
              <Pressable
                onPress={() => console.log("Navigate to Security PIN")}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="numeric"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      App Lock PIN
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Configure backup 4-digit numeric code
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* SECTION 3: Session Management */}
          <View className="mt-6">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Active Sessions
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Force Sign-Out Action */}
              <Pressable
                onPress={handleTerminateSessions}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="logout-variant"
                    size={22}
                    color="#C5221F"
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-base mb-0.5 font-semibold"
                      style={{ color: "#C5221F" }}
                    >
                      Log Out Other Devices
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Disconnect active tokens on all web/mobile links
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
