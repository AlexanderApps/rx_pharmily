import React, { useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(convertToCardData),
    [requests],
  );

  const publishedCount = requests.filter((r) => r.status === "published").length;
  const fulfilledCount = requests.filter((r) => r.status === "fulfilled").length;

  const openDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner ? "/mediscope/mediscope-details" : "/mediscope/mediscope-market-details",
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
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>MediScope</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Find where a product is available
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Animated.View style={{ opacity: headerSearchOpacity }}>
                <Pressable
                  onPress={() => router.push("/mediscope/search-mediscope")}
                  style={[styles.actionIconBtn, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Ionicons name="search-outline" size={20} color={colors.text} />
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {/* Search */}
          <View style={styles.sectionPadding}>
            <Pressable
              onPress={() => router.push("/mediscope/search-mediscope")}
              style={({ pressed }) => [
                styles.searchBox,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.searchText, { color: colors.textSecondary }]}>
                Search for a product...
              </Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
            <View style={styles.statsRow}>
              <StatCard
                number={`${requests.length}`}
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
            title="Recent Requests"
            backgroundColor={colors.backgroundSecondary}
            textColor={colors.text}
            onViewAllPress={() => router.push("/mediscope/list-mediscope")}
          >
            {cards.slice(0, 3).map((item, index, slicedArray) => (
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
            {cards.map((item) => (
              <MediscopeHsCard key={item.id} item={item} onPress={() => openDetails(item.id, item.isOwner)} />
            ))}
          </HorizontalScrollContainer>

          {/* Quick Actions */}
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.statsRow}>
              <ActionButton
                icon={<MaterialCommunityIcons name="magnify" size={22} color="#2563eb" />}
                label="Browse"
                colors={colors}
                onPress={() => router.push("/mediscope/list-mediscope")}
              />
              <ActionButton
                icon={<MaterialCommunityIcons name="plus-box-outline" size={22} color="#16a34a" />}
                label="New Request"
                colors={colors}
                onPress={() => router.push("/mediscope/add-mediscope-request")}
              />
              <ActionButton
                icon={<MaterialCommunityIcons name="magnify-scan" size={22} color="#9333ea" />}
                label="Search"
                colors={colors}
                onPress={() => router.push("/mediscope/search-mediscope")}
              />
            </View>
          </View>
        </Animated.ScrollView>

        {/* Floating Action Button */}
        <Pressable
          onPress={() => router.push("/mediscope/add-mediscope-request")}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="add" size={30} color={colors.background} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeftGroup: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionIconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  sectionPadding: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchText: { flex: 1, marginLeft: 12, fontSize: 16 },
  statsRow: { flexDirection: "row", gap: 12 },
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
