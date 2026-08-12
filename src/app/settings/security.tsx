import React, { useState } from "react";
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
            Security Settings
          </Text>
        </View>

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Device Authentication */}
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Access & Authentication
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* Biometric Toggle Row */}
              <Pressable
                onPress={() => setBiometricsEnabled(!biometricsEnabled)}
                style={({ pressed }) => [
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Biometric Sign-In
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
                style={({ pressed }) => [
                  styles.rowItem,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="shield-account-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Two-Factor Auth (2FA)
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Credentials
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* Change Password Link */}
              <Pressable
                onPress={() => console.log("Navigate to Change Password")}
                style={({ pressed }) => [
                  styles.rowItem,
                  { borderBottomColor: colors.border, borderBottomWidth: 0.5 },
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      Change Password
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
                style={({ pressed }) => [
                  styles.rowItem,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="numeric"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text style={[styles.rowText, { color: colors.text }]}>
                      App Lock PIN
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
          <View style={styles.sectionContainer}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              Active Sessions
            </Text>
            <View
              style={[
                styles.cardWrapper,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            >
              {/* Force Sign-Out Action */}
              <Pressable
                onPress={handleTerminateSessions}
                style={({ pressed }) => [
                  styles.rowItem,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowLeft}>
                  <MaterialCommunityIcons
                    name="logout-variant"
                    size={22}
                    color="#C5221F"
                  />
                  <View style={styles.textMetaWrapper}>
                    <Text
                      style={[
                        styles.rowText,
                        { color: "#C5221F", fontWeight: "600" },
                      ]}
                    >
                      Log Out Other Devices
                    </Text>
                    <Text
                      style={[
                        styles.descriptionText,
                        { color: colors.textSecondary },
                      ]}
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
    marginTop: 24,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  textMetaWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 13,
  },
});
