import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated, Platform} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ActionButton from "@/shared/components/action-button";
import StatCard from "@/shared/components/stat-card";
import { SectionListContainer } from "@/shared/components/section-list-container";
import { HorizontalScrollContainer } from "@/shared/components/hs-section-container";
import { HorizontalRequestCard } from "@/features/rxrfqs/components/hs-card-container";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { RequestCardRow } from "@/features/rxrfqs/components/request-card-row";

export default function RxRfqScreen() {
  const { colors } = useTheme();
  const nearByRequests = useRxRfqsStore((state) => state.rxrfqs);
  const rxrfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);

  // Animated value to track vertical scroll depth
  // Fades in the header search icon after scrolling past the static search box (~90px)
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerSearchOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // "Overview" is the current user's own RFQs — createdBy === user.id,
  // the same comparison every isOwner field in this app already uses —
  // not "any RFQ my facility posted", which would also count a
  // colleague's requests.
  const overviewStats = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    const myActiveRequests = rxrfqMarketPlace.filter(
      (rfq) => rfq.createdBy === userId && rfq.status === "published",
    );
    const totalResponses = myActiveRequests.reduce(
      (sum, rfq) => sum + rfq.responseCount,
      0,
    );
    const awaitingDecision = myActiveRequests.filter(
      (rfq) => rfq.responseCount > 0,
    ).length;

    return {
      activeCount: myActiveRequests.length,
      totalResponses,
      awaitingDecision,
    };
  }, [rxrfqMarketPlace]);

  // "My Active RxRFQs" below: the current user's own most-recently-created
  // requests, excluding ones that are settled (closed/cancelled) rather
  // than actually active or still awaiting a decision. Sorted by createdAt
  // from the raw rxrfqMarketPlace data (a draft RFQ may have no meaningful
  // publishedAt yet), then displayed via rxrfqs, the already-resolved card
  // view RequestCardRow expects.
  const myRecentRfqs = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    const myOwnRfqs = rxrfqMarketPlace
      .filter(
        (rfq) =>
          rfq.createdBy === userId &&
          rfq.status !== "closed" &&
          rfq.status !== "cancelled",
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    const cardsById = new Map(nearByRequests.map((card) => [card.id, card]));
    return myOwnRfqs
      .map((rfq) => cardsById.get(rfq.id))
      .filter((card): card is RxRfqCardData => !!card);
  }, [rxrfqMarketPlace, nearByRequests]);

  const nearByRequestsAction = (id: string) => {
    router.push({
      pathname: "/rfqs/rxrfq-market-details",
      params: { id },
    });
  };

  const myRequestsAction = (id: string) => {
    router.push({
      pathname: "/rfqs/rxrfq-details-screen",
      params: { id },
    });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Sticky Custom Header */}
        <View className="px-4 pt-3 pb-3 border-b-[0.5px]" style={{ borderBottomColor: colors.border }}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              {/* Backward Stack Navigation */}
              {Platform.OS !== "web" && (
              <Pressable
                onPress={() => router.back()}
                className="mr-3 p-1"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              )}

              <View>
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  RxRFQs
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  Get quotes for your medications
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Dynamic Header Search Button (visible only when scrolled down) */}
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/rfqs/search-rfqs")}
                  className="w-10 h-10 rounded-xl justify-center items-center"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </Animated.View>

              {/* Prominent Filter Button Layout */}
              <Pressable
                className="w-10 h-10 rounded-xl justify-center items-center border"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: "rgba(0,0,0,0.05)",
                }}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.text}
                />
              </Pressable>

              {/* Create — web only; native keeps the floating action
                  button below instead, which is the mobile-appropriate
                  affordance for this action. */}
              {Platform.OS === "web" && (
                <Pressable
                  onPress={() => router.push("/rfqs/add-rfqs")}
                  className="w-10 h-10 rounded-xl justify-center items-center cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="add" size={22} color={colors.background || "#ffffff"} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Scrollable Main Area mapped to Animated Tracking */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Main Search Button (Static Layout Placement) */}
          <View className="px-5 mt-6">
            <Pressable
              onPress={() => router.push("/rfqs/search-rfqs")}
              className="flex-row items-center rounded-2xl border px-4 py-3 active:opacity-70"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                className="flex-1 ml-3 text-base"
                style={{ color: colors.textSecondary }}
              >
                Search medication...
              </Text>
            </Pressable>
          </View>

          {/* Stats Overview */}
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Overview
            </Text>

            <View className="flex-row gap-3">
              <StatCard
                number={overviewStats.activeCount.toString()}
                label="Active Requests"
                type="success"
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/rfqs/my-rfqs",
                    params: { filter: "published" },
                  })
                }
              />
              <StatCard
                number={overviewStats.totalResponses.toString()}
                label="Responses"
                type="info"
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/rfqs/my-rfqs",
                    params: { filter: "published" },
                  })
                }
              />
              <StatCard
                number={overviewStats.awaitingDecision.toString()}
                label="Awaiting"
                type="warning"
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/rfqs/my-rfqs",
                    params: { filter: "published" },
                  })
                }
              />
            </View>
          </View>

          {/* My RxRFQs */}
          <SectionListContainer
            title={"My Active RxRFQs"}
            backgroundColor={colors.backgroundSecondary}
            textColor={colors.text}
            onViewAllPress={() => router.push("/rfqs/my-rfqs")}
          >
            {myRecentRfqs.map((item, index, slicedArray) => (
              <RequestCardRow
                key={item.id}
                item={item}
                isLastItem={index === slicedArray.length - 1}
                onPress={() => myRequestsAction(item.id)}
              />
            ))}
          </SectionListContainer>

          {/* Nearby Requests */}
          <HorizontalScrollContainer
            title={"Nearby Requests"}
            textColor={colors.text}
            onViewAllPress={() => router.push("/rfqs/list-rfqs")}
          >
            {nearByRequests
              .filter(
                (data) =>
                  data.facilityLocation === "Accra" && data.status === "published",
              )
              .slice(0, 10)
              .map((item, index) => (
                <HorizontalRequestCard
                  key={index}
                  item={item}
                  onPress={() => nearByRequestsAction(item.id)}
                />
              ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View className="px-5 mt-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="needle"
                    size={22}
                    color="#2563eb"
                  />
                }
                label="Respond"
                colors={colors}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={22}
                    color="#16a34a"
                  />
                }
                label="Messages"
                colors={colors}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={22}
                    color="#9333ea"
                  />
                }
                label="Completed"
                colors={colors}
              />
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Button — native only; web uses the header
            Create button instead. */}
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.push("/rfqs/add-rfqs")}
          className="absolute right-6 bottom-8 w-16 h-16 rounded-full justify-center items-center shadow-lg active:opacity-90 cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: colors.primary || "#16a34a",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons
            name="add"
            size={30}
            color={colors.background || "#ffffff"}
          />
        </Pressable>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}
