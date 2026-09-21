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
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { RxRfqResponseData, RxRfqResponseStatusType } from "@/features/rxrfqs/types/rxrfqs.types";
import { formatAmount } from "@/shared/utils/format";

const STATUS_META: Record<RxRfqResponseStatusType, { label: string; icon: string; tone: "warning" | "info" | "success" | "error" }> = {
  draft: { label: "Draft", icon: "pencil-outline", tone: "warning" },
  submitted: { label: "Submitted", icon: "send-outline", tone: "info" },
  underReview: { label: "Under Review", icon: "eye-outline", tone: "info" },
  accepted: { label: "Accepted", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

export default function MyResponsesScreen() {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const rxrfqResponses = useRxRfqsStore((state) => state.rxrfqResponses);
  const fetchMyResponses = useRxRfqsStore((state) => state.fetchMyResponses);
  // The already-resolved card view (code, facilityName joined in) — used
  // here only to look up which RFQ each response belongs to for display,
  // not as the source of the responses themselves.
  const rxrfqs = useRxRfqsStore((state) => state.rxrfqs);

  useEffect(() => {
    fetchMyResponses().finally(() => setIsLoading(false));
  }, [fetchMyResponses]);

  const myResponses = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return rxrfqResponses
      .filter((r) => r.createdBy === userId && !r.isRemoved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rxrfqResponses]);

  const rfqById = useMemo(() => new Map(rxrfqs.map((rfq) => [rfq.id, rfq])), [rxrfqs]);

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
                Quotes you've submitted to other facilities' RxRFQs
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <DetailSkeleton rows={4} />
        ) : myResponses.length === 0 ? (
          <EmptyState icon="file-send-outline" message="You haven't responded to any RxRFQs yet." />
        ) : (
          <FlatList
            data={myResponses}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 py-4 gap-2.5"
            renderItem={({ item }: { item: RxRfqResponseData }) => {
              const rfq = rfqById.get(item.rfqId);
              const statusMeta = STATUS_META[item.status];
              const statusColor = colors[statusMeta.tone];
              return (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/rfqs/response-details", params: { id: item.id } })
                  }
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                        {rfq?.code ?? "RFQ"}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {rfq?.facilityName ?? "Unknown facility"}
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

                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {item.submittedAt
                        ? `Submitted ${new Date(item.submittedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`
                        : "Not yet submitted"}
                    </Text>
                    <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                      {item.currency} {formatAmount(item.grandTotal)}
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
