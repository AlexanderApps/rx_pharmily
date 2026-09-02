import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import FaqAccordionItem from "@/features/help/components/faq-accordion-item";

export default function FaqScreen() {
  const { colors } = useTheme();
  const faqItems = useHelpStore((state) => state.faqItems);
  const fetchFaqItems = useHelpStore((state) => state.fetchFaqItems);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchFaqItems();
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqItems;
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [faqItems, search]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header Bar */}
      <ScreenHeader title="FAQ" />

      {/* Search Input Section */}
      <View className="px-4 pt-3.5 pb-1">
        <View className="flex-row items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: colors.backgroundElement }}>
          <Ionicons name="search" size={17} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search questions..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-sm p-0"
            style={{ color: colors.text }}
          />
        </View>
      </View>

      {/* Accordion List Content */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <Text className="text-center mt-6" style={{ color: colors.textSecondary }}>
            No matching questions.
          </Text>
        }
        renderItem={({ item }) => <FaqAccordionItem item={item} />}
      />
    </SafeAreaView>
  );
}
