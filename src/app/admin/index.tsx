import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole, isSuperadminRole } from "@/features/auth/types/auth.types";

export default function AdminHubScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));
  const ads = useAdsStore((state) => state.ads);
  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const usersForKycReview = useProfileStore((state) => state.usersForKycReview);
  const fetchUsersForKycReview = useProfileStore((state) => state.fetchUsersForKycReview);
  const reports = useHelpStore((state) => state.reports);
  const fetchReports = useHelpStore((state) => state.fetchReports);
  const products = useCatalogStore((state) => state.products);
  const formularyRequests = useCatalogStore((state) => state.formularyRequests);
  const facilityCreationRequests = useProfileStore((state) => state.facilityCreationRequests);
  const organizationCreationRequests = useProfileStore((state) => state.organizationCreationRequests);
  const facilityMembershipRequests = useProfileStore((state) => state.facilityMembershipRequests);
  const facilityOrganizationRequests = useProfileStore((state) => state.facilityOrganizationRequests);
  const fetchFacilityCreationRequests = useProfileStore((state) => state.fetchFacilityCreationRequests);
  const fetchOrganizationCreationRequests = useProfileStore((state) => state.fetchOrganizationCreationRequests);
  const fetchFacilityMembershipRequests = useProfileStore((state) => state.fetchFacilityMembershipRequests);
  const fetchFacilityOrganizationRequests = useProfileStore((state) => state.fetchFacilityOrganizationRequests);

  useEffect(() => {
    fetchFacilityCreationRequests();
    fetchOrganizationCreationRequests();
    fetchFacilityMembershipRequests();
    fetchFacilityOrganizationRequests();
    fetchReports();
    fetchUsersForKycReview();
  }, []);

  const pendingAdsCount = useMemo(() => ads.filter((a) => a.status === "pending").length, [ads]);
  const pendingKycCount = useMemo(() => {
    const kycStatuses = [
      user.kyc.status,
      ...usersForKycReview.map((u) => u.kyc.status),
      ...facilities.map((f) => f.kyc.status),
      ...organizations.map((o) => o.kyc.status),
    ];
    return kycStatuses.filter((s) => s === "pending").length;
  }, [user, usersForKycReview, facilities, organizations]);
  const openReportsCount = useMemo(
    () => reports.filter((r) => r.status === "submitted" || r.status === "in_review").length,
    [reports],
  );
  const pendingFormularyCount = useMemo(
    () => formularyRequests.filter((r) => r.status === "pending").length,
    [formularyRequests],
  );
  const pendingFacilityOrgRequestsCount = useMemo(
    () =>
      [
        ...facilityCreationRequests,
        ...organizationCreationRequests,
        ...facilityMembershipRequests,
        ...facilityOrganizationRequests,
      ].filter((r) => r.status === "pending").length,
    [facilityCreationRequests, organizationCreationRequests, facilityMembershipRequests, facilityOrganizationRequests],
  );

  // Checked after every hook above has run, unconditionally, on every
  // render — an early return before that would break the Rules of Hooks
  // the moment isAdmin's value ever differs between renders of the same
  // mounted instance (e.g. the profile finishing its load a moment after
  // first mount).
  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const cards = [
    {
      key: "ads",
      title: "Ad Management",
      description: "Review, approve, or reject submitted ads.",
      icon: "bullhorn-outline" as const,
      color: "#dc2626",
      count: pendingAdsCount,
      route: "/ads/moderation",
    },
    {
      key: "kyc",
      title: "KYC Verification",
      description: "Approve or reject user, facility, and organization verification.",
      icon: "shield-search" as const,
      color: "#2563eb",
      count: pendingKycCount,
      route: "/profile/kyc-review",
    },
    {
      key: "facility-org-requests",
      title: "Facility & Org Requests",
      description: "Approve or reject new facilities, organizations, membership, and facility-org links.",
      icon: "domain" as const,
      color: "#0891b2",
      count: pendingFacilityOrgRequestsCount,
      route: "/admin/facility-org-requests",
    },
    {
      key: "products",
      title: "Product Catalog",
      description: "Edit, merge, or remove catalog products.",
      icon: "pill" as const,
      color: "#16a34a",
      count: products.length,
      countLabel: "products",
      route: "/admin/products",
    },
    {
      key: "formulary",
      title: "Formulary Requests",
      description: "Review medications requested for the catalog.",
      icon: "clipboard-plus-outline" as const,
      color: "#0891b2",
      count: pendingFormularyCount,
      route: "/admin/formulary-requests",
    },
    {
      key: "reports",
      title: "Reports",
      description: "Bug reports and reports on users or content.",
      icon: "flag-outline" as const,
      color: "#d97706",
      count: openReportsCount,
      route: "/admin/reports",
    },
    {
      key: "faq",
      title: "FAQ Management",
      description: "Add, edit, or remove frequently asked questions.",
      icon: "help-circle-outline" as const,
      color: "#0284c7",
      count: 0,
      countLabel: "manage",
      route: "/admin/faq-management",
    },
  ];

  if (isSuperadmin) {
    cards.push({
      key: "role-management",
      title: "Role Management",
      description: "Promote or demote admins and superadmins.",
      icon: "shield-crown-outline" as const,
      color: "#9333ea",
      count: 0,
      countLabel: "manage",
      route: "/admin/role-management",
    });
  }

  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Admin</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              System management tools
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {cards.map((card) => (
            <Pressable
              key={card.key}
              onPress={() => router.push(card.route as any)}
              style={[
                styles.card,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: card.color + "18" }]}>
                <MaterialCommunityIcons name={card.icon} size={24} color={card.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {card.description}
                </Text>
              </View>
              <View style={styles.countBlock}>
                <Text style={[styles.countValue, { color: card.count > 0 ? card.color : colors.textSecondary }]}>
                  {card.count}
                </Text>
                <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                  {card.countLabel ?? "pending"}
                </Text>
              </View>
            </Pressable>
          ))}
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
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    padding: 10,
  },
  noticeText: { fontSize: 11, flex: 1, lineHeight: 16 },
  scrollContent: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardDescription: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  countBlock: { alignItems: "center", minWidth: 40 },
  countValue: { fontSize: 18, fontWeight: "800" },
  countLabel: { fontSize: 10, marginTop: 1 },
});
