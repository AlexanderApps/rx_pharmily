import React, { useState } from "react";
import { StyleSheet, ScrollView, Pressable } from "react-native";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  "All",
  "Trending",
  "Popular",
  "Tech",
  "Design",
  "Business",
  "Health",
];

const MOCK_ITEMS = [
  {
    id: "1",
    title: "React Native Layouts",
    category: "Tech",
    desc: "Master Flexbox and UI layouts.",
  },
  {
    id: "2",
    title: "Minimalist UI Kits",
    category: "Design",
    desc: "Beautiful component guidelines.",
  },
  {
    id: "3",
    title: "AI Startup Boom",
    category: "Business",
    desc: "Where venture capital is moving.",
  },
  {
    id: "4",
    title: "Daily Stretching Routines",
    category: "Health",
    desc: "Improve posture at your desk.",
  },
  {
    id: "5",
    title: "Expo Router Tips",
    category: "Tech",
    desc: "File-based routing made simple.",
  },
  {
    id: "6",
    title: "Top 10 Fonts for 2026",
    category: "Design",
    desc: "Typography trends to follow.",
  },
  {
    id: "7",
    title: "Daily Stretching Routines",
    category: "Health",
    desc: "Improve posture at your desk.",
  },
  {
    id: "8",
    title: "Expo Router Tips",
    category: "Tech",
    desc: "File-based routing made simple.",
  },
  {
    id: "9",
    title: "Top 10 Fonts for 2026",
    category: "Design",
    desc: "Typography trends to follow.",
  },
];

export default function DiscoverScreen() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems = MOCK_ITEMS.filter(
    (item) => activeCategory === "All" || item.category === activeCategory,
  );

  return (
    // Replaced safeArea view with dynamic layout backing
    <ThemedView style={styles.safeArea}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* 1. App Screen Header */}
        <ThemedView style={styles.header}>
          <ThemedText style={styles.headerTitle}>Discover</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Explore curated topics below
          </ThemedText>
        </ThemedView>

        {/* 2. Scrollable Button Row Container */}
        <ThemedView style={styles.scrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, maxHeight: 56 }}
            contentContainerStyle={styles.scrollContainer}
          >
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  style={[
                    styles.button,
                    isActive ? styles.activeButton : styles.inactiveButton,
                  ]}
                >
                  {/* Text switches dynamically between theme engine style and white selection text */}
                  <ThemedText
                    style={[styles.buttonText, isActive && styles.activeText]}
                  >
                    {category}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </ThemedView>

        {/* 3. Content Display Area */}
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <ThemedView key={item.id} style={styles.card}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                  <ThemedView style={styles.tag}>
                    <ThemedText style={styles.tagText}>
                      {item.category}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedText style={styles.cardDesc}>{item.desc}</ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No articles found in this category.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    // paddingTop: 60, // Adjusted padding safely without native SafeAreaView import wrapper
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.6, // Relative contrast step for subheaders across themes
    marginTop: 4,
  },
  scrollWrapper: {
    paddingVertical: 15,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveButton: {
    backgroundColor: "transparent",
    borderColor: "rgba(128,128,128,0.2)", // Subtle adaptivity for borders
  },
  activeButton: {
    backgroundColor: "#10B981", // Keeps your exact active emerald filter theme green
    borderColor: "#10B981",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeText: {
    color: "#FFFFFF", // Forces contrast readability explicitly on active background state
  },
  contentContainer: {
    padding: 20,
    gap: 15,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.15)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "transparent",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  tag: {
    backgroundColor: "rgba(128,128,128,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardDesc: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    opacity: 0.5,
    fontSize: 14,
  },
});
