import React, { useState } from "react";
import { ScrollView, Pressable } from "react-native";
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
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <ThemedView className="px-5 pb-1">
          <ThemedText className="text-[28px] font-extrabold">Discover</ThemedText>
          <ThemedText className="text-sm opacity-60 mt-1">
            Explore curated topics below
          </ThemedText>
        </ThemedView>

        {/* Category chips */}
        <ThemedView className="py-[15px]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="grow-0 max-h-14"
            contentContainerClassName="px-5 gap-2.5"
          >
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  className={`px-[18px] py-2 rounded-full border-[1.5px] items-center justify-center ${
                    isActive
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-transparent border-neutral-500/20"
                  }`}
                >
                  <ThemedText
                    className={`text-sm font-semibold ${isActive ? "text-white" : ""}`}
                  >
                    {category}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </ThemedView>

        {/* Content */}
        <ScrollView contentContainerClassName="p-5 gap-[15px]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <ThemedView
                key={item.id}
                className="p-4 rounded-xl border border-neutral-500/15"
              >
                <ThemedView className="flex-row justify-between items-center mb-1.5 bg-transparent">
                  <ThemedText className="text-base font-bold flex-1 mr-2.5">
                    {item.title}
                  </ThemedText>
                  <ThemedView className="bg-neutral-500/10 px-2 py-1 rounded-md">
                    <ThemedText className="text-[11px] font-bold uppercase">
                      {item.category}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedText className="text-sm opacity-70 leading-5">
                  {item.desc}
                </ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedView className="items-center justify-center py-10">
              <ThemedText className="opacity-50 text-sm">
                No articles found in this category.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}