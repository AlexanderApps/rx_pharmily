import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, ScrollView, ActivityIndicator, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import MaxWidthLayout from "@/shared/components/max-width-layout";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import { toast } from "@/shared/hooks/use-toast";
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
// mean anything at all. Each case builds its onPress via useCallback,
// scoped to just that item's id, rather than the previous inline
// `onPress={() => router.push(...)}` inside the old renderItem switch —
// that created a brand-new function on every single call (which
// happens once per visible row, on every re-render of the whole feed),
// which would have silently defeated React.memo on the card components
// below even after wrapping them: a new function reference on every
// render is never shallow-equal to the last one, so memo's comparison
// would never actually short-circuit anything.
const FeedItemRow = React.memo(function FeedItemRow({ item }: { item: FeedItem }) {
  // Narrowed per-kind up front (undefined for every kind but the
  // matching one) so each useCallback below can depend on a plain,
  // properly-typed string instead of an `as any` cast on the whole
  // union — same runtime behavior, no unsafe casts.
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
          <MediscopeListCard item={item.request} onPress={handleMediscopePress} showStatus={false} />
        </View>
      );
    case "donation":
      return (
        <View className="px-4 mt-3">
          <DonationListCard donation={item.donation} onPress={handleDonationPress} showStatus={false} />
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
          <RxRfqCard rfq={item.rfq} onPress={handleRfqPress} showStatus={false} />
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
  const fetchPosts = usePostsStore((state) => state.fetchPosts);
  const fetchAds = useAdsStore((state) => state.fetchAds);
  const fetchMediscopeRequests = useMediscopeStore((state) => state.fetchRequests);
  const fetchDonations = useDonationStore((state) => state.fetchDonations);
  const fetchJobs = useRxJobsStore((state) => state.fetchJobs);
  const fetchRxRfqs = useRxRfqsStore((state) => state.fetchRxRfqs);
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

    // rankFeed's recencyScore is computed against Date.now() fresh on
    // every call — necessarily, since "how recent is this" only makes
    // sense relative to the current moment. But that means calling it
    // on every single change to posts/ads/etc (including something as
    // small as one post's poll vote count ticking up) could very
    // occasionally flip the relative order of two items with nearly
    // identical scores but different kinds — and since
    // interleaveByKind's round-robin order depends on which kind is
    // encountered FIRST in the sorted list, one borderline flip cascades
    // into a visibly different order for the ENTIRE feed, not just the
    // one item that actually changed. Only re-ranking when the actual
    // SET of visible items changes (not just their data) avoids this —
    // a vote, a like, a response count ticking up all update the data
    // shown for that one card without moving anything on screen.
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // A successful refresh that happens to find no new content looks
    // identical, on screen, to one that silently failed — nothing
    // changes either way. Comparing total counts before/after is what
    // lets a genuinely successful "you're already caught up" refresh
    // tell itself apart from that, confirmed by a debugging pass that
    // traced an earlier "pull-to-refresh isn't working" report to
    // exactly this: the refetch was succeeding the whole time.
    const countBefore =
      posts.length + ads.length + mediscopeRequests.length + donations.length + jobs.length + rxrfqs.length;

    // Promise.allSettled rather than Promise.all — one source failing
    // to refresh shouldn't prevent the other 5 from actually updating,
    // which Promise.all's reject-on-first-failure behavior would do.
    const results = await Promise.allSettled([
      fetchPosts(),
      fetchAds(),
      fetchMediscopeRequests(),
      fetchDonations(),
      fetchJobs(),
      fetchRxRfqs(),
    ]);
    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      console.warn(`[home-feed] ${failedCount} of 6 refresh sources failed`);
    }

    // Read via getState(), not the posts/ads/etc. variables above —
    // those are fixed at the time this callback was created and would
    // still show the pre-refresh values here regardless of what the
    // stores actually did.
    const countAfter =
      usePostsStore.getState().posts.length +
      useAdsStore.getState().ads.length +
      useMediscopeStore.getState().requests.length +
      useDonationStore.getState().donations.length +
      useRxJobsStore.getState().jobs.length +
      useRxRfqsStore.getState().rxrfqs.length;

    if (failedCount === 0 && countAfter <= countBefore) {
      toast.info("You're all caught up");
    }

    setVisibleCount(PAGE_SIZE);
    setRefreshing(false);
  }, [fetchPosts, fetchAds, fetchMediscopeRequests, fetchDonations, fetchJobs, fetchRxRfqs]);

  // A trivial, stable wrapper — the actual per-kind rendering and
  // onPress logic now lives in FeedItemRow (module scope, memoized)
  // above. useCallback here matters for FlatList's own internal use of
  // renderItem's identity, on top of (not instead of) FeedItemRow's own
  // memoization.
  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <FeedItemRow item={item} />,
    [],
  );

  const ListHeader = useMemo(
    () => (
    <View>
      {/* Header section */}
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
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <NotificationBell size={20} />
            </View>
            <Pressable
              onPress={() => router.push("/chat")}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Search section */}
      <View className="px-5 mt-4">
        <SearchButton placeholder="Search RxPharmily..." variant="default" />
      </View>

      {/* Shortcuts section */}
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

      {/* Composer section */}
      <View className="px-5 mt-3">
        <PostComposerTrigger />
      </View>
      
      {/* Divider line */}
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
            // Tuned specifically against the "large list is slow to
            // update" VirtualizedList warning — the default windowSize
            // (21, meaning ~10 screens worth of content rendered above
            // and below the viewport) is too aggressive for a feed
            // mixing 6 different, sometimes image-heavy card types.
            // removeClippedSubviews is native-only: react-native-web's
            // implementation has a history of incorrectly hiding
            // content, not just an unnecessary optimization there.
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
