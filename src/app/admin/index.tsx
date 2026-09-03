import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useRxLinkStore } from "@/features/rxlink/hooks/use-rxlink-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole, isSuperadminRole } from "@/features/auth/types/auth.types";
import { usePaymentsStore } from "@/features/payments/hooks/use-payments-data";

export default function AdminHubScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));

  const ads = useAdsStore((state) => state.ads);
  const rxlinkRequests = useRxLinkStore((state) => state.requests);
  const fetchRxLinkRequests = useRxLinkStore((state) => state.fetchRequests);
  const posts = usePostsStore((state) => state.posts);
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
  const organizationCreationRequests = useProfileStore(
    (state) => state.organizationCreationRequests,
  );
  const facilityMembershipRequests = useProfileStore(
    (state) => state.facilityMembershipRequests,
  );
  const facilityOrganizationRequests = useProfileStore(
    (state) => state.facilityOrganizationRequests,
  );
  const pendingPayments = usePaymentsStore((state) => state.pendingPayments);
  const fetchPendingPayments = usePaymentsStore((state) => state.fetchPendingPayments);
  const fetchFacilityCreationRequests = useProfileStore(
    (state) => state.fetchFacilityCreationRequests,
  );
  const fetchOrganizationCreationRequests = useProfileStore(
    (state) => state.fetchOrganizationCreationRequests,
  );
  const fetchFacilityMembershipRequests = useProfileStore(
    (state) => state.fetchFacilityMembershipRequests,
  );
  const fetchFacilityOrganizationRequests = useProfileStore(
    (state) => state.fetchFacilityOrganizationRequests,
  );

  useEffect(() => {
    fetchFacilityCreationRequests();
    fetchOrganizationCreationRequests();
    fetchFacilityMembershipRequests();
    fetchFacilityOrganizationRequests();
    fetchReports();
    fetchUsersForKycReview();
    fetchPendingPayments();
    fetchRxLinkRequests();
  }, []);

  const pendingAdsCount = useMemo(
    () => ads.filter((a) => a.status === "pending").length,
    [ads],
  );
  const pendingRxLinkCount = useMemo(
    () => rxlinkRequests.filter((r) => r.status === "pending").length,
    [rxlinkRequests],
  );
  const suspendedPostsCount = useMemo(
    () => posts.filter((p) => p.status === "suspended").length,
    [posts],
  );
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
    [
      facilityCreationRequests,
      organizationCreationRequests,
      facilityMembershipRequests,
      facilityOrganizationRequests,
    ],
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
      route: "/admin/ads-moderation",
    },
    {
      key: "rxlink",
      title: "RxLink Requests",
      description: "Find medications for uploaded prescriptions and respond.",
      icon: "pill" as const,
      color: "#0d9488",
      count: pendingRxLinkCount,
      route: "/admin/rxlink-requests",
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
      description:
        "Approve or reject new facilities, organizations, membership, and facility-org links.",
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
      key: "reference-data",
      title: "Reference Data",
      description: "Manage units of measurement, medication categories, and regions.",
      icon: "database-outline" as const,
      color: "#7c3aed",
      count: 0,
      countLabel: "manage",
      route: "/admin/reference-data",
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
      key: "posts-moderation",
      title: "Post Moderation",
      description: "Suspend or remove community posts and comments.",
      icon: "forum-outline" as const,
      color: "#0891b2",
      count: suspendedPostsCount,
      route: "/admin/posts-moderation",
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
      key: "payments",
      title: "Payments",
      description: "Confirm or cancel pending mobile money payments.",
      icon: "cash-clock" as const,
      color: "#059669",
      count: pendingPayments.length,
      route: "/admin/payments",
    });
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
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View
          className="flex-row items-center gap-3 px-4 pt-3 pb-4 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          )}
          <View>
            <Text className="text-[22px] font-bold" style={{ color: colors.text }}>
              Admin
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              System management tools
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerClassName="p-4 gap-2.5"
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card) => (
            <Pressable
              key={card.key}
              onPress={() => router.push(card.route as any)}
              className="flex-row items-center gap-3.5 rounded-2xl border p-4 shadow-sm"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                shadowColor: colors.text,
              }}
            >
              <View
                className="w-12 h-12 rounded-[14px] items-center justify-center"
                style={{ backgroundColor: card.color + "18" }}
              >
                <MaterialCommunityIcons name={card.icon} size={24} color={card.color} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                  {card.title}
                </Text>
                <Text
                  className="text-xs mt-1 leading-4"
                  style={{ color: colors.textSecondary }}
                >
                  {card.description}
                </Text>
              </View>
              <View className="items-center min-w-10">
                <Text
                  className="text-lg font-extrabold"
                  style={{
                    color: card.count > 0 ? card.color : colors.textSecondary,
                  }}
                >
                  {card.count}
                </Text>
                <Text className="text-[10px] mt-0.5" style={{ color: colors.textSecondary }}>
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