import React from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";

export default function PersonalInfoScreen() {
  const { colors } = useTheme();

  // Simulated profile data placeholder
  const profile = {
    name: "Dr. Alex Mercer",
    email: "alex.mercer@clinic.org",
    username: "alexmercer_md",
    profession: "Specialist Cardiologist",
    licenseNumber: "LIC-88392-NY",
    facilities: "Metro General Hospital, Oakridge Clinic",
    kycStatus: "Verified", // Options: "Verified", "Pending", "Rejected"
  };

  // Helper helper to resolve verification badge colors
  const getKycBadgeStyles = (status: string) => {
    switch (status) {
      case "Verified":
        return { bg: "#E6F4EA", text: "#137333", icon: "check-circle" };
      case "Pending":
        return { bg: "#FEF7E0", text: "#B06000", icon: "clock-outline" };
      default:
        return { bg: "#FCE8E6", text: "#C5221F", icon: "alert-circle" };
    }
  };

  const kyc = getKycBadgeStyles(profile.kycStatus);

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
            Personal Information
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* KYC Status Banner Card */}
          <View className="mt-4">
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center flex-1 mr-3">
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={24}
                    color={colors.text}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium" style={{ color: colors.text }}>
                      Identity Verification
                    </Text>
                    <Text
                      className="text-[13px] mt-0.5"
                      style={{ color: colors.textSecondary }}
                    >
                      KYC compliance data status
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center px-2.5 py-1.5 rounded-xl" style={{ backgroundColor: kyc.bg }}>
                  <MaterialCommunityIcons
                    name={
                      kyc.icon as React.ComponentProps<
                        typeof MaterialCommunityIcons
                      >["name"]
                    }
                    size={14}
                    color={kyc.text}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-xs font-semibold" style={{ color: kyc.text }}>
                    {profile.kycStatus}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 1: Personal Details */}
          <View className="mt-5">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Personal Details
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Full Name */}
              <View
                className="px-4 py-3.5"
                style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}
              >
                <View className="flex-col">
                  <Text
                    className="text-xs font-medium uppercase mb-1 tracking-[0.3px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Full Name
                  </Text>
                  <Text className="text-base font-normal leading-[22px]" style={{ color: colors.text }}>
                    {profile.name}
                  </Text>
                </View>
              </View>

              {/* Username */}
              <View
                className="px-4 py-3.5"
                style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}
              >
                <View className="flex-col">
                  <Text
                    className="text-xs font-medium uppercase mb-1 tracking-[0.3px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Username
                  </Text>
                  <Text className="text-base font-normal leading-[22px]" style={{ color: colors.text }}>
                    @{profile.username}
                  </Text>
                </View>
              </View>

              {/* Email Address */}
              <View className="px-4 py-3.5">
                <View className="flex-col">
                  <Text
                    className="text-xs font-medium uppercase mb-1 tracking-[0.3px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Email Address
                  </Text>
                  <Text className="text-base font-normal leading-[22px]" style={{ color: colors.text }}>
                    {profile.email}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: Professional Details */}
          <View className="mt-5">
            <Text
              className="text-[13px] font-semibold uppercase mb-2 ml-1 tracking-[0.5px]"
              style={{ color: colors.textSecondary }}
            >
              Employment & Assignment
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Profession */}
              <View
                className="px-4 py-3.5"
                style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}
              >
                <View className="flex-col">
                  <Text
                    className="text-xs font-medium uppercase mb-1 tracking-[0.3px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Profession
                  </Text>
                  <Text className="text-base font-normal leading-[22px]" style={{ color: colors.text }}>
                    {profile.profession}
                  </Text>
                </View>
              </View>

              {/* License Number */}
              <View
                className="px-4 py-3.5"
                style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}
              >
                <View className="flex-col">
                  <Text
                    className="text-xs font-medium uppercase mb-1 tracking-[0.3px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Medical License Number
                  </Text>
                  <Text className="text-base font-normal leading-[22px]" style={{ color: colors.text }}>
                    {profile.licenseNumber}
                  </Text>
                </View>
              </View>

              {/* Affiliated Facilities */}
              <View className="px-4 py-3.5">
                <View className="flex-col">
                  <Text
                    className="text-xs font-medium uppercase mb-1 tracking-[0.3px]"
                    style={{ color: colors.textSecondary }}
                  >
                    Assigned Facilities
                  </Text>
                  <Text className="text-base font-normal leading-[22px]" style={{ color: colors.text }}>
                    {profile.facilities}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Edit Profile Callout Button */}
          <Pressable
            className="flex-row items-center justify-center mt-8 py-3.5 rounded-xl"
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={20}
              color={colors.background}
            />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.background }}>
              Request Information Update
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
