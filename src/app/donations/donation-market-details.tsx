import React, { useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Share } from "react-native";
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

  const donation = useMemo(() => donations.find((d) => d.id === id), [donations, id]);

  if (!donation) {
    if (isLoadingDonations) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.navbarMeta}>
          <Text style={[styles.navbarCode, { color: colors.text }]}>{donation.code}</Text>
          <Text style={[styles.navbarTime, { color: colors.textSecondary }]}>
            {format(donation.createdAt)}
          </Text>
        </View>
        <PrintButton
          variant="icon"
          fileName={`Donation-${donation.code}-Items`}
          getHtml={() => buildDonationItemListHtml(donation)}
        />
        <Pressable onPress={handleShare} style={styles.shareBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <ClickableAvatar
            entityType="facility"
            entityId={donation.facility}
            name={donation.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this donation"
            size={52}
          />
          <View style={styles.heroMeta}>
            <Text style={[styles.heroName, { color: colors.text }]}>{donation.facilityName}</Text>
            <View style={styles.heroLocationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.heroLocation, { color: colors.textSecondary }]}>
                {donation.facilityLocation}
              </Text>
            </View>
          </View>
        </View>

        {donation.categories.length > 0 && (
          <View style={styles.chipRow}>
            {donation.categories.map((c) => (
              <View key={c} style={[styles.chip, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {donation.comment ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {donation.comment}
          </Text>
        ) : null}

        {donation.termsOfService ? (
          <View
            style={[styles.termsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <Text style={[styles.termsTitle, { color: colors.text }]}>Terms</Text>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              {donation.termsOfService}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Available Items ({activeItems.length})
        </Text>
        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          {activeItems.map((item, index) => {
            const days = daysUntil(item.expiryDate);
            const expiryColor = days <= 30 ? colors.warning : colors.textSecondary;
            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index !== activeItems.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item.product}
                  </Text>
                  <Text style={[styles.itemMeta, { color: expiryColor }]}>
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
            <Text style={{ color: colors.textSecondary, fontSize: 13, padding: 14 }}>
              No items currently available.
            </Text>
          )}
        </View>

        <View style={{ height: canClaim ? 100 : 24 }} />
      </ScrollView>

      {canClaim && (
        <View style={styles.fabGroup}>
          <Pressable
            onPress={() => claimSheetRef.current?.open()}
            style={[styles.fabPrimary, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="hand-heart-outline" size={18} color="#fff" />
            <Text style={styles.fabPrimaryText}>Claim Items</Text>
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

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  navbarMeta: { flex: 1 },
  navbarCode: { fontSize: 15, fontWeight: "500" },
  navbarTime: { fontSize: 12, marginTop: 1 },
  shareBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  heroMeta: { flex: 1, gap: 4 },
  heroName: { fontSize: 18, fontWeight: "600" },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroLocation: { fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: "600" },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  termsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4, marginBottom: 16 },
  termsTitle: { fontSize: 13, fontWeight: "700" },
  termsText: { fontSize: 13, lineHeight: 19 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: { borderRadius: 16, borderWidth: 0.5, overflow: "hidden" },
  itemRow: { padding: 14 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 12, marginTop: 3 },
  fabGroup: { position: "absolute", bottom: 24, left: 16, right: 16 },
  fabPrimary: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
