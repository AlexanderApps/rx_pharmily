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
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { DonationResponse, DonationResponseStatus } from "@/features/donations/types/donation.types";

const STATUS_META: Record<DonationResponseStatus, { label: string; icon: string; tone: "warning" | "success" | "error" }> = {
  pending: { label: "Pending", icon: "clock-outline", tone: "warning" },
  approved: { label: "Approved", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

export default function MyDonationResponsesScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const myResponses = useDonationStore((state) => state.myResponses);
  const fetchMyResponses = useDonationStore((state) => state.fetchMyResponses);
  const donations = useDonationStore((state) => state.donations);

  useEffect(() => {
    fetchMyResponses().finally(() => setIsLoading(false));
  }, [fetchMyResponses]);

  const visibleResponses = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return myResponses
      .filter((r) => r.createdBy === userId && !r.isRemoved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myResponses]);

  const donationById = useMemo(() => new Map(donations.map((d) => [d.id, d])), [donations]);

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
                Claims you've submitted to other facilities' donations
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <DetailSkeleton rows={4} />
        ) : visibleResponses.length === 0 ? (
          <EmptyState icon="file-send-outline" message="You haven't responded to any donations yet." />
        ) : (
          <FlatList
            data={visibleResponses}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 py-4 gap-2.5"
            renderItem={({ item }: { item: DonationResponse }) => {
              const donation = donationById.get(item.donationId);
              const statusMeta = STATUS_META[item.status];
              const statusColor = colors[statusMeta.tone];
              return (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/donations/donation-market-details",
                      params: { id: item.donationId },
                    })
                  }
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                        {donation?.facilityName ?? "Unknown facility"}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {donation?.code ?? ""} · {item.items.length} item{item.items.length === 1 ? "" : "s"} claimed
                      </Text>
                    </View>
                    <View
                      className="flex-row items-center gap-1 px-2 py-1 rounded-md"
                      style={{ backgroundColor: statusColor + "18" }}
                    >
                      <MaterialCommunityIcons name={statusMeta.icon as any} size={12} color={statusColor} />
                      <Text className="text-[11px] font-semibold" style={{ color: statusColor }}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs mt-3" style={{ color: colors.textSecondary }}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}
