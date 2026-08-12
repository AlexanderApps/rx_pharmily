import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import PostCard from "@/features/posts/components/post-card";
import PostComposerTrigger from "@/features/posts/components/post-composer-trigger";
import { Post } from "@/features/posts/types/posts.types";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import AdCard from "@/features/ads/components/ad-card";
import { Ad } from "@/features/ads/types/ads.types";
import NotificationBell from "@/features/notifications/components/notification-bell";

const PAGE_SIZE = 5;
// Insert one sponsored ad after every N posts, LinkedIn-style — frequent
// enough to fund the platform, not so frequent it drowns out the feed.
const AD_INTERVAL = 4;

type FeedItem =
  | { kind: "post"; key: string; post: Post }
  | { kind: "ad"; key: string; ad: Ad };

const SHORTCUTS: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
}[] = [
  { label: "RxRFQs", icon: "file-document-outline", color: "#2563eb", route: "/rfqs" },
  { label: "Jobs", icon: "briefcase-outline", color: "#16a34a", route: "/jobs" },
  { label: "Donations", icon: "hand-heart-outline", color: "#dc2626", route: "/donations" },
  { label: "MediScope", icon: "heart-pulse", color: "#9333ea", route: "/mediscope" },
  { label: "RxChat", icon: "chat-outline", color: "#0891b2", route: "/chat" },
  { label: "RxAds", icon: "bullhorn-outline", color: "#d97706", route: "/ads" },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const posts = usePostsStore((state) => state.posts);
  const ads = useAdsStore((state) => state.ads);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // A single merged, chronologically-mixed feed — posts and sponsored ads
  // interleaved, no "view all" sections. This is the whole point of a
  // for-you-style home: everything lives in one scroll.
  const fullFeed = useMemo<FeedItem[]>(() => {
    const sortedPosts = [...posts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const liveAds = [...ads]
      .filter((a) => a.status === "approved")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items: FeedItem[] = [];
    let adCursor = 0;

    sortedPosts.forEach((post, index) => {
      items.push({ kind: "post", key: `post-${post.id}`, post });
      const isAdSlot = (index + 1) % AD_INTERVAL === 0;
      if (isAdSlot && liveAds.length > 0) {
        const ad = liveAds[adCursor % liveAds.length];
        items.push({ kind: "ad", key: `ad-${ad.id}-slot${index}`, ad });
        adCursor++;
      }
    });

    return items;
  }, [posts, ads]);

  const visibleFeed = fullFeed.slice(0, visibleCount);
  const hasMore = visibleCount < fullFeed.length;

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    // Simulate a network page fetch so the footer spinner reads honestly —
    // all data is local/mocked, but the pagination *behavior* should still
    // feel like a real infinite-scroll feed.
    setTimeout(() => {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, fullFeed.length));
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, hasMore, fullFeed.length]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setVisibleCount(PAGE_SIZE);
      setRefreshing(false);
    }, 600);
  }, []);

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.kind === "post") {
      return (
        <View style={styles.feedItemWrap}>
          <PostCard
            post={item.post}
            onPress={() =>
              router.push({
                pathname: "/posts/post-details",
                params: { id: item.post.id },
              })
            }
          />
        </View>
      );
    }
    return (
      <View style={styles.feedItemWrap}>
        <AdCard
          ad={item.ad}
          onPress={() =>
            router.push({ pathname: "/ads/ad-market-details", params: { id: item.ad.id } })
          }
        />
      </View>
    );
  };

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>RxPharmily</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              What's happening in your network
            </Text>
          </View>

          <View style={styles.headerActions}>
            <View style={[styles.actionIconBtn, { backgroundColor: colors.backgroundSecondary }]}>
              <NotificationBell size={20} />
            </View>
            <Pressable
              onPress={() => router.push("/chat")}
              style={[styles.actionIconBtn, { backgroundColor: colors.backgroundSecondary }]}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.sectionPadding}>
        <SearchButton placeholder="Search RxPharmily..." variant="default" />
      </View>

      {/* Shortcuts — quick access to every feature, LinkedIn-icon-row style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, maxHeight: 100 }}
        contentContainerStyle={styles.shortcutsRow}
      >
        {SHORTCUTS.map((shortcut) => (
          <Pressable
            key={shortcut.label}
            onPress={() => router.push(shortcut.route as any)}
            style={styles.shortcutItem}
          >
            <View
              style={[styles.shortcutIconWrap, { backgroundColor: shortcut.color + "18" }]}
            >
              <MaterialCommunityIcons name={shortcut.icon} size={22} color={shortcut.color} />
            </View>
            <Text
              style={[styles.shortcutLabel, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {shortcut.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Composer */}
      <View style={[styles.sectionPadding, { marginTop: 12 }]}>
        <PostComposerTrigger />
      </View>

      <View style={[styles.feedDivider, { backgroundColor: colors.border }]} />
    </View>
  );

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (!hasMore && visibleFeed.length > 0) {
      return (
        <View style={styles.footerState}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={18}
            color={colors.textSecondary}
          />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            You're all caught up
          </Text>
        </View>
      );
    }
    return <View style={{ height: 24 }} />;
  };

  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        <FlatList
          data={visibleFeed}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.feedContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  feedContent: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionPadding: { paddingHorizontal: 20, marginTop: 16 },
  shortcutsRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  shortcutItem: { alignItems: "center", width: 64 },
  shortcutIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: { fontSize: 11, fontWeight: "500", marginTop: 6, textAlign: "center" },
  feedDivider: {
    height: 6,
    marginTop: 18,
  },
  feedItemWrap: { paddingHorizontal: 16, marginTop: 12 },
  footerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 6,
    flexDirection: "row",
  },
  footerText: { fontSize: 12, fontWeight: "500" },
});
