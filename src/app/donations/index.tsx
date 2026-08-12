import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
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
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map(convertToCardData),
    [donations],
  );

  const openCount = useMemo(
    () => donations.filter((d) => d.status === "opened").length,
    [donations],
  );

  const expiringSoonCount = useMemo(
    () =>
      donations.reduce((count, d) => {
        const soon = d.donatedItems.filter((item) => {
          const days = daysUntil(item.expiryDate);
          return days >= 0 && days <= 30;
        }).length;
        return count + soon;
      }, 0),
    [donations],
  );

  const openDonationDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner ? "/donations/donation-details" : "/donations/donation-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        {/* Sticky Custom Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              {/* Backward Stack Navigation */}
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>

              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Donations
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Get and donate medications
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Dynamic Header Search Button (visible only when scrolled down) */}
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/donations/search-donations")}
                  style={[
                    styles.actionIconBtn,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Scrollable Main Area mapped to Animated Tracking */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Main Search Button (Static Layout Placement) */}
          <View style={styles.sectionPadding}>
            <Pressable
              onPress={() => router.push("/donations/search-donations")}
              style={({ pressed }) => [
                styles.searchBox,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.searchText, { color: colors.textSecondary }]}
              >
                Search donations...
              </Text>
            </Pressable>
          </View>

          {/* Stats Overview */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Overview
            </Text>

            <View style={styles.statsRow}>
              <StatCard
                number={`${donations.length}`}
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
            onViewAllPress={() => router.push("/donations/list-donations")}
          >
            {donationCards
              .filter((d) => d.status === "opened")
              .slice(0, 3)
              .map((item, index, slicedArray) => (
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
            {donationCards.map((item) => (
              <DonationHsCard
                key={item.id}
                item={item}
                onPress={() => openDonationDetails(item.id, item.isOwner)}
              />
            ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.statsRow}>
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

        {/* Floating Action Button */}
        <Pressable
          onPress={() => router.push("/donations/add-donation")}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons
            name="add"
            size={30}
            color={colors.background}
          />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionPadding: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
