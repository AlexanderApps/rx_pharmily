import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, ScrollView, ActivityIndicator, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import MaxWidthLayout from "@/shared/components/max-width-layout";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import PostCard from "@/features/posts/components/post-card";
import PostComposerTrigger from "@/features/posts/components/post-composer-trigger";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import AdCard from "@/features/ads/components/ad-card";
import NotificationBell from "@/features/notifications/components/notification-bell";
import {
  convertToCardData as convertMediscopeCardData,
  useMediscopeStore,
} from "@/features/mediscope/hooks/use-mediscope-data";
import MediscopeListCard from "@/features/mediscope/components/mediscope-list-card";
import {
  convertToCardData as convertDonationCardData,
  useDonationStore,
} from "@/features/donations/hooks/use-donation-data";
import DonationListCard from "@/features/donations/components/donation-list-card";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import JobListCard from "@/features/rxjobs/components/job-list-card";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import RxRfqCard from "@/features/rxrfqs/components/rxrfq-card";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { usePermissionsStore } from "@/features/auth/hooks/use-permissions";
import { FeedItem, rankFeed } from "@/shared/utils/home-feed-ranking";

const PAGE_SIZE = 5;

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
  { label: "RxLink", icon: "pill", color: "#0d9488", route: "/rxlink" },
  { label: "RxChat", icon: "chat-outline", color: "#0891b2", route: "/chat" },
  { label: "RxAds", icon: "bullhorn-outline", color: "#d97706", route: "/ads" },
];

// Defined once at module scope, not recreated on every HomeScreen
// render — its own identity needs to be stable for React.memo below to
// mean anything at all. Kept identical to the native (non-.web) version
// of this screen — this file previously had its own separate copy of
// this entire component that never received the same fixes, which is
// why "voting shifts the whole feed" kept happening even after the
// native version was fixed: the native and .web variants are genuinely
// separate files, not one file with a platform check inside it.
const FeedItemRow = React.memo(function FeedItemRow({ item }: { item: FeedItem }) {
  const postId = item.kind === "post" ? item.post.id : undefined;
  const adId = item.kind === "ad" ? item.ad.id : undefined;
  const mediscopeId = item.kind === "mediscope" ? item.request.id : undefined;
  const donationId = item.kind === "donation" ? item.donation.id : undefined;
  const jobId = item.kind === "job" ? item.job.id : undefined;
  const rfqId = item.kind === "rfq" ? item.rfq.id : undefined;

  const handlePostPress = useCallback(() => {
    router.push({ pathname: "/posts/post-details", params: { id: postId! } });
  }, [postId]);
  const handleAdPress = useCallback(() => {
    router.push({ pathname: "/ads/ad-market-details", params: { id: adId! } });
  }, [adId]);
  const handleMediscopePress = useCallback(() => {
    router.push({ pathname: "/mediscope/mediscope-market-details", params: { id: mediscopeId! } });
  }, [mediscopeId]);
  const handleDonationPress = useCallback(() => {
    router.push({ pathname: "/donations/donation-market-details", params: { id: donationId! } });
  }, [donationId]);
  const handleJobPress = useCallback(() => {
    router.push({ pathname: "/jobs/job-market-details", params: { id: jobId! } });
  }, [jobId]);
  const handleRfqPress = useCallback(() => {
    router.push({ pathname: "/rfqs/rxrfq-market-details", params: { id: rfqId! } });
  }, [rfqId]);

  switch (item.kind) {
    case "post":
      return (
        <View className="px-4 mt-3">
          <PostCard post={item.post} onPress={handlePostPress} />
        </View>
      );
    case "ad":
      return (
        <View className="px-4 mt-3">
          <AdCard ad={item.ad} onPress={handleAdPress} />
        </View>
      );
    case "mediscope":
      return (
        <View className="px-4 mt-3">
          <MediscopeListCard item={item.request} onPress={handleMediscopePress} />
        </View>
      );
    case "donation":
      return (
        <View className="px-4 mt-3">
          <DonationListCard donation={item.donation} onPress={handleDonationPress} />
        </View>
      );
    case "job":
      return (
        <View className="px-4 mt-3">
          <JobListCard item={item.job} onPress={handleJobPress} />
        </View>
      );
    case "rfq":
      return (
        <View className="px-4 mt-3">
          <RxRfqCard rfq={item.rfq} onPress={handleRfqPress} />
        </View>
      );
  }
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const posts = usePostsStore((state) => state.posts);
  const ads = useAdsStore((state) => state.ads);
  const mediscopeRequests = useMediscopeStore((state) => state.requests);
  const donations = useDonationStore((state) => state.donations);
  const jobs = useRxJobsStore((state) => state.jobs);
  const rxrfqs = useRxRfqsStore((state) => state.rxrfqs);
  const userRegion = useProfileStore((state) => state.user.region);
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // The last computed feed ORDER (as item keys), separate from the item
  // data itself — see the fullFeed useMemo below for why this needs to
  // exist at all: without it, a single poll vote (or any other in-place
  // data change to an already-visible item) causes the WHOLE feed to
  // visibly reshuffle, not just the one item that changed.
  const feedOrderRef = useRef<string[]>([]);

  const fullFeed = useMemo<FeedItem[]>(() => {
    const postItems: FeedItem[] = posts.map((post) => ({
      kind: "post",
      key: `post-${post.id}`,
      post,
    }));

    const adItems: FeedItem[] = ads
      .filter((a) => a.status === "approved")
      .map((ad) => ({ kind: "ad", key: `ad-${ad.id}`, ad }));

    const mediscopeItems: FeedItem[] = mediscopeRequests
      .filter((r) => r.status === "published")
      .map((r) => ({
        kind: "mediscope",
        key: `mediscope-${r.id}`,
        request: convertMediscopeCardData(r),
      }));

    const donationItems: FeedItem[] = donations
      .filter((d) => d.status === "opened")
      .map((d) => ({
        kind: "donation",
        key: `donation-${d.id}`,
        donation: convertDonationCardData(d),
      }));

    const jobItems: FeedItem[] = jobs
      .filter((j) => j.status === "open")
      .map((j) => ({ kind: "job", key: `job-${j.id}`, job: j }));

    const rfqItems: FeedItem[] = rxrfqs
      .filter((r) => r.status === "published")
      .map((r) => ({ kind: "rfq", key: `rfq-${r.id}`, rfq: r }));

    const allItems: FeedItem[] = [
      ...postItems,
      ...adItems,
      ...mediscopeItems,
      ...donationItems,
      ...jobItems,
      ...rfqItems,
    ];

    // Only re-rank when the actual SET of visible items changes — not
    // on every data tick within already-known items (a vote, a like, a
    // response count ticking up), which would otherwise visibly
    // reshuffle the whole feed. See shared/utils/home-feed-ranking.ts
    // and this same logic in the native (non-.web) version of this
    // screen for the full reasoning.
    const currentKeys = allItems.map((item) => item.key);
    const previousKeys = feedOrderRef.current;
    const sameSet =
      previousKeys.length === currentKeys.length &&
      new Set(previousKeys).size === new Set(currentKeys).size &&
      currentKeys.every((key) => previousKeys.includes(key));

    if (sameSet && previousKeys.length > 0) {
      const itemsByKey = new Map(allItems.map((item) => [item.key, item]));
      return previousKeys
        .map((key) => itemsByKey.get(key))
        .filter((item): item is FeedItem => item !== undefined);
    }

    const ranked = rankFeed(allItems, { userRegion, hasPermission });
    feedOrderRef.current = ranked.map((item) => item.key);
    return ranked;
  }, [posts, ads, mediscopeRequests, donations, jobs, rxrfqs, userRegion, hasPermission]);

  const visibleFeed = fullFeed.slice(0, visibleCount);
  const hasMore = visibleCount < fullFeed.length;

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
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

  // A trivial, stable wrapper — the actual per-kind rendering and
  // onPress logic now lives in FeedItemRow (module scope, memoized)
  // above.
  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <FeedItemRow item={item} />,
    [],
  );

  const ListHeader = useMemo(
    () => (
    <View>
      {/* Header Layout */}
      <View className="px-5 pt-4">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              RxPharmily
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              What's happening in your network
            </Text>
          </View>
          <View className="flex-row gap-2">
            <View
              className="w-[38px] h-[38px] rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <NotificationBell size={20} />
            </View>
            <Pressable
              onPress={() => router.push("/chat")}
              className="w-[38px] h-[38px] rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Search Input Bar */}
      <View className="px-5 mt-4">
        <SearchButton placeholder="Search RxPharmily..." variant="default" />
      </View>

      {/* Horizontal Navigation Links */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0 max-h-[100px]"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 16 }}
      >
        {SHORTCUTS.map((shortcut) => (
          <Pressable
            key={shortcut.label}
            onPress={() => router.push(shortcut.route as any)}
            className="items-center w-16"
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: shortcut.color + "18" }}
            >
              <MaterialCommunityIcons name={shortcut.icon} size={22} color={shortcut.color} />
            </View>
            <Text
              className="text-[11px] font-medium mt-1.5 text-center"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {shortcut.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Post Composer Target View */}
      <View className="px-5 mt-3">
        <PostComposerTrigger />
      </View>

      {/* Separator Divider */}
      <View className="h-[6px] mt-[18px]" style={{ backgroundColor: colors.border }} />
    </View>
    ),
    [colors],
  );

  const ListFooter = () => {
    if (loadingMore) {
      return (
        <View className="flex-row items-center justify-center py-6 gap-1.5">
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (!hasMore && visibleFeed.length > 0) {
      return (
        <View className="flex-row items-center justify-center py-6 gap-1.5">
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.textSecondary} />
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            You're all caught up
          </Text>
        </View>
      );
    }
    return <View className="h-6" />;
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Deliberately NOT a numColumns grid, unlike the 4 marketplace
            list containers — this feed mixes posts (unbounded text
            length, genuinely variable height) with fixed-structure
            marketplace cards. A grid needs roughly uniform row heights
            to look right; forcing these together would produce uneven,
            broken-looking rows. Width-constrained via MaxWidthLayout
            instead, keeping the existing single-column layout as-is. */}
        <MaxWidthLayout size="standard" style={{ flex: 1 }}>
          <FlatList
            data={visibleFeed}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            contentContainerStyle={{ paddingBottom: 32 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
            // maxToRenderPerBatch deliberately below PAGE_SIZE — posts
            // with media (MediaCarousel + multiple LoadingImage
            // instances) are meaningfully more expensive to mount than
            // the other 5 card types, so batching all 5 newly-paginated
            // items at once was still large enough to trip the
            // VirtualizedList "slow to update" warning.
            removeClippedSubviews={Platform.OS !== "web"}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={100}
            windowSize={5}
            initialNumToRender={3}
          />
        </MaxWidthLayout>
      </SafeAreaView>
    </ThemedView>
  );
}
