import { StyleSheet } from "react-native";
import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import RxRfqsResponseForm from "@/features/rxrfqs/components/rxrfq-res-form";
import { RxRfqResponseFormData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";

export default function AddRxRfqResponse() {
  const rxRfqData = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const isLoadingRfqs = useRxRfqsStore((state) => state.isLoading);
  const addRxRfqResponse = useRxRfqsStore((state) => state.addRxRfqResponse);

  // 1. Grab the id passed via router.push params
  const { id } = useLocalSearchParams<{ id: string }>();

  // 2. Locate the matching RFQ from the store
  const item = useMemo(() => {
    return rxRfqData.find((item) => item.id === id);
  }, [id, rxRfqData]);

  if (!item) {
    if (isLoadingRfqs) {
      return (
        <ThemedView style={styles.container}>
          <DetailSkeleton rows={3} />
        </ThemedView>
      );
    }
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No RFQ found for id: {id}</ThemedText>
      </ThemedView>
    );
  }

  // 3. Seed the response with everything we already know about the RFQ so
  // the vendor doesn't have to re-enter it, and the store action always
  // gets a valid rfqId to attach the response to.
  const initialData: Partial<RxRfqResponseFormData> = {
    rfqId: item.id,
    currency: item.currency,
    incoterms: item.incoterms,
  };

  const handleSubmit = async (data: RxRfqResponseFormData) => {
    const newId = await addRxRfqResponse({ ...data, rfqId: item.id });
    if (!newId) {
      toast.error("Couldn't submit your response. Please try again.");
      return;
    }
    toast.success("Response submitted.");
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <RxRfqsResponseForm
        rxRfqRequest={item}
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
