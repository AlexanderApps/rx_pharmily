import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
  StyleSheet,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import AdMediaCarousel from "@/features/ads/components/ad-media-carousel";
import AdCommentRow from "@/features/ads/components/ad-comment-row";
import { toast } from "@/shared/hooks/use-toast";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// Public view — anyone browsing the feed lands here (like/dislike/comment,
// Learn More). Owners are routed to /ads/ad-details for management instead.
export default function AdMarketDetailsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const ads = useAdsStore((state) => state.ads);
  const isLoadingAds = useAdsStore((state) => state.isLoading);
  const commentsByAd = useAdsStore((state) => state.commentsByAd);
  const toggleReaction = useAdsStore((state) => state.toggleReaction);
  const addComment = useAdsStore((state) => state.addComment);
  const reportAd = useAdsStore((state) => state.reportAd);

  const listRef = useRef<FlatList>(null);
  const [commentText, setCommentText] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const ad = useMemo(() => ads.find((a) => a.id === id), [ads, id]);
  const isOwner = ad?.advertiser.id === currentUserId;
  const comments = useMemo(
    () => (id ? (commentsByAd[id] ?? []) : []),
    [commentsByAd, id],
  );

  const handleSendComment = () => {
    if (!ad || !commentText.trim()) return;
    addComment(ad.id, commentText);
    setCommentText("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const handleOpenLink = () => {
    if (ad?.linkUrl) Linking.openURL(ad.linkUrl).catch(() => {});
  };

  const handleSubmitReport = async () => {
    if (!ad || !reportReason.trim()) return;
    const ok = await reportAd(ad.id, reportReason.trim());
    if (ok) {
      toast.success("Report submitted — an admin will review it.");
      setReportModalOpen(false);
      setReportReason("");
    } else {
      toast.error("Couldn't submit the report.");
    }
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
  } else {
    content = (
      <>
      {/* Header */}
      <ScreenHeader
        title="Ad"
        actions={
          !isOwner && (
            <Pressable onPress={() => setReportModalOpen(true)} className="p-1.5">
              <MaterialCommunityIcons name="flag-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          )
        }
      />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 grow"
          ListHeaderComponent={
            <View className="mb-2 gap-3">
              {/* Sponsored label */}
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons
                  name="bullhorn-outline"
                  size={12}
                  color={colors.primary}
                />
                <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                  Sponsored
                </Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  · {format(ad.createdAt)}
                </Text>
              </View>

              {/* Advertiser */}
              <View className="flex-row items-center gap-2.5">
                <ClickableAvatar
                  entityType="user"
                  entityId={ad.advertiser.id}
                  name={ad.advertiser.name}
                  avatarColor={ad.advertiser.avatarColor}
                  subtitle={ad.advertiser.role}
                  size={40}
                />
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {ad.advertiser.name}
                  </Text>
                  <Text
                    className="text-[11px] mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {ad.advertiser.role}
                  </Text>
                </View>
              </View>

              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {ad.title}
              </Text>
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

              {ad.linkUrl && (
                <Pressable
                  onPress={handleOpenLink}
                  className="flex-row items-center justify-center gap-1.5 py-3 rounded-[10px]"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-sm font-semibold">Learn More</Text>
                  <Ionicons name="open-outline" size={14} color="#fff" />
                </Pressable>
              )}

              {/* Reactions */}
              <View
                className="flex-row gap-6 border-t border-b py-2.5"
                style={{ borderColor: colors.border }}
              >
                <Pressable
                  onPress={() => toggleReaction(ad.id, "like")}
                  className="flex-row items-center gap-1.5"
                  hitSlop={6}
                >
                  <MaterialCommunityIcons
                    name={ad.userReaction === "like" ? "thumb-up" : "thumb-up-outline"}
                    size={18}
                    color={
                      ad.userReaction === "like" ? colors.primary : colors.textSecondary
                    }
                  />
                  <Text
                    className="text-[13px] font-semibold"
                    style={{
                      color:
                        ad.userReaction === "like" ? colors.primary : colors.textSecondary,
                    }}
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
                    name={
                      ad.userReaction === "dislike" ? "thumb-down" : "thumb-down-outline"
                    }
                    size={18}
                    color={
                      ad.userReaction === "dislike" ? colors.error : colors.textSecondary
                    }
                  />
                  <Text
                    className="text-[13px] font-semibold"
                    style={{
                      color:
                        ad.userReaction === "dislike"
                          ? colors.error
                          : colors.textSecondary,
                    }}
                  >
                    {ad.dislikeCount}
                  </Text>
                </Pressable>
              </View>

              <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                Comments ({comments.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text
              className="text-[13px] text-center mt-6"
              style={{ color: colors.textSecondary }}
            >
              No comments yet.
            </Text>
          }
          renderItem={({ item }) => <AdCommentRow comment={item} />}
        />

        {/* Comment composer */}
        <View
          className="flex-row items-end gap-2 px-3 pt-2 pb-2.5 border-t"
          style={{
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          }}
        >
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 min-h-9 max-h-[100px] rounded-[18px] px-3.5 py-2 text-sm"
            style={{
              backgroundColor: colors.backgroundElement,
              color: colors.text,
            }}
            multiline
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: commentText.trim()
                ? colors.primary
                : colors.backgroundElement,
            }}
          >
            <MaterialCommunityIcons
              name="send"
              size={16}
              color={commentText.trim() ? "#fff" : colors.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

      <Modal visible={reportModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] gap-2.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              Report this ad
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Tell us what's wrong — an admin will review it.
            </Text>
            <TextInput
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              className="min-h-20 border rounded-[10px] p-3 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
              multiline
              autoFocus
            />
            <View className="flex-row gap-2.5 mt-1">
              <Pressable
                onPress={() => {
                  setReportModalOpen(false);
                  setReportReason("");
                }}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitReport}
                disabled={!reportReason.trim()}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{
                  backgroundColor: reportReason.trim() ? colors.error : colors.backgroundElement,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: reportReason.trim() ? "#fff" : colors.textSecondary }}
                >
                  Submit
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});