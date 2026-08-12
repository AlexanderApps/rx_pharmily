import { ThemedView } from "@/shared/components/themed-view";
import MediscopeRequestForm from "@/features/mediscope/components/mediscope-req-form";
import { MediscopeFormData } from "@/features/mediscope/types/mediscope.types";
import { useMediscopeStore } from "@/features/mediscope/hooks/use-mediscope-data";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { toast } from "@/shared/hooks/use-toast";

export default function AddMediScopeRequest() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requests = useMediscopeStore((state) => state.requests);
  const addRequest = useMediscopeStore((state) => state.addRequest);
  const updateRequest = useMediscopeStore((state) => state.updateRequest);

  const existing = useMemo(
    () => (id ? requests.find((r) => r.id === id) : undefined),
    [id, requests],
  );

  const handleSubmit = async (data: MediscopeFormData) => {
    if (existing) {
      const ok = await updateRequest(existing.id, data);
      if (ok) {
        toast.success("Request updated.");
        router.back();
      } else {
        toast.error("Couldn't save your changes. Please try again.");
      }
    } else {
      const newId = await addRequest(data);
      if (!newId) {
        toast.error("Couldn't create the request. Please try again.");
        return;
      }
      toast.success("Request created.");
      router.replace({
        pathname: "/mediscope/mediscope-details",
        params: { id: newId },
      });
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <MediscopeRequestForm
        onSubmit={handleSubmit}
        initialData={existing}
        isEdit={!!existing}
      />
    </ThemedView>
  );
}
