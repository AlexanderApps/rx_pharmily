import React, { useEffect, useMemo } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import PharmacistQuestionCard from "@/features/help/components/pharmacist-question-card";
import EmergencyBanner from "@/features/help/components/emergency-banner";
import ListSkeleton from "@/shared/components/list-skeleton";
import ScreenHeader from "@/shared/components/screen-header";

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Navigation Header Section */}
      <ScreenHeader
        title="Ask Your Pharmacist"
        subtitle="General medication questions"
        actions={
          <Pressable
            onPress={() => router.push("/help/new-question")}
            className="w-[34px] h-[34px] rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {isLoadingQuestions && sorted.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListHeaderComponent={
            <View className="mb-3">
              <EmergencyBanner variant="inline" />
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center gap-2.5 pt-[60px]">
              <MaterialCommunityIcons name="pill" size={36} color={colors.textSecondary} />
              <Text className="text-[13px]" style={{ color: colors.textSecondary }}>No questions yet.</Text>
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
