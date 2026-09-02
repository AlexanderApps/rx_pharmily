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
      className="rounded-[14px] border p-3.5 gap-2.5"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.primary + "30" }}
    >
      <View className="flex-row items-center gap-2.5">
        <ClickableAvatar
          entityType="user"
          entityId={ad.advertiser.id}
          name={ad.advertiser.name}
          avatarColor={ad.advertiser.avatarColor}
          subtitle={ad.advertiser.role}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {ad.advertiser.name}
          </Text>
          <View className="flex-row items-center gap-1 mt-px">
            <MaterialCommunityIcons name="bullhorn-outline" size={11} color={colors.primary} />
            <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>Sponsored</Text>
            <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
              · {format(ad.createdAt)}
            </Text>
          </View>
        </View>
        {ad.status === "pending" && (
          <View className="px-2 py-[3px] rounded-[7px]" style={{ backgroundColor: colors.warning + "18" }}>
            <Text className="text-[10px] font-bold" style={{ color: colors.warning }}>
              Pending review
            </Text>
          </View>
        )}
        {ad.plan.featured && (
          <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: colors.secondary + "20" }}>
            <MaterialCommunityIcons name="star" size={11} color={colors.secondary} />
          </View>
        )}
      </View>

      <Text className="text-[15px] font-bold" style={{ color: colors.text }}>{ad.title}</Text>
      {ad.text ? (
        <Text className="text-[13px] leading-[19px]" style={{ color: colors.textSecondary }} numberOfLines={3}>
          {ad.text}
        </Text>
      ) : null}

      {ad.media && ad.media.length > 0 && <AdMediaCarousel media={ad.media} />}

      {ad.fdaApprovalId && (
        <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: colors.success + "12" }}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color={colors.success} />
          <Text className="text-[11px] font-semibold" style={{ color: colors.success }}>
            FDA Approved · {ad.fdaApprovalId}
          </Text>
        </View>
      )}

      {ad.linkUrl && (
        <Pressable
          onPress={handleOpenLink}
          className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-[13px] font-semibold">Learn More</Text>
          <Ionicons name="open-outline" size={14} color="#fff" />
        </Pressable>
      )}

      <View className="flex-row gap-5 pt-2.5" style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
        <Pressable
          onPress={() => toggleReaction(ad.id, "like")}
          className="flex-row items-center gap-1.5"
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={ad.userReaction === "like" ? "thumb-up" : "thumb-up-outline"}
            size={16}
            color={ad.userReaction === "like" ? colors.primary : colors.textSecondary}
          />
          <Text
            className="text-[13px] font-medium"
            style={{ color: ad.userReaction === "like" ? colors.primary : colors.textSecondary }}
          >
            {ad.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => toggleReaction(ad.id, "dislike")}
          className="flex-row items-center gap-1.5"
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name={ad.userReaction === "dislike" ? "thumb-down" : "thumb-down-outline"}
            size={16}
            color={ad.userReaction === "dislike" ? colors.error : colors.textSecondary}
          />
          <Text
            className="text-[13px] font-medium"
            style={{ color: ad.userReaction === "dislike" ? colors.error : colors.textSecondary }}
          >
            {ad.dislikeCount}
          </Text>
        </Pressable>

        <Pressable onPress={() => onPress?.(ad)} className="flex-row items-center gap-1.5" hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
          <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
            {ad.commentCount}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default AdCard;

