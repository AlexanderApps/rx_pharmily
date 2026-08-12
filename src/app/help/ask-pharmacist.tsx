import React, { useEffect, useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import PharmacistQuestionCard from "@/features/help/components/pharmacist-question-card";
import EmergencyBanner from "@/features/help/components/emergency-banner";
import ListSkeleton from "@/shared/components/list-skeleton";

export default function AskPharmacistScreen() {
  const { colors } = useTheme();
  const questions = useHelpStore((state) => state.questions);
  const isLoadingQuestions = useHelpStore((state) => state.isLoadingQuestions);
  const fetchQuestions = useHelpStore((state) => state.fetchQuestions);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const sorted = useMemo(
    () => [...questions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [questions],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Ask Your Pharmacist</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            General medication questions
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/help/new-question")}
          style={[styles.newButton, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoadingQuestions && sorted.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <EmergencyBanner variant="inline" />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="pill" size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No questions yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PharmacistQuestionCard
              item={item}
              onPress={() => router.push({ pathname: "/help/question-details", params: { id: item.id } })}
            />
          )}
        />
      )}
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
  subtitle: { fontSize: 12, marginTop: 1 },
  newButton: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 60 },
});
