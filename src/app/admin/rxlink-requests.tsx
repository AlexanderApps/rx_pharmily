import React, { useEffect, useMemo } from "react";
import { View, FlatList } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import ListSkeleton from "@/shared/components/list-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useRxLinkStore } from "@/features/rxlink/hooks/use-rxlink-data";
import RxLinkRequestCard from "@/features/rxlink/components/rxlink-request-card";

export default function AdminRxLinkRequestsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const requests = useRxLinkStore((state) => state.requests);
  const isLoading = useRxLinkStore((state) => state.isLoading);
  const fetchRequests = useRxLinkStore((state) => state.fetchRequests);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Every open request first, oldest first (so the queue reads like a
  // to-do list, not a reverse-chronological feed), then closed/handled
  // ones trailing behind for reference.
  const sorted = useMemo(() => {
    const open = requests
      .filter((r) => r.status !== "closed")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const closed = requests
      .filter((r) => r.status === "closed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return [...open, ...closed];
  }, [requests]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader
        title="RxLink Requests"
        subtitle={`${requests.filter((r) => r.status === "pending").length} awaiting response`}
      />

      {isLoading && sorted.length === 0 ? (
        <ListSkeleton rows={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={<EmptyState icon="pill" message="No RxLink requests yet." />}
          renderItem={({ item }) => (
            <RxLinkRequestCard
              request={item}
              requesterName={item.createdByName}
              onPress={() => router.push({ pathname: "/rxlink/request-details", params: { id: item.id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
