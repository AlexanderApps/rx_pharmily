import React from "react";
import { View, StyleSheet, Text, ScrollView, Pressable } from "react-native";
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
            Personal Information
          </Text>
        </View>

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* KYC Status Banner Card */}
          <View style={[styles.sectionContainer, { marginTop: 16 }]}>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              <View style={styles.kycRow}>
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={24}
                    color={colors.text}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Identity Verification
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      KYC compliance data status
                    </Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: kyc.bg }]}>
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
                  <Text style={[styles.badgeText, { color: kyc.text }]}>
                    {profile.kycStatus}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 1: Personal Details */}
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Personal Details
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* Full Name */}
              <View
                style={[
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                ]}
              >
                <View style={styles.infoBlock}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Full Name
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.name}
                  </Text>
                </View>
              </View>

              {/* Username */}
              <View
                style={[
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                ]}
              >
                <View style={styles.infoBlock}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Username
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    @{profile.username}
                  </Text>
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.rowItem}>
                <View style={styles.infoBlock}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Email Address
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.email}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECTION 2: Professional Details */}
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Employment & Assignment
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* Profession */}
              <View
                style={[
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                ]}
              >
                <View style={styles.infoBlock}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Profession
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.profession}
                  </Text>
                </View>
              </View>

              {/* License Number */}
              <View
                style={[
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                ]}
              >
                <View style={styles.infoBlock}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Medical License Number
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.licenseNumber}
                  </Text>
                </View>
              </View>

              {/* Affiliated Facilities */}
              <View style={styles.rowItem}>
                <View style={styles.infoBlock}>
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Assigned Facilities
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {profile.facilities}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Edit Profile Callout Button */}
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9 },
            ]}
          >
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={20}
              color={colors.background}
            />
            <Text style={[styles.editButtonText, { color: colors.background }]}>
              Request Information Update
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  cardWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  rowItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  kycRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  textMetaWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoBlock: {
    flexDirection: "column",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
