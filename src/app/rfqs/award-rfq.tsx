import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import {
  useRxRfqsStore,
  convertResponseDataToCardData,
} from "@/features/rxrfqs/hooks/use-rxrfq-data";
import RxRfqResponseSummaryCard from "@/features/rxrfqs/components/rxrfq-response-summary-card";

export default function AwardRxRfqScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const rxRfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const isLoadingRfqs = useRxRfqsStore((state) => state.isLoading);
  const rxrfqResponses = useRxRfqsStore((state) => state.rxrfqResponses);
  const awardRxRfqResponse = useRxRfqsStore(
    (state) => state.awardRxRfqResponse,
  );

  const [awarding, setAwarding] = useState<string | null>(null);

  const rfq = useMemo(
    () => rxRfqMarketPlace.find((item) => item.id === id),
    [rxRfqMarketPlace, id],
  );

  const responses = useMemo(
    () =>
      rxrfqResponses
        .filter((response) => response.rfqId === id)
        .map(convertResponseDataToCardData)
        .sort((a, b) => a.grandTotal - b.grandTotal),
    [rxrfqResponses, id],
  );

  if (!rfq) {
    if (isLoadingRfqs) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>
          No RFQ found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const handlePick = async (responseId: string, vendorFacility: string) => {
    const ok = await confirm({
      title: "Award this vendor?",
      message: `${vendorFacility} will be marked as the winning response for ${rfq.code}. This cannot be undone.`,
      confirmLabel: "Award",
    });
    if (!ok) return;

    setAwarding(responseId);
    const success = await awardRxRfqResponse(rfq.id, responseId);
    if (success) {
      toast.success("Vendor awarded.");
      router.back();
    } else {
      setAwarding(null);
      toast.error("Couldn't award this vendor. Please try again.");
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScreenHeader title={`Award ${rfq.code}`} subtitle="Select the winning response" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {responses.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            No responses to award.
          </Text>
        ) : (
          responses.map((response) => (
            <RxRfqResponseSummaryCard
              key={response.id}
              response={response}
              currency={rfq.currency}
              isAwarded={awarding === response.id}
              onPress={() => handlePick(response.id, response.vendorFacility)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

