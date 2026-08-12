import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import AdMediaCarousel from "@/features/ads/components/ad-media-carousel";
import AdCommentRow from "@/features/ads/components/ad-comment-row";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "-";

// Public view — anyone browsing the feed lands here (like/dislike/comment,
// Learn More). Owners are routed to /ads/ad-details for management instead.
export default function AdMarketDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const ads = useAdsStore((state) => state.ads);
  const isLoadingAds = useAdsStore((state) => state.isLoading);
  const commentsByAd = useAdsStore((state) => state.commentsByAd);
  const toggleReaction = useAdsStore((state) => state.toggleReaction);
  const addComment = useAdsStore((state) => state.addComment);

  const listRef = useRef<FlatList>(null);
  const [commentText, setCommentText] = useState("");

  const ad = useMemo(() => ads.find((a) => a.id === id), [ads, id]);
  const comments = useMemo(() => (id ? commentsByAd[id] ?? [] : []), [commentsByAd, id]);

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

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(ad.id, commentText);
    setCommentText("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const handleOpenLink = () => {
    if (ad.linkUrl) Linking.openURL(ad.linkUrl).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ad</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={{ marginBottom: 8, gap: 12 }}>
              <View style={styles.sponsoredRow}>
                <MaterialCommunityIcons name="bullhorn-outline" size={12} color={colors.primary} />
                <Text style={[styles.sponsoredText, { color: colors.primary }]}>Sponsored</Text>
                <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
                  · {format(ad.createdAt)}
                </Text>
              </View>

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
                  <Text style={[styles.authorName, { color: colors.text }]}>{ad.advertiser.name}</Text>
                  <Text style={[styles.authorRole, { color: colors.textSecondary }]}>
                    {ad.advertiser.role}
                  </Text>
                </View>
              </View>

              <Text style={[styles.title, { color: colors.text }]}>{ad.title}</Text>
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

              {ad.linkUrl && (
                <Pressable
                  onPress={handleOpenLink}
                  style={[styles.linkButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.linkButtonText}>Learn More</Text>
                  <Ionicons name="open-outline" size={14} color="#fff" />
                </Pressable>
              )}

              <View style={[styles.actionsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                <Pressable
                  onPress={() => toggleReaction(ad.id, "like")}
                  style={styles.actionButton}
                  hitSlop={6}
                >
                  <MaterialCommunityIcons
                    name={ad.userReaction === "like" ? "thumb-up" : "thumb-up-outline"}
                    size={18}
                    color={ad.userReaction === "like" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[styles.actionText, { color: ad.userReaction === "like" ? colors.primary : colors.textSecondary }]}
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
                    size={18}
                    color={ad.userReaction === "dislike" ? colors.error : colors.textSecondary}
                  />
                  <Text
                    style={[styles.actionText, { color: ad.userReaction === "dislike" ? colors.error : colors.textSecondary }]}
                  >
                    {ad.dislikeCount}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.commentsHeading, { color: colors.textSecondary }]}>
                Comments ({comments.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No comments yet.
            </Text>
          }
          renderItem={({ item }) => <AdCommentRow comment={item} />}
        />

        <View style={[styles.composer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
            multiline
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: commentText.trim() ? colors.primary : colors.backgroundElement },
            ]}
          >
            <MaterialCommunityIcons
              name="send"
              size={16}
              color={commentText.trim() ? "#fff" : colors.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  listContent: { padding: 16, flexGrow: 1 },
  sponsoredRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sponsoredText: { fontSize: 12, fontWeight: "700" },
  timeAgo: { fontSize: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  authorName: { fontSize: 14, fontWeight: "600" },
  authorRole: { fontSize: 11, marginTop: 1 },
  title: { fontSize: 18, fontWeight: "700" },
  text: { fontSize: 14, lineHeight: 20 },
  fdaRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  fdaText: { fontSize: 12, fontWeight: "600" },
  linkButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  linkButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 24, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 13, fontWeight: "600" },
  commentsHeading: { fontSize: 12, fontWeight: "600" },
  emptyText: { fontSize: 13, textAlign: "center", marginTop: 24 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 36, maxHeight: 100, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
