import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import DonationList from "@/features/donations/components/donation-list";
import MoreMenu from "@/shared/components/more-menu";
import {
  convertToCardData,
  useDonationStore,
} from "@/features/donations/hooks/use-donation-data";

export default function Donations() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const donations = useDonationStore((state) => state.donations);
  const deleteDonation = useDonationStore((state) => state.deleteDonation);
  const { mine } = useLocalSearchParams<{ mine?: string }>();

  // "View All" from the index page's "My Active Donations" section links
  // here with ?mine=true, scoping the list to donations this user created
  // — otherwise this is the public marketplace view, which (like every
  // other browse screen) only shows what's actually open to claim; hidden
  // and closed donations aren't available regardless of who created them.
  const donationCards = useMemo(
    () =>
      [...donations]
        .filter((d) =>
          mine === "true" ? d.createdBy === currentUserId : d.status === "opened",
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map(convertToCardData),
    [donations, mine, currentUserId],
  );

  const handleDelete = async (id: string) => {
    const donation = donations.find((d) => d.id === id);
    const ok = await confirm({
      title: "Delete donation?",
      message: `This will permanently remove ${donation?.code ?? "this donation"}.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const success = await deleteDonation(id);
    toast[success ? "success" : "error"](success ? "Donation deleted." : "Couldn't delete the donation.");
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView
          style={{
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            {/* Back Button */}
            {Platform.OS !== "web" && (
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.backgroundElement,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
            )}

            {/* Search */}
            <ThemedView style={{ flex: 1 }}>
              <SearchButton
                placeholder="Search donations..."
                onPress={() => {
                  router.push("/donations/search-donations");
                }}
                variant="default"
              />
            </ThemedView>

            {/* More Menu */}
            <MoreMenu
              iconColor={colors.text}
              style={{ backgroundColor: colors.backgroundElement }}
              items={[
                {
                  label: "New Donation",
                  icon: "add-outline",
                  onPress: () => router.push("/donations/add-donation"),
                },
              ]}
            />
          </ThemedView>
        </ThemedView>

        {/* Screen Content Feed */}
        <ThemedView style={{ flex: 1, paddingHorizontal: 0 }}>
          <DonationList
            donations={donationCards}
            onCardPress={(id) => {
              const donation = donations.find((d) => d.id === id);
              const isOwner = donation?.createdBy === currentUserId;
              router.push({
                pathname: isOwner
                  ? "/donations/donation-details"
                  : "/donations/donation-market-details",
                params: { id },
              });
            }}
            onCardEdit={(id) =>
              router.push({
                pathname: "/donations/add-donation",
                params: { id },
              })
            }
            onCardDelete={handleDelete}
          />
        </ThemedView>

        {/* Floating Add Donation Button */}
        <Pressable
          onPress={() => router.push("/donations/add-donation")}
          style={{
            position: "absolute",
            bottom: 32,
            right: 24,
            width: 64,
            height: 64,
            borderRadius: 20,

            backgroundColor: colors.primary,

            justifyContent: "center",
            alignItems: "center",

            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 6,
            },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            opacity: 0.96,

            elevation: 8,
          }}
        >
          <Ionicons name="add" size={32} color={colors.text} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}
