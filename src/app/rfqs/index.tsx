import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
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
import { HorizontalRequestCard } from "@/features/rxrfqs/components/hs-card-container";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { RequestCardRow } from "@/features/rxrfqs/components/request-card-row";

export default function RxRfqScreen() {
  const { colors } = useTheme();
  const nearByRequests = useRxRfqsStore((state) => state.rxrfqs);

  // Animated value to track vertical scroll depth
  // Fades in the header search icon after scrolling past the static search box (~90px)
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerSearchOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const activeRequests = [
    {
      id: 1,
      medication: "Enoxaparin",
      strength: "40mg Injection",
      responses: 3,
      status: "responses",
      time: "2h ago",
    },
    {
      id: 2,
      medication: "Cefuroxime",
      strength: "500mg Tablet",
      responses: 1,
      status: "responses",
      time: "5h ago",
    },
    {
      id: 3,
      medication: "Salbutamol Inhaler",
      strength: "100mcg",
      responses: 0,
      status: "waiting",
      time: "1d ago",
    },
  ];

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
                  RxRFQs
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Get quotes for your medications
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Dynamic Header Search Button (visible only when scrolled down) */}
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/rfqs/search-rfqs")}
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

              {/* Prominent Filter Button Layout */}
              <Pressable
                style={[
                  styles.actionIconBtn,
                  styles.filterBtnActive,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.text}
                />
              </Pressable>
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
              onPress={() => router.push("/rfqs/search-rfqs")}
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
                Search medication...
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
                number="3"
                label="My Requests"
                type="success"
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/rfqs/my-rfqs",
                    params: { filter: "active" },
                  })
                }
              />
              <StatCard
                number="7"
                label="Responses"
                type="info"
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/rfqs/my-rfqs",
                    params: { filter: "active" },
                  })
                }
              />
              <StatCard
                number="2"
                label="Awaiting"
                type="warning"
                colors={colors}
                onPress={() =>
                  router.push({
                    pathname: "/rfqs/my-rfqs",
                    params: { filter: "active" },
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
            {nearByRequests.slice(0, 3).map((item, index, slicedArray) => (
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
              .filter((data) => {
                return data.facilityLocation === "Accra";
              })
              .map((item, index) => (
                <HorizontalRequestCard
                  key={index}
                  item={item}
                  onPress={() => nearByRequestsAction(item.id)}
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

        {/* Floating Action Button */}
        <Pressable
          onPress={() => router.push("/rfqs/add-rfqs")}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary || "#16a34a" },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons
            name="add"
            size={30}
            color={colors.background || "#ffffff"}
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
  filterBtnActive: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
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
