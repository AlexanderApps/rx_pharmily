import React from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import { ThemedText } from "@/shared/components/themed-text";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";

type MenuLink = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color?: string;
  onPress: () => void;
};

interface AccountScreenProps {
  avatarUrl?: string | null;
}

export default function AccountScreen({ avatarUrl }: AccountScreenProps) {
  const { colors } = useTheme();
  const { user } = useProfileStore();
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const isAdmin = isAdminRole(profile?.accountRole);

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const pressedOverlay =
    colors.text === "#ffffff"
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(0, 0, 0, 0.03)";

  const menuSections: { title: string; links: MenuLink[] }[] = [
    {
      title: "Profiles",
      links: [
        {
          id: "profiles",
          label: "My Profiles",
          icon: "card-account-details-outline",
          onPress: () => router.push("/profile"),
        },
      ],
    },
    {
      title: "System",
      links: isAdmin
        ? [
            {
              id: "admin",
              label: "Admin",
              icon: "shield-crown-outline",
              onPress: () => router.push("/admin"),
            },
          ]
        : [],
    },
    {
      title: "Activity & Settings",
      links: [
        {
          id: "history",
          label: "History",
          icon: "history",
          onPress: () => router.push("/history"),
        },
        {
          id: "settings",
          label: "Settings",
          icon: "cog-outline",
          onPress: () => router.push("/settings"),
        },
      ],
    },
    {
      title: "Help & Legal",
      links: [
        {
          id: "support",
          label: "Help & Support",
          icon: "help-circle-outline",
          onPress: () => {},
        },
        {
          id: "info",
          label: "Information & Terms",
          icon: "information-outline",
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Custom Header */}
        <ThemedView
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.backgroundSecondary,
          }}
        >
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            Account
          </ThemedText>

          <ThemedText
            style={{
              // color: colors.textSecondarySecondary,
              marginTop: 4,
            }}
          >
            Manage your history and settings
          </ThemedText>
        </ThemedView>
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Block */}
          <Pressable
            onPress={() => router.push("/profile/user-profile")}
            style={[
              styles.profileCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View style={styles.avatarContainer}>
              {/* 2. Conditional Image / Dynamic Icon Placeholder Node Matrix 👇 */}
              {avatarUrl ? (
                <LoadingImage source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={44}
                    color={colors.textSecondary}
                  />
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.avatarEditButton,
                  {
                    backgroundColor: colors.text,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={14}
                  color={colors.backgroundSecondary}
                />
              </Pressable>
            </View>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user.fullName}
            </Text>
            <Text
              style={[styles.profileEmail, { color: colors.textSecondary }]}
            >
              {user.email}
            </Text>
          </Pressable>

          {/* Navigation Sections */}
          {menuSections
            .filter((section) => section.links.length > 0)
            .map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                {section.title}
              </Text>

              <View
                style={[
                  styles.linksWrapper,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                {section.links.map((link, index) => {
                  const isLast = index === section.links.length - 1;
                  const itemTextColor = link.color || colors.text;
                  const iconColor = link.color || colors.textSecondary;

                  return (
                    <Pressable
                      key={link.id}
                      onPress={link.onPress}
                      style={({ pressed }) => [
                        styles.linkItem,
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
                      <View style={styles.linkLeftContent}>
                        <MaterialCommunityIcons
                          name={link.icon}
                          size={22}
                          color={iconColor}
                        />
                        <Text
                          style={[styles.linkText, { color: itemTextColor }]}
                        >
                          {link.label}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={link.color ? link.color : colors.border}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Pressable
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.error },
            ]}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
          </Pressable>

          {/* App Version Stamp */}
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version 1.0.4 (Production)
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
    borderRadius: 16,
    width: "100%",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 14,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    // elevation: 4,
    // shadowColor: "#000",
    // shadowOpacity: 0.15,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: "500",
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
  linksWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  linkLeftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: "700" },
  versionText: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 8,
  },
});
