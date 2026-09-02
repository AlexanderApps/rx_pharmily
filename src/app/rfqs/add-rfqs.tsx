import { View, Text } from "react-native";
import { ThemedView } from "@/shared/components/themed-view";
import RxRfqsRequestForm from "@/features/rxrfqs/components/rxrfq-req-form";
import { RxRfqsFormData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useTheme } from "@/shared/hooks/use-theme";
import DetailSkeleton from "@/shared/components/detail-skeleton";

export default function AddRxRfqRequest() {
  // If an id is present we're editing an existing (draft) RFQ, otherwise
  // we're creating a brand new one.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const rxRfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const isLoadingRfqs = useRxRfqsStore((state) => state.isLoading);
  const addRxRfq = useRxRfqsStore((state) => state.addRxRfq);
  const updateRxRfq = useRxRfqsStore((state) => state.updateRxRfq);

  const existing = useMemo(
    () => (id ? rxRfqMarketPlace.find((rfq) => rfq.id === id) : undefined),
    [id, rxRfqMarketPlace],
  );

  const handleSubmit = async (data: RxRfqsFormData) => {
    if (existing) {
      const ok = await updateRxRfq(existing.id, data);
      if (ok) {
        toast.success("RFQ updated.");
        router.back();
      } else {
        toast.error("Couldn't save your changes. Please try again.");
      }
    } else {
      const newId = await addRxRfq(data);
      if (!newId) {
        toast.error("Couldn't create the RFQ. Please try again.");
        return;
      }
      toast.success("RFQ created.");
      router.replace({
        pathname: "/rfqs/rxrfq-details-screen",
        params: { id: newId },
      });
    }
  };

  // Editing an id that hasn't resolved yet — a cold refresh leaves
  // rxRfqMarketPlace empty until it re-fetches, and without this guard
  // the form would render immediately with initialData=undefined,
  // silently starting as a blank "create" form instead of the intended
  // edit.
  if (id && !existing) {
    if (isLoadingRfqs) {
      return (
        <ThemedView className="flex-1">
          <DetailSkeleton rows={4} />
        </ThemedView>
      );
    }
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <Text style={{ color: colors.text }}>This RFQ could not be found.</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <RxRfqsRequestForm onSubmit={handleSubmit} initialData={existing} />
    </ThemedView>
  );
}

