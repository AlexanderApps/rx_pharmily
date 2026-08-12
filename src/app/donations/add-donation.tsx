import { ThemedView } from "@/shared/components/themed-view";
import AddDonationForm from "@/features/donations/components/temp/add-donation-form";
import { DonationFormData } from "@/features/donations/types/donation.types";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { toast } from "@/shared/hooks/use-toast";

export default function AddDonation() {
  // If an id is present we're editing an existing donation, otherwise we're
  // creating a brand new one.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const donations = useDonationStore((state) => state.donations);
  const addDonation = useDonationStore((state) => state.addDonation);
  const updateDonation = useDonationStore((state) => state.updateDonation);

  const existing = useMemo(
    () => (id ? donations.find((d) => d.id === id) : undefined),
    [id, donations],
  );

  const handleSubmit = async (data: DonationFormData) => {
    if (existing) {
      const ok = await updateDonation(existing.id, data);
      if (ok) {
        toast.success("Donation updated.");
        router.back();
      } else {
        toast.error("Couldn't save your changes. Please try again.");
      }
    } else {
      const newId = await addDonation(data);
      if (!newId) {
        toast.error("Couldn't post your donation. Please try again.");
        return;
      }
      toast.success("Donation posted.");
      router.replace({
        pathname: "/donations/donation-details",
        params: { id: newId },
      });
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <AddDonationForm
        onSubmit={handleSubmit}
        initialData={existing}
        isLoading={false}
      />
    </ThemedView>
  );
}
