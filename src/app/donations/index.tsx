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
import { DonationRow } from "@/features/donations/components/donation-row";
import { DonationHsCard } from "@/features/donations/components/donation-hs-card";
import {
  convertToCardData,
  useDonationStore,
} from "@/features/donations/hooks/use-donation-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

export default function DonationsScreen() {
  const { colors } = useTheme();
  const donations = useDonationStore((state) => state.donations);

  // Animated value to track vertical scroll depth
  // Fades in the header search icon after scrolling past the static search box (~90px)
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerSearchOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const donationCards = useMemo(
    () =>
      [...donations]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map(convertToCardData),
    [donations]
  );

  // "Overview" and "My Active Donations" are the current user's own
  // donations — createdBy === user.id, the same comparison
  // convertToCardData already uses for isOwner — not "any donation my
  // facility posted", which would also count a colleague's donations.
  const myDonations = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return donations.filter((d) => d.createdBy === userId);
  }, [donations]);

  const openCount = useMemo(
    () => myDonations.filter((d) => d.status === "opened").length,
    [myDonations]
  );

  const expiringSoonCount = useMemo(
    () =>
      myDonations.reduce((count, d) => {
        const soon = d.donatedItems.filter((item) => {
          const days = daysUntil(item.expiryDate);
          return days >= 0 && days <= 30;
        }).length;
        return count + soon;
      }, 0),
    [myDonations]
  );

  // "My Active Donations" below: the current user's own most-recently-
  // created donations, excluding only ones that are settled (closed) —
  // donationCards is already sorted most-recent-first globally, so
  // filtering it down preserves that order.
  const myRecentDonations = useMemo(() => {
    const myIds = new Set(myDonations.map((d) => d.id));
    return donationCards
      .filter((d) => myIds.has(d.id) && d.status !== "closed")
      .slice(0, 3);
  }, [donationCards, myDonations]);

  const openDonationDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner
        ? "/donations/donation-details"
        : "/donations/donation-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Sticky Custom Header */}
        <View
          className="px-4 pt-3 pb-3 border-b-[0.5px]"
          style={{ borderBottomColor: colors.border }}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              {/* Backward Stack Navigation */}
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
                  Donations
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  Get and donate medications
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Dynamic Header Search Button (visible only when scrolled down) */}
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/donations/search-donations")}
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

              {/* Create — web only; native keeps the floating action
                  button below instead. */}
              {Platform.OS === "web" && (
                <Pressable
                  onPress={() => router.push("/donations/add-donation")}
                  className="w-10 h-10 rounded-xl justify-center items-center cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="add" size={22} color={colors.background} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Scrollable Main Area mapped to Animated Tracking */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-[120px]"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Main Search Button (Static Layout Placement) */}
          <View className="px-5 mt-6">
            <Pressable
              onPress={() => router.push("/donations/search-donations")}
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
                Search donations...
              </Text>
            </Pressable>
          </View>

          {/* Stats Overview */}
          <View className="px-5 mt-6">
            <Text
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Overview
            </Text>
            <View className="flex-row gap-3">
              <StatCard
                number={`${myDonations.length}`}
                label="Total Donations"
                type="info"
                colors={colors}
                onPress={() => router.push("/donations/list-donations")}
              />
              <StatCard
                number={`${openCount}`}
                label="Open"
                type="success"
                colors={colors}
                onPress={() => router.push("/donations/list-donations")}
              />
              <StatCard
                number={`${expiringSoonCount}`}
                label="Expiring Soon"
                type="warning"
                colors={colors}
                onPress={() => router.push("/donations/list-donations")}
              />
            </View>
          </View>

          {/* My Active Donations */}
          <SectionListContainer
            title="My Active Donations"
            backgroundColor={colors.backgroundSecondary}
            textColor={colors.text}
            onViewAllPress={() =>
              router.push({
                pathname: "/donations/list-donations",
                params: { mine: "true" },
              })
            }
          >
            {myRecentDonations.map((item, index, slicedArray) => (
              <DonationRow
                key={item.id}
                item={item}
                isLastItem={index === slicedArray.length - 1}
                onPress={() => openDonationDetails(item.id, item.isOwner)}
              />
            ))}
          </SectionListContainer>

          {/* Recent Donations */}
          <HorizontalScrollContainer
            title="Recent Donations"
            textColor={colors.text}
            onViewAllPress={() => router.push("/donations/list-donations")}
          >
            {donationCards
              .filter((item) => item.status === "opened")
              .slice(0, 10)
              .map((item) => (
                <DonationHsCard
                  key={item.id}
                  item={item}
                  onPress={() => openDonationDetails(item.id, item.isOwner)}
                />
              ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View className="px-5 mt-6">
            <Text
              className="text-lg font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="hand-heart-outline"
                    size={22}
                    color="#2563eb"
                  />
                }
                label="Browse"
                colors={colors}
                onPress={() => router.push("/donations/list-donations")}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="plus-box-outline"
                    size={22}
                    color="#16a34a"
                  />
                }
                label="New Donation"
                colors={colors}
                onPress={() => router.push("/donations/add-donation")}
              />
              <ActionButton
                icon={
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color="#9333ea"
                  />
                }
                label="Search"
                colors={colors}
                onPress={() => router.push("/donations/search-donations")}
              />
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Button — native only; web uses the header
            Create button instead. */}
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.push("/donations/add-donation")}
          className="absolute right-6 bottom-8 w-16 h-16 rounded-full justify-center items-center shadow-lg active:opacity-90 cursor-pointer hover:opacity-90"
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