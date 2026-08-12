import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, Pressable } from "react-native";
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
            Notifications
          </Text>
        </View>

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Delivery Channels */}
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Delivery Channels
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* Push Notifications Toggle Row */}
              <Pressable
                onPress={() => setPushEnabled(!pushEnabled)}
                style={({ pressed }) => [
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Push Notifications
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
                style={({ pressed }) => [
                  styles.rowItem,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Email Digests
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Activity & Preferences
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* General System Updates Row */}
              <Pressable
                onPress={() => setGeneralNotifs(!generalNotifs)}
                style={({ pressed }) => [
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="cog-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      General Updates
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
                style={({ pressed }) => [
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="file-document-edit-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      RFQs & Estimates
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
                style={({ pressed }) => [
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Job Statuses
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
                style={({ pressed }) => [
                  styles.rowItem,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Donations & Receipts
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionContainer: { marginTop: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  cardWrapper: { borderRadius: 12, overflow: "hidden" },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowPressed: { opacity: 0.7 },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  textMetaWrapper: { marginLeft: 12, flex: 1 },
  rowText: { fontSize: 16, fontWeight: "500", marginBottom: 2 },
  descriptionText: { fontSize: 13 },
});
