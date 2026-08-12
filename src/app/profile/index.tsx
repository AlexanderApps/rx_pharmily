import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";

export default function ProfileHubScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const facilityMemberships = useProfileStore((state) => state.facilityMemberships);
  const organizations = useProfileStore((state) => state.organizations);

  // Derived here (not inside the Zustand selector) — a selector returning a
  // freshly-filtered array every call makes useSyncExternalStore think the
  // store changed on every render, which is an infinite loop.
  const myFacilities = useMemo(() => {
    const myIds = new Set(
      facilityMemberships.filter((m) => m.userId === user.id).map((m) => m.facilityId),
    );
    return facilities.filter((f) => myIds.has(f.id));
  }, [facilities, facilityMemberships, user.id]);

  const myOrganizations = useMemo(
    () => organizations.filter((o) => o.adminUserId === user.id),
    [organizations, user.id],
  );

  const userCard = {
    key: "user",
    title: "My Profile",
    subtitle: user.fullName,
    icon: "account-outline" as const,
    color: "#2563eb",
    kyc: user.kyc.status,
    route: "/profile/user-profile",
  };

  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profiles</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Identity, facility, and organization details
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => router.push(userCard.route as any)}
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: userCard.color + "18" }]}>
              <MaterialCommunityIcons name={userCard.icon} size={24} color={userCard.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{userCard.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {userCard.subtitle}
              </Text>
            </View>
            <KycStatusBadge status={userCard.kyc} compact />
          </Pressable>

          <View style={[styles.sectionHeaderRow, { marginTop: 14, marginBottom: 2 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>
              My Facilities ({myFacilities.length})
            </Text>
            <Pressable onPress={() => router.push("/profile/find-facility")} style={styles.findLink}>
              <MaterialCommunityIcons name="magnify" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>Find a Facility</Text>
            </Pressable>
          </View>
          {myFacilities.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => router.push({ pathname: "/profile/facility-profile", params: { id: f.id } })}
              style={[
                styles.card,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: "#16a34a18" }]}>
                <MaterialCommunityIcons name="hospital-building" size={24} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{f.name}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {f.location}
                </Text>
              </View>
              <KycStatusBadge status={f.kyc.status} compact />
            </Pressable>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Organizations ({myOrganizations.length})
          </Text>
          {myOrganizations.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
              You don't administer any organization yet.
            </Text>
          ) : (
            myOrganizations.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: "/profile/organization-profile", params: { id: o.id } })}
                style={[
                  styles.card,
                  { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: "#9333ea18" }]}>
                  <MaterialCommunityIcons name="domain" size={24} color="#9333ea" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{o.name}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {o.facilityIds.length} facilit{o.facilityIds.length === 1 ? "y" : "ies"}
                  </Text>
                </View>
                <KycStatusBadge status={o.kyc.status} compact />
              </Pressable>
            ))
          )}

          <Pressable
            onPress={() => router.push("/profile/create-facility")}
            style={[styles.row, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="hospital-box-outline" size={18} color={colors.text} />
            <Text style={[styles.rowText, { color: colors.text }]}>Create Facility</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile/create-organization")}
            style={[styles.row, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="domain-plus" size={18} color={colors.text} />
            <Text style={[styles.rowText, { color: colors.text }]}>Create Organization</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Templates</Text>

          <Pressable
            onPress={() => router.push("/profile/cover-letters")}
            style={[styles.row, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="file-account-outline" size={18} color={colors.text} />
            <Text style={[styles.rowText, { color: colors.text }]}>Cover Letter Templates</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile/price-templates")}
            style={[styles.row, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="file-table-outline" size={18} color={colors.text} />
            <Text style={[styles.rowText, { color: colors.text }]}>Price Templates</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          {isAdmin && (
            <Pressable
              onPress={() => router.push("/profile/kyc-review")}
              style={[styles.row, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginTop: 20 }]}
            >
              <MaterialCommunityIcons name="shield-search" size={18} color={colors.text} />
              <Text style={[styles.rowText, { color: colors.text }]}>KYC Review Queue</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  scrollContent: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 2 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  findLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  rowText: { flex: 1, fontSize: 13, fontWeight: "600" },
});
