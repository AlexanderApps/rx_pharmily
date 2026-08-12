import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { Ad } from "@/features/ads/types/ads.types";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import AdMediaCarousel from "@/features/ads/components/ad-media-carousel";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";

interface AdCardProps {
  ad: Ad;
  onPress?: (ad: Ad) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, onPress }) => {
  const { colors } = useTheme();
  const toggleReaction = useAdsStore((state) => state.toggleReaction);

  const handleOpenLink = () => {
    if (ad.linkUrl) Linking.openURL(ad.linkUrl).catch(() => {});
  };

  return (
    <Pressable
      onPress={() => onPress?.(ad)}
      style={[
        styles.card,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary + "30" },
      ]}
    >
      <View style={styles.headerRow}>
        <ClickableAvatar
          entityType="user"
          entityId={ad.advertiser.id}
          name={ad.advertiser.name}
          avatarColor={ad.advertiser.avatarColor}
          subtitle={ad.advertiser.role}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
            {ad.advertiser.name}
          </Text>
          <View style={styles.sponsoredRow}>
            <MaterialCommunityIcons name="bullhorn-outline" size={11} color={colors.primary} />
            <Text style={[styles.sponsoredText, { color: colors.primary }]}>Sponsored</Text>
            <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
              · {format(ad.createdAt)}
            </Text>
          </View>
        </View>
        {ad.plan.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.secondary + "20" }]}>
            <MaterialCommunityIcons name="star" size={11} color={colors.secondary} />
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{ad.title}</Text>
      {ad.text ? (
        <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={3}>
          {ad.text}
        </Text>
      ) : null}

      {ad.media && ad.media.length > 0 && <AdMediaCarousel media={ad.media} />}

      {ad.fdaApprovalId && (
        <View style={[styles.fdaRow, { backgroundColor: colors.success + "12" }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color={colors.success} />
          <Text style={[styles.fdaText, { color: colors.success }]}>
            FDA Approved · {ad.fdaApprovalId}
          </Text>
        </View>
      )}

      {ad.linkUrl && (
        <Pressable
          onPress={handleOpenLink}
          style={[styles.linkButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.linkButtonText}>Learn More</Text>
          <Ionicons name="open-outline" size={14} color="#fff" />
        </Pressable>
      )}

      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => toggleReaction(ad.id, "like")}
          style={styles.actionButton}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={ad.userReaction === "like" ? "thumb-up" : "thumb-up-outline"}
            size={16}
            color={ad.userReaction === "like" ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              { color: ad.userReaction === "like" ? colors.primary : colors.textSecondary },
            ]}
          >
            {ad.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => toggleReaction(ad.id, "dislike")}
          style={styles.actionButton}
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={ad.userReaction === "dislike" ? "thumb-down" : "thumb-down-outline"}
            size={16}
            color={ad.userReaction === "dislike" ? colors.error : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              { color: ad.userReaction === "dislike" ? colors.error : colors.textSecondary },
            ]}
          >
            {ad.dislikeCount}
          </Text>
        </Pressable>

        <Pressable onPress={() => onPress?.(ad)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {ad.commentCount}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default AdCard;

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  authorName: { fontSize: 14, fontWeight: "600" },
  sponsoredRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  sponsoredText: { fontSize: 11, fontWeight: "700" },
  timeAgo: { fontSize: 11 },
  featuredBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "700" },
  text: { fontSize: 13, lineHeight: 19 },
  fdaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fdaText: { fontSize: 11, fontWeight: "600" },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  linkButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 13, fontWeight: "500" },
});
