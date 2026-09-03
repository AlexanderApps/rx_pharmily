import React, { useEffect, useMemo } from "react";
import { View, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import ListSkeleton from "@/shared/components/list-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useRxLinkStore } from "@/features/rxlink/hooks/use-rxlink-data";
import RxLinkRequestCard from "@/features/rxlink/components/rxlink-request-card";

export default function RxLinkListScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const requests = useRxLinkStore((state) => state.requests);
  const isLoading = useRxLinkStore((state) => state.isLoading);
  const fetchRequests = useRxLinkStore((state) => state.fetchRequests);

  useEffect(() => {
    fetchRequests();
  }, []);

  const myRequests = useMemo(
    () =>
      requests
        .filter((r) => r.createdBy === currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requests, currentUserId],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader
        title="RxLink"
        subtitle="Find where your medication is available"
        actions={
          <Pressable
            onPress={() => router.push("/rxlink/new-request")}
            className="w-[34px] h-[34px] rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {isLoading && myRequests.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={myRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState
              icon="pill"
              message="No RxLink requests yet. Upload a photo of your prescription or medication to get started."
            />
          }
          renderItem={({ item }) => (
            <RxLinkRequestCard
              request={item}
              onPress={() => router.push({ pathname: "/rxlink/request-details", params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
