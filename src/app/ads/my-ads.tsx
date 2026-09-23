import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, ScrollView, Platform} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedText } from "@/shared/components/themed-text";
import EmptyState from "@/shared/components/empty-state";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { Ad } from "@/features/ads/types/ads.types";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";

// Ads has no draft-equivalent state (a submission goes straight to
// pending review) and no "response" concept — "Has Comments" stands in
// for the other features' "Responded"/"Has Applicants".
const AD_FILTERS = ["All", "Approved", "Pending", "Rejected", "Suspended", "Banned", "Has Comments"] as const;
type FilterType = (typeof AD_FILTERS)[number];

export default function MyAdsScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const ads = useAdsStore((state) => state.ads);
  const deleteAd = useAdsStore((state) => state.deleteAd);

  // Mirrors app/rfqs/my-rfqs.tsx, app/mediscope/my-mediscope.tsx,
  // app/donations/my-donations.tsx, and app/jobs/my-jobs.tsx's own
  // filter-tab pattern — same query-param-driven active filter.
  const activeFilter = useMemo<FilterType>(() => {
    if (!filter) return "All";

    // "Has Comments" doesn't survive the toLowerCase()/single-word
    // round trip other filters do, so it's matched separately, same as
    // "Has Applicants" on app/jobs/my-jobs.tsx.
    if (filter.replace(/-/g, " ").toLowerCase() === "has comments") return "Has Comments";

    const formattedFilter = filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase();
    return AD_FILTERS.includes(formattedFilter as FilterType) ? (formattedFilter as FilterType) : "All";
  }, [filter]);

  const myAds = useMemo(
    () =>
      ads
        .filter((a) => a.advertiser.id === currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [ads, currentUserId],
  );

  // "Has Comments" isn't a real status value — it's live (approved) ads
  // that have at least one comment, so it needs its own compound check
  // rather than the direct status match every other filter uses.
  const filteredAds = useMemo(() => {
    return myAds.filter((a) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Has Comments") return a.status === "approved" && a.commentCount > 0;
      return a.status?.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [myAds, activeFilter]);

  const handleFilterPress = (filterItem: string) => {
    router.setParams({ filter: filterItem.toLowerCase().replace(/ /g, "-") });
  };

  const handleDelete = async (ad: Ad) => {
    const ok = await confirm({
      title: "Delete this ad?",
      message: `"${ad.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const success = await deleteAd(ad.id);
    toast[success ? "success" : "error"](success ? "Ad deleted." : "Couldn't delete the ad.");
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Header View Container */}
      <View className="flex-row items-center justify-between px-3 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        {Platform.OS !== "web" && (
        <Pressable onPress={() => router.back()} className="p-1.5">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        )}
        <Text className="text-base font-bold" style={{ color: colors.text }}>My Ads</Text>
        <Pressable onPress={() => router.push("/ads/create-ad")} className="p-1.5">
          <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View className="py-[15px]" style={{ backgroundColor: colors.background }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, maxHeight: 56 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {AD_FILTERS.map((filterItem) => {
            const isActive = activeFilter === filterItem;

            return (
              <Pressable
                key={filterItem}
                onPress={() => handleFilterPress(filterItem)}
                className="px-[18px] py-2 rounded-full border-[1.5px] items-center justify-center"
                style={
                  isActive
                    ? { backgroundColor: colors.secondary, borderColor: colors.secondary }
                    : { backgroundColor: "transparent", borderColor: "rgba(128,128,128,0.2)" }
                }
              >
                <ThemedText
                  className="text-sm font-semibold"
                  style={isActive ? { color: "#FFFFFF" } : undefined}
                >
                  {filterItem}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredAds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <EmptyState
            icon="bullhorn-outline"
            message={
              activeFilter !== "All" && myAds.length > 0
                ? `No ${activeFilter.toLowerCase()} ads.`
                : "You haven't created any ads yet."
            }
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/ads/ad-details", params: { id: item.id } })}
            className="rounded-[14px] border p-[14px] gap-1.5"
            style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
          >
            {/* Top row alignment content */}
            <View className="flex-row items-center justify-between">
              <AdStatusPill status={item.status} compact />
              <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                {format(item.createdAt)}
              </Text>
            </View>

            <Text className="text-semibold text-[15px]" style={{ color: colors.text }} numberOfLines={1}>
              {item.title}
            </Text>

            {/* Interaction stats wrapper */}
            <View className="flex-row items-center gap-3 flex-wrap">
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons name="thumb-up-outline" size={13} color={colors.textSecondary} />
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{item.likeCount}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons name="thumb-down-outline" size={13} color={colors.textSecondary} />
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{item.dislikeCount}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons name="comment-outline" size={13} color={colors.textSecondary} />
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{item.commentCount}</Text>
              </View>
              <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                · {item.plan.name} · {item.payment.currency} {formatAmount(item.payment.amountDue)} (
                {item.payment.status})
              </Text>
            </View>

            {!!item.statusReason && (
              <Text className="text-xs leading-4" style={{ color: colors.error }} numberOfLines={2}>
                {item.statusReason}
              </Text>
            )}

            {/* Card dynamic action controls footer */}
            <View className="flex-row gap-4 border-t pt-2 mt-0.5" style={{ borderTopColor: colors.border }}>
              {(item.status === "pending" || item.status === "rejected") && (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/ads/create-ad", params: { id: item.id } })
                  }
                  className="flex-row items-center gap-1.5"
                  hitSlop={6}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.text} />
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>Edit</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleDelete(item)}
                className="flex-row items-center gap-1.5"
                hitSlop={6}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={14} color={colors.error} />
                <Text className="text-xs font-semibold" style={{ color: colors.error }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
