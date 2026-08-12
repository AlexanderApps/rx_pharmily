import { StyleSheet } from "react-native";
import { ThemedView } from "@/shared/components/themed-view";
import RxRfqsRequestForm from "@/features/rxrfqs/components/rxrfq-req-form";
import { RxRfqsFormData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { toast } from "@/shared/hooks/use-toast";

export default function AddRxRfqRequest() {
  // If an id is present we're editing an existing (draft) RFQ, otherwise
  // we're creating a brand new one.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const rxRfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
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

  return (
    <ThemedView style={styles.container}>
      <RxRfqsRequestForm onSubmit={handleSubmit} initialData={existing} />
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
