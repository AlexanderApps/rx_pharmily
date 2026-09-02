import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ActionButton from "@/shared/components/action-button";
import StatCard from "@/shared/components/stat-card";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import AdCard from "@/features/ads/components/ad-card";

export default function RxAdsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const ads = useAdsStore((state) => state.ads);

  // Everyone's approved ads, plus the viewer's own ad even while it's
  // still pending review — otherwise a user who just submitted an ad
  // sees no trace of it on the main feed until an admin approves it,
  // only in the separate My Ads screen. AdCard shows a "Pending" badge
  // for the viewer's own non-approved entries so it's clear why an ad
  // that isn't actually live yet is showing up here.
  const liveAds = useMemo(
    () =>
      ads
        .filter((a) => a.status === "approved" || (a.advertiser.id === currentUserId && a.status === "pending"))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [ads, currentUserId],
  );

  const myAds = useMemo(
    () => ads.filter((a) => a.advertiser.id === currentUserId),
    [ads, currentUserId],
  );
  const pendingCount = myAds.filter((a) => a.status === "pending").length;
  const liveCount = myAds.filter((a) => a.status === "approved").length;

  const openAdDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner ? "/ads/ad-details" : "/ads/ad-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView className="flex-1">
      <View
        className="flex-1"
        style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}
      >
        <View
          className="flex-row items-center gap-2.5 px-4 pt-3 pb-3 border-b-[0.5px]"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          )}
          <View className="flex-1">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              RxAds
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Reach pharmacy professionals directly
            </Text>
          </View>
          {isAdmin && (
            <Pressable
              onPress={() => router.push("/admin/ads-moderation")}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.text} />
            </Pressable>
          )}

          {/* Create — web only; native keeps the floating action
              button below instead. */}
          {Platform.OS === "web" && (
            <Pressable
              onPress={() => router.push("/ads/create-ad")}
              className="w-10 h-10 rounded-xl items-center justify-center cursor-pointer hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={22} color={colors.background} />
            </Pressable>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Your Advertising
            </Text>
            <View className="flex-row gap-3">
              <StatCard
                number={`${liveCount}`}
                label="Live Ads"
                type="success"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
              <StatCard
                number={`${pendingCount}`}
                label="Pending Review"
                type="warning"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
              <StatCard
                number={`${myAds.length}`}
                label="Total Ads"
                type="info"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
            </View>
          </View>

          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <ActionButton
                icon={<MaterialCommunityIcons name="plus-box-outline" size={22} color="#2563eb" />}
                label="Create Ad"
                colors={colors}
                onPress={() => router.push("/ads/create-ad")}
              />
              <ActionButton
                icon={<MaterialCommunityIcons name="format-list-bulleted" size={22} color="#16a34a" />}
                label="My Ads"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
              {isAdmin && (
                <ActionButton
                  icon={<MaterialCommunityIcons name="shield-check-outline" size={22} color="#9333ea" />}
                  label="Moderation"
                  colors={colors}
                  onPress={() => router.push("/admin/ads-moderation")}
                />
              )}
            </View>
          </View>

          <View className="px-5 mt-6">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                Live Now
              </Text>
            </View>
            <View className="gap-2.5">
              {liveAds.length === 0 ? (
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                  No ads are live yet.
                </Text>
              ) : (
                liveAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} onPress={() => openAdDetails(ad.id, ad.advertiser.id === currentUserId)} />
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Button — native only; web uses the header
            Create button instead. */}
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.push("/ads/create-ad")}
          className="absolute right-6 bottom-8 w-16 h-16 rounded-full items-center justify-center shadow-lg active:opacity-90 cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={30} color={colors.background} />
        </Pressable>
        )}
      </View>
    </ThemedView>
  );
}
