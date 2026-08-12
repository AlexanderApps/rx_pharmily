import React, { useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { Ad } from "@/features/ads/types/ads.types";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";

export default function MyAdsScreen() {
  const { colors } = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>My Ads</Text>
        <Pressable onPress={() => router.push("/ads/create-ad")} style={styles.back}>
          <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={myAds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bullhorn-outline" size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You haven't created any ads yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/ads/ad-details", params: { id: item.id } })}
            style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <View style={styles.cardTopRow}>
              <AdStatusPill status={item.status} compact />
              <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
                {format(item.createdAt)}
              </Text>
            </View>

            <Text style={[styles.adTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="thumb-up-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.likeCount}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="thumb-down-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.dislikeCount}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="comment-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.commentCount}</Text>
              </View>
              <Text style={[styles.planText, { color: colors.textSecondary }]}>
                · {item.plan.name} · {item.payment.currency} {formatAmount(item.payment.amount)} (
                {item.payment.status})
              </Text>
            </View>

            {!!item.statusReason && (
              <Text style={[styles.reasonText, { color: colors.error }]} numberOfLines={2}>
                {item.statusReason}
              </Text>
            )}

            <View style={[styles.rowActions, { borderTopColor: colors.border }]}>
              {(item.status === "pending" || item.status === "rejected") && (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/ads/create-ad", params: { id: item.id } })
                  }
                  style={styles.rowActionButton}
                  hitSlop={6}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.text} />
                  <Text style={[styles.rowActionText, { color: colors.text }]}>Edit</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleDelete(item)}
                style={styles.rowActionButton}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={14} color={colors.error} />
                <Text style={[styles.rowActionText, { color: colors.error }]}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  emptyText: { fontSize: 13 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeAgo: { fontSize: 11 },
  adTitle: { fontSize: 15, fontWeight: "600" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12 },
  planText: { fontSize: 11 },
  reasonText: { fontSize: 12, lineHeight: 16 },
  rowActions: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 2,
  },
  rowActionButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  rowActionText: { fontSize: 12, fontWeight: "600" },
});
