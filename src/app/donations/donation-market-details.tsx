import React, { useMemo, useRef } from "react";
import { View, Text, Pressable, ScrollView, Share, Platform} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { DonationResponseFormData } from "@/features/donations/types/donation.types";
import DonationClaimSheet, {
  DonationClaimSheetHandle,
} from "@/features/donations/components/donation-claim-sheet";
import PrintButton from "@/shared/components/print-button";
import { buildDonationItemListHtml } from "@/features/donations/utils/donation-pdf";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

// Public view — anyone browsing the market lands here. Owners are routed to
// /donations/donation-details for management instead.
export default function DonationMarketDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const donations = useDonationStore((state) => state.donations);
  const isLoadingDonations = useDonationStore((state) => state.isLoading);
  const addResponse = useDonationStore((state) => state.addResponse);
  const claimSheetRef = useRef<DonationClaimSheetHandle>(null);

  const donation = useMemo(
    () => donations.find((d) => d.id === id),
    [donations, id]
  );

  if (!donation) {
    if (isLoadingDonations) {
      return (
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
        >
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Text className="p-4" style={{ color: colors.text }}>
          No donation found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const activeItems = donation.donatedItems.filter((i) => i.isActive);
  const canClaim = donation.status === "opened" && activeItems.length > 0;

  const handleSubmitClaim = async (data: DonationResponseFormData) => {
    const ok = await addResponse(data);
    if (ok) {
      toast.success("Claim submitted.");
    } else {
      toast.error("Couldn't submit your claim. Please try again.");
    }
    return ok;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Donation ${donation.code} from ${donation.facilityName}: ${donation.donatedItems
          .map((i) => i.product)
          .join(", ")}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Navbar */}
      <View
        className="flex-row items-center px-4 py-3 border-b-[0.5px] gap-3"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 justify-center items-center"
          hitSlop={8}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        )}

        <View className="flex-1">
          <Text
            className="text-[15px] font-medium"
            style={{ color: colors.text }}
          >
            {donation.code}
          </Text>
          <Text
            className="text-xs mt-px"
            style={{ color: colors.textSecondary }}
          >
            {format(donation.createdAt)}
          </Text>
        </View>

        <PrintButton
          variant="icon"
          fileName={`Donation-${donation.code}-Items`}
          getHtml={() => buildDonationItemListHtml(donation)}
        />

        <Pressable
          onPress={handleShare}
          className="w-9 h-9 justify-center items-center"
          hitSlop={8}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-4 pt-4">
        {/* Hero */}
        <View className="flex-row items-center gap-3 mb-3">
          <ClickableAvatar
            entityType="facility"
            entityId={donation.facility}
            name={donation.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this donation"
            size={52}
          />
          <View className="flex-1 gap-1">
            <Text
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              {donation.facilityName}
            </Text>
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                className="text-[13px]"
                style={{ color: colors.textSecondary }}
              >
                {donation.facilityLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        {donation.categories.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {donation.categories.map((c) => (
              <View
                key={c}
                className="px-2.5 py-1.5 rounded-full"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  {c}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Comment */}
        {donation.comment ? (
          <Text
            className="text-sm leading-5 mb-4"
            style={{ color: colors.textSecondary }}
          >
            {donation.comment}
          </Text>
        ) : null}

        {/* Terms */}
        {donation.termsOfService ? (
          <View
            className="rounded-[14px] border p-3.5 gap-1 mb-4"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: colors.text }}
            >
              Terms
            </Text>
            <Text
              className="text-[13px] leading-[19px]"
              style={{ color: colors.textSecondary }}
            >
              {donation.termsOfService}
            </Text>
          </View>
        ) : null}

        {/* Available Items */}
        <Text
          className="text-xs font-medium uppercase tracking-wide mb-2"
          style={{ color: colors.text }}
        >
          Available Items ({activeItems.length})
        </Text>

        <View
          className="rounded-2xl border-[0.5px] overflow-hidden"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          {activeItems.map((item, index) => {
            const days = daysUntil(item.expiryDate);
            const expiryColor =
              days <= 30 ? colors.warning : colors.textSecondary;

            return (
              <View
                key={item.id}
                className="p-3.5"
                style={
                  index !== activeItems.length - 1
                    ? { borderBottomWidth: 0.5, borderBottomColor: colors.border }
                    : undefined
                }
              >
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {item.product}
                  </Text>
                  <Text
                    className="text-xs mt-[3px]"
                    style={{ color: expiryColor }}
                  >
                    {item.quantity} available · expires{" "}
                    {new Date(item.expiryDate).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </View>
              </View>
            );
          })}

          {activeItems.length === 0 && (
            <Text
              className="text-[13px] p-3.5"
              style={{ color: colors.textSecondary }}
            >
              No items currently available.
            </Text>
          )}
        </View>

        <View className={canClaim ? "h-[100px]" : "h-6"} />
      </ScrollView>

      {/* Claim FAB */}
      {canClaim && (
        <View className="absolute bottom-6 left-4 right-4">
          <Pressable
            onPress={() => claimSheetRef.current?.open()}
            className="h-12 rounded-[14px] flex-row items-center justify-center gap-2 active:opacity-90"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons
              name="hand-heart-outline"
              size={18}
              color="#fff"
            />
            <Text className="text-white text-[15px] font-semibold">
              Claim Items
            </Text>
          </Pressable>
        </View>
      )}

      <DonationClaimSheet
        ref={claimSheetRef}
        donationId={donation.id}
        items={donation.donatedItems}
        onSubmit={handleSubmitClaim}
      />
    </SafeAreaView>
  );
}