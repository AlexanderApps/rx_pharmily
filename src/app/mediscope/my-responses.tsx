import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import EmptyState from "@/shared/components/empty-state";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useMediscopeStore } from "@/features/mediscope/hooks/use-mediscope-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { MediscopeResponse } from "@/features/mediscope/types/mediscope.types";
import { formatAmount } from "@/shared/utils/format";

export default function MyMediscopeResponsesScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const myResponses = useMediscopeStore((state) => state.myResponses);
  const fetchMyResponses = useMediscopeStore((state) => state.fetchMyResponses);
  const requests = useMediscopeStore((state) => state.requests);

  useEffect(() => {
    fetchMyResponses().finally(() => setIsLoading(false));
  }, [fetchMyResponses]);

  const visibleResponses = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return myResponses
      .filter((r) => r.createdBy === userId && !r.isRemoved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myResponses]);

  const requestById = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="px-4 pt-3 pb-3 border-b-[0.5px]" style={{ borderBottomColor: colors.border }}>
          <View className="flex-row items-center">
            {Platform.OS !== "web" && (
              <Pressable onPress={() => router.back()} className="mr-3 p-1">
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            )}
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                My Responses
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                Responses you've submitted to other facilities' MediScope requests
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <DetailSkeleton rows={4} />
        ) : visibleResponses.length === 0 ? (
          <EmptyState icon="file-send-outline" message="You haven't responded to any MediScope requests yet." />
        ) : (
          <FlatList
            data={visibleResponses}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 py-4 gap-2.5"
            renderItem={({ item }: { item: MediscopeResponse }) => {
              const request = requestById.get(item.requestId);
              return (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/mediscope/mediscope-market-details",
                      params: { id: item.requestId },
                    })
                  }
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                        {request?.product ?? "MediScope request"}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {request?.facilityName ?? "Unknown facility"} · {request?.code ?? ""}
                      </Text>
                    </View>
                    <View
                      className="flex-row items-center gap-1 px-2 py-1 rounded-md"
                      style={{
                        backgroundColor: (item.availability === "full" ? colors.success : colors.warning) + "18",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={item.availability === "full" ? "check-circle-outline" : "alert-circle-outline"}
                        size={12}
                        color={item.availability === "full" ? colors.success : colors.warning}
                      />
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: item.availability === "full" ? colors.success : colors.warning }}
                      >
                        {item.availability === "full" ? "Fully available" : "Partially available"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                      {item.currency} {formatAmount(item.cost)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}
