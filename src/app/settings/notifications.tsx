import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ModernSwitch from "@/shared/components/switch";

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();

  // Delivery Channel Channels State
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Notification Categories State
  const [generalNotifs, setGeneralNotifs] = useState(true);
  const [donationNotifs, setDonationNotifs] = useState(true);
  const [rfqNotifs, setRfqNotifs] = useState(false);
  const [jobNotifs, setJobNotifs] = useState(true);

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
            Notifications
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Delivery Channels */}
          <View className="mt-6">
            <Text
              className="text-sm font-semibold uppercase mb-2 ml-1"
              style={{ color: colors.textSecondary }}
            >
              Delivery Channels
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Push Notifications Toggle Row */}
              <Pressable
                onPress={() => setPushEnabled(!pushEnabled)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => ({
                  borderBottomColor: colors.border,
                  borderBottomWidth: 0.5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Push Notifications
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Receive instant alerts on your device
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>

              {/* Email Notifications Toggle Row */}
              <Pressable
                onPress={() => setEmailEnabled(!emailEnabled)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Email Digests
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Get activity summaries sent to your inbox
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>
            </View>
          </View>

          {/* SECTION 2: Notification Categories */}
          <View className="mt-6">
            <Text
              className="text-sm font-semibold uppercase mb-2 ml-1"
              style={{ color: colors.textSecondary }}
            >
              Activity & Preferences
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* General System Updates Row */}
              <Pressable
                onPress={() => setGeneralNotifs(!generalNotifs)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => ({
                  borderBottomColor: colors.border,
                  borderBottomWidth: 0.5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="cog-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      General Updates
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      App announcements and profile changes
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={generalNotifs}
                  onValueChange={setGeneralNotifs}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>

              {/* RFQs & Quotes Row */}
              <Pressable
                onPress={() => setRfqNotifs(!rfqNotifs)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => ({
                  borderBottomColor: colors.border,
                  borderBottomWidth: 0.5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      RFQs & Estimates
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Updates on requested quotes and pricing
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={rfqNotifs}
                  onValueChange={setRfqNotifs}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>

              {/* Jobs Toggles Row */}
              <Pressable
                onPress={() => setJobNotifs(!jobNotifs)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => ({
                  borderBottomColor: colors.border,
                  borderBottomWidth: 0.5,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Job Statuses
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Alerts when your contract milestones shift
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={jobNotifs}
                  onValueChange={setJobNotifs}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>

              {/* Donations Toggles Row */}
              <Pressable
                onPress={() => setDonationNotifs(!donationNotifs)}
                className="flex-row items-center justify-between p-4"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium mb-0.5" style={{ color: colors.text }}>
                      Donations & Receipts
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: colors.textSecondary }}
                    >
                      Payment confirmations and impact metrics
                    </Text>
                  </View>
                </View>
                <ModernSwitch
                  value={donationNotifs}
                  onValueChange={setDonationNotifs}
                  inactiveColor={colors.border}
                  activeColor={colors.secondary}
                />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
