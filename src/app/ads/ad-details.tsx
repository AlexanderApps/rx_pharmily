import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ScreenHeader from "@/shared/components/screen-header";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import AdMediaCarousel from "@/features/ads/components/ad-media-carousel";
import AdStatusPill from "@/features/ads/components/ad-status-pill";
import { formatAmount } from "@/shared/utils/format";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// Owner-only management screen. Anyone browsing someone else's ad is routed
// to /ads/ad-market-details instead.
export default function AdDetailsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();

  const ads = useAdsStore((state) => state.ads);
  const isLoadingAds = useAdsStore((state) => state.isLoading);
  const deleteAd = useAdsStore((state) => state.deleteAd);
  const pauseAd = useAdsStore((state) => state.pauseAd);
  const resumeAd = useAdsStore((state) => state.resumeAd);
  const closeAd = useAdsStore((state) => state.closeAd);

  const ad = useMemo(() => ads.find((a) => a.id === id), [ads, id]);

  const isOwner = ad?.advertiser.id === currentUserId;
  const isEditable = ad?.status === "pending" || ad?.status === "rejected";

  const handleDelete = async () => {
    if (!ad) return;
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

  const handlePause = async () => {
    if (!ad) return;
    const ok = await confirm({
      title: "Pause this ad?",
      message: `"${ad.title}" will stop showing until you resume it. You can bring it back any time.`,
      confirmLabel: "Pause",
    });
    if (!ok) return;
    const success = await pauseAd(ad.id);
    toast[success ? "success" : "error"](success ? "Ad paused." : "Couldn't pause the ad.");
  };

  const handleResume = async () => {
    if (!ad) return;
    const success = await resumeAd(ad.id);
    toast[success ? "success" : "error"](success ? "Ad is live again." : "Couldn't resume the ad.");
  };

  const handleClose = async () => {
    if (!ad) return;
    const ok = await confirm({
      title: "Close this ad?",
      message: `"${ad.title}" will be permanently closed. This can't be undone — you'd need to create a new ad to advertise again.`,
      confirmLabel: "Close ad",
      destructive: true,
    });
    if (!ok) return;
    const success = await closeAd(ad.id);
    toast[success ? "success" : "error"](success ? "Ad closed." : "Couldn't close the ad.");
  };

  // A single, persistent outer wrapper for the whole component (rather
  // than a separate one per branch below) so layout doesn't remount
  // between the loading/not-found/main-content branches. This uses a
  // plain View with explicit useSafeAreaInsets() padding rather than
  // SafeAreaView — on this screen, SafeAreaView's own inset application
  // lagged a couple of frames behind the initial mount, visible as the
  // header briefly rendering under the status bar before snapping into
  // its correct position. useSafeAreaInsets() reads the same underlying
  // measurement synchronously during render, with no extra internal
  // effect/measurement step of its own to lag behind.
  let content: React.ReactNode;

  if (!ad) {
    content = isLoadingAds ? (
      <DetailSkeleton rows={3} />
    ) : (
      <Text className="p-4" style={{ color: colors.text }}>
        No ad found for id: {id}
      </Text>
    );
  } else if (!isOwner) {
    content = (
      <View className="p-4 gap-3">
        <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
          This is a management view
        </Text>
        <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
          Only {ad.advertiser.name} can manage this ad.
        </Text>
        <Pressable
          onPress={() =>
            router.replace({
              pathname: "/ads/ad-market-details",
              params: { id: ad.id },
            })
          }
          className="py-3.5 rounded-xl items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-[15px] font-semibold">View ad</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <>
      {/* Header */}
      <ScreenHeader
        title={ad.title}
        actions={
          isEditable && (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/ads/create-ad", params: { id: ad.id } })
              }
              className="p-1.5"
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.text} />
            </Pressable>
          )
        }
      />

      <ScrollView contentContainerClassName="p-4 gap-3.5">
        {/* Posted by */}
        <View className="flex-row items-center gap-2.5">
          <ClickableAvatar
            entityType="user"
            entityId={ad.advertiser.id}
            name={ad.advertiser.name}
            avatarColor={ad.advertiser.avatarColor}
            subtitle={ad.advertiser.role}
            size={36}
          />
          <View>
            <Text
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Created by
            </Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: colors.text }}>
              {ad.advertiser.name}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View className="flex-row items-center justify-between">
          <AdStatusPill status={ad.status} />
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {format(ad.createdAt)}
          </Text>
        </View>

        {!!ad.statusReason && (
          <View
            className="flex-row items-start gap-1.5 rounded-lg p-2.5"
            style={{ backgroundColor: colors.error + "12" }}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={14}
              color={colors.error}
            />
            <Text
              className="text-xs flex-1 leading-[17px]"
              style={{ color: colors.error }}
            >
              {ad.statusReason}
            </Text>
          </View>
        )}

        <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
          {ad.text}
        </Text>

        {ad.media && ad.media.length > 0 && <AdMediaCarousel media={ad.media} />}

        {ad.fdaApprovalId && (
          <View
            className="flex-row items-center gap-1.5 px-2.5 py-2 rounded-lg"
            style={{ backgroundColor: colors.success + "12" }}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={14}
              color={colors.success}
            />
            <Text className="text-xs font-semibold" style={{ color: colors.success }}>
              FDA Approved · {ad.fdaApprovalId}
            </Text>
          </View>
        )}

        {/* Plan & Payment */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Plan & Payment
        </Text>
        <View
          className="rounded-[14px] border p-3.5 gap-1.5"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Plan
            </Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {ad.plan.name}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Payment
            </Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {ad.payment.currency} {formatAmount(ad.payment.amountDue)} · {ad.payment.status}
            </Text>
            {ad.payment.status === "pending" && (
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                Reference: {ad.payment.reference}
              </Text>
            )}
          </View>
          {ad.startsAt && (
            <View className="flex-row justify-between">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Live since
              </Text>
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                {fmtDate(ad.startsAt)}
              </Text>
            </View>
          )}
          {ad.expiresAt && (
            <View className="flex-row justify-between">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Expires
              </Text>
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                {fmtDate(ad.expiresAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Engagement */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Engagement
        </Text>
        <View
          className="rounded-[14px] border p-3.5 gap-1.5"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Likes
            </Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {ad.likeCount}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Dislikes
            </Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {ad.dislikeCount}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Comments
            </Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {ad.commentCount}
            </Text>
          </View>
        </View>

        {isEditable && (
          <Pressable
            onPress={handleDelete}
            className="flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border"
            style={{ borderColor: colors.error }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
            <Text className="text-[13px] font-semibold" style={{ color: colors.error }}>
              Delete ad
            </Text>
          </Pressable>
        )}

        {ad.status === "approved" && (
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={handlePause}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border"
              style={{ borderColor: colors.border }}
            >
              <MaterialCommunityIcons name="pause-circle-outline" size={16} color={colors.text} />
              <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                Pause
              </Text>
            </Pressable>
            <Pressable
              onPress={handleClose}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border"
              style={{ borderColor: colors.error }}
            >
              <MaterialCommunityIcons name="archive-outline" size={16} color={colors.error} />
              <Text className="text-[13px] font-semibold" style={{ color: colors.error }}>
                Close ad
              </Text>
            </Pressable>
          </View>
        )}

        {ad.status === "inactive" && (
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={handleResume}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-[10px]"
              style={{ backgroundColor: colors.primary }}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={16} color="#fff" />
              <Text className="text-[13px] font-semibold text-white">Resume</Text>
            </Pressable>
            <Pressable
              onPress={handleClose}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border"
              style={{ borderColor: colors.error }}
            >
              <MaterialCommunityIcons name="archive-outline" size={16} color={colors.error} />
              <Text className="text-[13px] font-semibold" style={{ color: colors.error }}>
                Close ad
              </Text>
            </Pressable>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
      </>
    );
  }

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
      {content}
    </View>
  );
}