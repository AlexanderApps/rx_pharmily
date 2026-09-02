import React, { useMemo, useRef } from "react";
import { View, Text, Pressable, Animated, Platform} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ActionButton from "@/shared/components/action-button";
import StatCard from "@/shared/components/stat-card";
import { SectionListContainer } from "@/shared/components/section-list-container";
import { HorizontalScrollContainer } from "@/shared/components/hs-section-container";
import { MediscopeRow } from "@/features/mediscope/components/mediscope-row";
import { MediscopeHsCard } from "@/features/mediscope/components/mediscope-hs-card";
import {
  convertToCardData,
  useMediscopeStore,
} from "@/features/mediscope/hooks/use-mediscope-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

export default function MediscopeScreen() {
  const { colors } = useTheme();
  const requests = useMediscopeStore((state) => state.requests);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerSearchOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const cards = useMemo(
    () =>
      [...requests]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map(convertToCardData),
    [requests],
  );

  // "Overview" is the current user's own requests — createdBy ===
  // user.id, the same comparison convertToCardData already uses for
  // isOwner — not "any request my facility posted". "Recent Requests"/
  // "Browse" below stay global on purpose, same as rxrfq's "Nearby
  // Requests" and donations' "Recent Donations".
  const myRequests = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return requests.filter((r) => r.createdBy === userId);
  }, [requests]);

  const publishedCount = myRequests.filter((r) => r.status === "published").length;
  const fulfilledCount = myRequests.filter((r) => r.status === "fulfilled").length;

  // "My MediScope Requests" below: the current user's own most-recently-
  // created requests, excluding ones that are settled (closed/cancelled).
  // myRequests is already the raw (unresolved) data; cards is the
  // already-resolved card view MediscopeRow expects — filtering the
  // latter by an id set from the former gets both the right scope and
  // correctly-populated cards.
  const myRecentRequests = useMemo(() => {
    const myIds = new Set(
      myRequests
        .filter((r) => r.status !== "closed" && r.status !== "cancelled")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map((r) => r.id),
    );
    return cards.filter((c) => myIds.has(c.id));
  }, [myRequests, cards]);

  const openDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner
        ? "/mediscope/mediscope-details"
        : "/mediscope/mediscope-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Sticky Custom Header */}
        <View
          className="border-b px-4 pb-3 pt-3"
          style={{ borderBottomColor: colors.border, borderBottomWidth: 0.5 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              {Platform.OS !== "web" && (
              <Pressable onPress={() => router.back()} className="mr-3 p-1">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              )}
              <View>
                <Text
                  className="text-2xl font-bold"
                  style={{ color: colors.text }}
                >
                  MediScope
                </Text>
                <Text
                  className="mt-0.5 text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Find where a product is available
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/mediscope/search-mediscope")}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                >
                  <Ionicons name="search-outline" size={20} color={colors.text} />
                </Pressable>
              </Animated.View>

              {/* Create — web only; native keeps the floating action
                  button below instead. */}
              {Platform.OS === "web" && (
                <Pressable
                  onPress={() => router.push("/mediscope/add-mediscope-request")}
                  className="h-10 w-10 items-center justify-center rounded-xl cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="add" size={22} color={colors.background} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Search */}
          <View className="mt-6 px-5">
            <Pressable
              onPress={() => router.push("/mediscope/search-mediscope")}
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
                className="ml-3 flex-1 text-base"
                style={{ color: colors.textSecondary }}
              >
                Search for a product...
              </Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View className="mt-6 px-5">
            <Text
              className="mb-3 text-lg font-semibold"
              style={{ color: colors.text }}
            >
              Overview
            </Text>
            <View className="flex-row gap-3">
              <StatCard
                number={`${myRequests.length}`}
                label="All Requests"
                type="info"
                colors={colors}
                onPress={() => router.push("/mediscope/list-mediscope")}
              />
              <StatCard
                number={`${publishedCount}`}
                label="Open"
                type="success"
                colors={colors}
                onPress={() => router.push("/mediscope/list-mediscope")}
              />
              <StatCard
                number={`${fulfilledCount}`}
                label="Fulfilled"
                type="warning"
                colors={colors}
                onPress={() => router.push("/mediscope/list-mediscope")}
              />
            </View>
          </View>

          {/* My requests preview */}
          <SectionListContainer
            title="My MediScope Requests"
            backgroundColor={colors.backgroundSecondary}
            textColor={colors.text}
            onViewAllPress={() =>
              router.push({
                pathname: "/mediscope/list-mediscope",
                params: { mine: "true" },
              })
            }
          >
            {myRecentRequests.map((item, index, slicedArray) => (
              <MediscopeRow
                key={item.id}
                item={item}
                isLastItem={index === slicedArray.length - 1}
                onPress={() => openDetails(item.id, item.isOwner)}
              />
            ))}
          </SectionListContainer>

          {/* Horizontal browse */}
          <HorizontalScrollContainer
            title="Browse"
            textColor={colors.text}
            onViewAllPress={() => router.push("/mediscope/list-mediscope")}
          >
            {cards
              .filter((item) => item.status === "published")
              .slice(0, 10)
              .map((item) => (
                <MediscopeHsCard
                  key={item.id}
                  item={item}
                  onPress={() => openDetails(item.id, item.isOwner)}
                />
              ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View className="mt-6 px-5">
            <Text
              className="mb-3 text-lg font-semibold"
              style={{ color: colors.text }}
            >
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color="#2563eb"
                  />
                }
                label="Browse"
                colors={colors}
                onPress={() => router.push("/mediscope/list-mediscope")}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="plus-box-outline"
                    size={22}
                    color="#16a34a"
                  />
                }
                label="New Request"
                colors={colors}
                onPress={() => router.push("/mediscope/add-mediscope-request")}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="magnify-scan"
                    size={22}
                    color="#9333ea"
                  />
                }
                label="Search"
                colors={colors}
                onPress={() => router.push("/mediscope/search-mediscope")}
              />
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Button — native only; web uses the header
            Create button instead. */}
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.push("/mediscope/add-mediscope-request")}
          className="absolute bottom-8 right-6 h-16 w-16 items-center justify-center rounded-full shadow-lg active:opacity-90 cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: colors.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={30} color={colors.background} />
        </Pressable>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}