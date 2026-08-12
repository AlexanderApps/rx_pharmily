import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import AdMediaCarousel from "@/features/ads/components/ad-media-carousel";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "-";

// Owner-only management screen. Anyone browsing someone else's ad is routed
// to /ads/ad-market-details instead.
export default function AdDetailsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();

  const ads = useAdsStore((state) => state.ads);
  const isLoadingAds = useAdsStore((state) => state.isLoading);
  const deleteAd = useAdsStore((state) => state.deleteAd);

  const ad = useMemo(() => ads.find((a) => a.id === id), [ads, id]);

  if (!ad) {
    if (isLoadingAds) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>No ad found for id: {id}</Text>
      </SafeAreaView>
    );
  }

  const isOwner = ad.advertiser.id === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
            This is a management view
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Only {ad.advertiser.name} can manage this ad.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({ pathname: "/ads/ad-market-details", params: { id: ad.id } })
            }
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryButtonText}>View ad</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isEditable = ad.status === "pending" || ad.status === "rejected";

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this ad?",
      message: `"${ad.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const success = await deleteAd(ad.id);
    if (success) {
      toast.success("Ad deleted.");
      router.back();
    } else {
      toast.error("Couldn't delete the ad.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {ad.title}
        </Text>
        {isEditable && (
          <Pressable
            onPress={() => router.push({ pathname: "/ads/create-ad", params: { id: ad.id } })}
            style={styles.back}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.text} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.postedByRow}>
          <ClickableAvatar
            entityType="user"
            entityId={ad.advertiser.id}
            name={ad.advertiser.name}
            avatarColor={ad.advertiser.avatarColor}
            subtitle={ad.advertiser.role}
            size={36}
          />
          <View>
            <Text style={[styles.postedByLabel, { color: colors.textSecondary }]}>Created by</Text>
            <Text style={[styles.postedByName, { color: colors.text }]}>{ad.advertiser.name}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <AdStatusPill status={ad.status} />
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {format(ad.createdAt)}
          </Text>
        </View>

        {!!ad.statusReason && (
          <View style={[styles.reasonBox, { backgroundColor: colors.error + "12" }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={[styles.reasonText, { color: colors.error }]}>{ad.statusReason}</Text>
          </View>
        )}

        <Text style={[styles.text, { color: colors.textSecondary }]}>{ad.text}</Text>

        {ad.media && ad.media.length > 0 && <AdMediaCarousel media={ad.media} />}

        {ad.fdaApprovalId && (
          <View style={[styles.fdaRow, { backgroundColor: colors.success + "12" }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.success} />
            <Text style={[styles.fdaText, { color: colors.success }]}>
              FDA Approved · {ad.fdaApprovalId}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan & Payment</Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Plan</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{ad.plan.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Payment</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {ad.payment.currency} {formatAmount(ad.payment.amount)} · {ad.payment.status}
            </Text>
          </View>
          {ad.startsAt && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Live since</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{fmtDate(ad.startsAt)}</Text>
            </View>
          )}
          {ad.expiresAt && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Expires</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{fmtDate(ad.expiresAt)}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Engagement</Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Likes</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{ad.likeCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dislikes</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{ad.dislikeCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Comments</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{ad.commentCount}</Text>
          </View>
        </View>

        <Pressable onPress={handleDelete} style={[styles.deleteButton, { borderColor: colors.error }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete ad</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  content: { padding: 16, gap: 14 },
  postedByRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  postedByLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  postedByName: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeAgo: { fontSize: 12 },
  reasonBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 10 },
  reasonText: { fontSize: 12, flex: 1, lineHeight: 17 },
  text: { fontSize: 14, lineHeight: 20 },
  fdaRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  fdaText: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 12, fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteButtonText: { fontSize: 13, fontWeight: "600" },
  primaryButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
