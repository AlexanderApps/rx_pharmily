import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, Platform} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { Ad } from "@/features/ads/types/ads.types";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";

export default function MyAdsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const ads = useAdsStore((state) => state.ads);
  const deleteAd = useAdsStore((state) => state.deleteAd);

  const myAds = useMemo(
    () =>
      ads
        .filter((a) => a.advertiser.id === currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [ads, currentUserId],
  );

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

      <FlatList
        data={myAds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <EmptyState icon="bullhorn-outline" message="You haven't created any ads yet." />
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
