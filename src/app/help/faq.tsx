import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>FAQ</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
          <Ionicons name="search" size={17} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search questions..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 24 }}>
            No matching questions.
          </Text>
        }
        renderItem={({ item }) => <FaqAccordionItem item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  listContent: { padding: 16 },
});
