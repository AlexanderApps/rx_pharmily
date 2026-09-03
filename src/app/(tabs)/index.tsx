import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, ScrollView, ActivityIndicator } from "react-native";
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
import { Post } from "@/features/posts/types/posts.types";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import AdCard from "@/features/ads/components/ad-card";
import { Ad } from "@/features/ads/types/ads.types";
import NotificationBell from "@/features/notifications/components/notification-bell";
import {
  convertToCardData as convertMediscopeCardData,
  useMediscopeStore,
} from "@/features/mediscope/hooks/use-mediscope-data";
import MediscopeListCard from "@/features/mediscope/components/mediscope-list-card";
import { MediscopeCardData } from "@/features/mediscope/types/mediscope.types";
import {
  convertToCardData as convertDonationCardData,
  useDonationStore,
} from "@/features/donations/hooks/use-donation-data";
import DonationListCard from "@/features/donations/components/donation-list-card";
import { DonationCardData } from "@/features/donations/types/donation.types";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import JobListCard from "@/features/rxjobs/components/job-list-card";
import { Job } from "@/features/rxjobs/types/rxjobs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import RxRfqCard from "@/features/rxrfqs/components/rxrfq-card";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";

const PAGE_SIZE = 5;

// A single kind per item, all mixed on equal footing — this is the "for
// you" placeholder the whole feed is built around: each source is
// filtered down to what's actually publicly available (its own
// published-equivalent status), then combined and shuffled once. A real
// ranking algorithm can slot in later without touching how the feed is
// rendered, only how fullFeed below is assembled.
type FeedItem =
  | { kind: "post"; key: string; post: Post }
  | { kind: "ad"; key: string; ad: Ad }
  | { kind: "mediscope"; key: string; request: MediscopeCardData }
  | { kind: "donation"; key: string; donation: DonationCardData }
  | { kind: "job"; key: string; job: Job }
  | { kind: "rfq"; key: string; rfq: RxRfqCardData };

// A stable (non-cryptographic) shuffle seeded from nothing but the array
// itself — good enough for "random order" as an interim stand-in for a
// real ranking algorithm. Not reseeded on every render: fullFeed's own
// useMemo already only recomputes when the underlying source arrays
// change, so items don't visibly reorder themselves while the user is
// mid-scroll or paginating.
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

export default function HomeScreen() {
  const { colors } = useTheme();
  const posts = usePostsStore((state) => state.posts);
  const ads = useAdsStore((state) => state.ads);
  const mediscopeRequests = useMediscopeStore((state) => state.requests);
  const donations = useDonationStore((state) => state.donations);
  const jobs = useRxJobsStore((state) => state.jobs);
  const rxrfqs = useRxRfqsStore((state) => state.rxrfqs);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

    return shuffle([
      ...postItems,
      ...adItems,
      ...mediscopeItems,
      ...donationItems,
      ...jobItems,
      ...rfqItems,
    ]);
  }, [posts, ads, mediscopeRequests, donations, jobs, rxrfqs]);

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

  const renderItem = ({ item }: { item: FeedItem }) => {
    switch (item.kind) {
      case "post":
        return (
          <View className="px-4 mt-3">
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
      case "ad":
        return (
          <View className="px-4 mt-3">
            <AdCard
              ad={item.ad}
              onPress={() =>
                router.push({ pathname: "/ads/ad-market-details", params: { id: item.ad.id } })
              }
            />
          </View>
        );
      case "mediscope":
        return (
          <View className="px-4 mt-3">
            <MediscopeListCard
              item={item.request}
              onPress={() =>
                router.push({
                  pathname: "/mediscope/mediscope-market-details",
                  params: { id: item.request.id },
                })
              }
            />
          </View>
        );
      case "donation":
        return (
          <View className="px-4 mt-3">
            <DonationListCard
              donation={item.donation}
              onPress={() =>
                router.push({
                  pathname: "/donations/donation-market-details",
                  params: { id: item.donation.id },
                })
              }
            />
          </View>
        );
      case "job":
        return (
          <View className="px-4 mt-3">
            <JobListCard
              item={item.job}
              onPress={() =>
                router.push({
                  pathname: "/jobs/job-market-details",
                  params: { id: item.job.id },
                })
              }
            />
          </View>
        );
      case "rfq":
        return (
          <View className="px-4 mt-3">
            <RxRfqCard
              rfq={item.rfq}
              onPress={() =>
                router.push({
                  pathname: "/rfqs/rxrfq-market-details",
                  params: { id: item.rfq.id },
                })
              }
            />
          </View>
        );
    }
  };

  const ListHeader = (
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
          />
        </MaxWidthLayout>
      </SafeAreaView>
    </ThemedView>
  );
}
