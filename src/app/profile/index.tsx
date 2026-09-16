import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { usePermissionsStore } from "@/features/auth/hooks/use-permissions";
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
  const hasFeature = usePermissionsStore((state) => state.hasFeature);
  const hasFetchedFeatures = usePermissionsStore((state) => state.hasFetchedFeatures);

  // Derived here (not inside the Zustand selector) — a selector returning a
  // freshly-filtered array every call makes useSyncExternalStore think the
  // store changed on every render, which is an infinite loop.
  const myFacilities = useMemo(() => {
    const myIds = new Set(
      facilityMemberships
        .filter((m) => m.userId === user.id)
        .map((m) => m.facilityId),
    );
    return facilities.filter((f) => myIds.has(f.id));
  }, [facilities, facilityMemberships, user.id]);

  const myOrganizations = useMemo(
    () => organizations.filter((o) => o.adminUserId === user.id),
    [organizations, user.id],
  );

  // A regular user — confirmed not a pharmacist or pharmacy support
  // staff, whether because they've never submitted KYC or because
  // they're verified with profession 'Other' — has no facilities, no
  // organizations, and no use for templates; everything on this hub
  // except the single "My Profile" card is pharmacist/PSS-only. Rather
  // than show a hub that's effectively one card, send them straight to
  // the profile itself, same reasoning as the home feed and nav
  // already apply for this same group of users. Someone still pending
  // or rejected might yet turn out to be a professional, so they still
  // see the full hub, same as the sidebar/services screens. Placed
  // after the hooks above (not before) — an early return ahead of
  // useMemo would call a different number of hooks depending on kyc
  // status, which breaks React's rule that hooks run in the same order
  // every render.
  //
  // Whether this counts as "professional access" is now the home_feed
  // feature grant (role_features), not a hardcoded roles check — see
  // index.tsx's own comment and role-permissions.tsx for where a
  // superadmin edits it. hasFetchedFeatures guards the window before
  // myFeatures loads — worse here than a visual flash, since an
  // incorrect redirect is real navigation the person would then have
  // to navigate back from, not just a screen that briefly looked wrong.
  const hasProfessionalAccess = hasFeature("home_feed");
  const isPursuingVerification = user.kyc.status === "pending" || user.kyc.status === "rejected";
  if (!hasFetchedFeatures) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (!hasProfessionalAccess && !isPursuingVerification) {
    return <Redirect href="/profile/user-profile" />;
  }

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
              Profiles
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Identity, facility, and organization details
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerClassName="p-4 gap-2.5"
          showsVerticalScrollIndicator={false}
        >
          {/* User card */}
          <Pressable
            onPress={() => router.push(userCard.route as any)}
            className="flex-row items-center gap-3.5 rounded-2xl border p-3.5 shadow-sm"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              shadowColor: colors.text,
            }}
          >
            <View
              className="w-[46px] h-[46px] rounded-[13px] items-center justify-center"
              style={{ backgroundColor: userCard.color + "18" }}
            >
              <MaterialCommunityIcons
                name={userCard.icon}
                size={24}
                color={userCard.color}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                {userCard.title}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {userCard.subtitle}
              </Text>
            </View>
            <KycStatusBadge status={userCard.kyc} compact />
          </Pressable>

          {/* Facilities section */}
          <View className="flex-row items-center justify-between mt-3.5 mb-0.5">
            <Text className="text-[13px] font-bold" style={{ color: colors.text }}>
              My Facilities ({myFacilities.length})
            </Text>
            <Pressable
              onPress={() => router.push("/profile/find-facility")}
              className="flex-row items-center gap-1"
            >
              <MaterialCommunityIcons name="magnify" size={14} color={colors.primary} />
              <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                Find a Facility
              </Text>
            </Pressable>
          </View>

          {myFacilities.map((f) => (
            <Pressable
              key={f.id}
              onPress={() =>
                router.push({
                  pathname: "/profile/facility-profile",
                  params: { id: f.id },
                })
              }
              className="flex-row items-center gap-3.5 rounded-2xl border p-3.5 shadow-sm"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                shadowColor: colors.text,
              }}
            >
              <View
                className="w-[46px] h-[46px] rounded-[13px] items-center justify-center"
                style={{ backgroundColor: "#16a34a18" }}
              >
                <MaterialCommunityIcons
                  name="hospital-building"
                  size={24}
                  color="#16a34a"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                  {f.name}
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {f.location}
                </Text>
              </View>
              <KycStatusBadge status={f.kyc.status} compact />
            </Pressable>
          ))}

          {/* Organizations section */}
          <Text className="text-[13px] font-bold mt-3.5 mb-0.5" style={{ color: colors.text }}>
            My Organizations ({myOrganizations.length})
          </Text>

          {myOrganizations.length === 0 ? (
            <Text className="text-[13px] mb-2" style={{ color: colors.textSecondary }}>
              You don't administer any organization yet.
            </Text>
          ) : (
            myOrganizations.map((o) => (
              <Pressable
                key={o.id}
                onPress={() =>
                  router.push({
                    pathname: "/profile/organization-profile",
                    params: { id: o.id },
                  })
                }
                className="flex-row items-center gap-3.5 rounded-2xl border p-3.5 shadow-sm"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                }}
              >
                <View
                  className="w-[46px] h-[46px] rounded-[13px] items-center justify-center"
                  style={{ backgroundColor: "#9333ea18" }}
                >
                  <MaterialCommunityIcons name="domain" size={24} color="#9333ea" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                    {o.name}
                  </Text>
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {o.facilityIds.length} facilit
                    {o.facilityIds.length === 1 ? "y" : "ies"}
                  </Text>
                </View>
                <KycStatusBadge status={o.kyc.status} compact />
              </Pressable>
            ))
          )}

          {/* Create actions */}
          <Pressable
            onPress={() => router.push("/profile/create-facility")}
            className="flex-row items-center gap-2.5 rounded-xl border p-3.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="hospital-box-outline"
              size={18}
              color={colors.text}
            />
            <Text className="flex-1 text-[13px] font-semibold" style={{ color: colors.text }}>
              Create Facility
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile/create-organization")}
            className="flex-row items-center gap-2.5 rounded-xl border p-3.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="domain-plus" size={18} color={colors.text} />
            <Text className="flex-1 text-[13px] font-semibold" style={{ color: colors.text }}>
              Create Organization
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Templates */}
          <Text className="text-[13px] font-bold mt-3.5 mb-0.5" style={{ color: colors.text }}>
            Templates
          </Text>

          <Pressable
            onPress={() => router.push("/profile/cover-letters")}
            className="flex-row items-center gap-2.5 rounded-xl border p-3.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="file-account-outline"
              size={18}
              color={colors.text}
            />
            <Text className="flex-1 text-[13px] font-semibold" style={{ color: colors.text }}>
              Cover Letter Templates
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile/price-templates")}
            className="flex-row items-center gap-2.5 rounded-xl border p-3.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="file-table-outline"
              size={18}
              color={colors.text}
            />
            <Text className="flex-1 text-[13px] font-semibold" style={{ color: colors.text }}>
              Price Templates
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {isAdmin && (
            <Pressable
              onPress={() => router.push("/profile/kyc-review")}
              className="flex-row items-center gap-2.5 rounded-xl border p-3.5 mt-5"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="shield-search"
                size={18}
                color={colors.text}
              />
              <Text
                className="flex-1 text-[13px] font-semibold"
                style={{ color: colors.text }}
              >
                KYC Review Queue
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}