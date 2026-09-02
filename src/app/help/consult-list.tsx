import React, { useEffect, useMemo } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import ConsultRequestCard from "@/features/help/components/consult-request-card";
import ListSkeleton from "@/shared/components/list-skeleton";

export default function ConsultListScreen() {
  const { colors } = useTheme();
  const consultRequests = useHelpStore((state) => state.consultRequests);
  const isLoadingConsultRequests = useHelpStore((state) => state.isLoadingConsultRequests);
  const fetchConsultRequests = useHelpStore((state) => state.fetchConsultRequests);

  useEffect(() => {
    fetchConsultRequests();
  }, []);

  const sorted = useMemo(
    () => [...consultRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [consultRequests],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Header Section */}
      <ScreenHeader
        title="Consult"
        subtitle="Advice from experienced pharmacists"
        actions={
          <Pressable
            onPress={() => router.push("/help/new-consult")}
            className="w-[34px] h-[34px] rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {isLoadingConsultRequests && sorted.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState icon="account-tie-outline" message="No consult requests yet." />
          }
          renderItem={({ item }) => (
            <ConsultRequestCard
              request={item}
              onPress={() => router.push({ pathname: "/help/consult-details", params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
