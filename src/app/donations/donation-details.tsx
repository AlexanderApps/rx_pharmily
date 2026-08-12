import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { DonationItem, DonationStatus } from "@/features/donations/types/donation.types";
import DonationResponseCard from "@/features/donations/components/donation-response-card";
import PrintButton from "@/shared/components/print-button";
import { buildDonationItemListHtml } from "@/features/donations/utils/donation-pdf";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const DAY_MS = 24 * 60 * 60 * 1000;
function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

const STATUS_META: Record<DonationStatus, { label: string; icon: string }> = {
  opened: { label: "Opened", icon: "eye-outline" },
  hidden: { label: "Hidden", icon: "eye-off-outline" },
  closed: { label: "Closed", icon: "lock-outline" },
};

function ItemRow({ item }: { item: DonationItem }) {
  const { colors } = useTheme();
  const days = daysUntil(item.expiryDate);
  const expiryColor =
    days < 0 ? colors.error : days <= 30 ? colors.warning : colors.text;
  const expiryLabel = days < 0 ? "Expired" : days <= 30 ? "Expiring soon" : null;

  return (
    <View
      style={[
        itemStyles.row,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: item.isActive ? 1 : 0.65,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={itemStyles.topLine}>
          <Text style={[itemStyles.product, { color: colors.text }]} numberOfLines={1}>
            {item.product}
          </Text>
          {!item.status && (
            <View style={[itemStyles.badge, { backgroundColor: colors.warning + "18" }]}>
              <Text style={[itemStyles.badgeText, { color: colors.warning }]}>
                Needs review
              </Text>
            </View>
          )}
          {!item.isActive && (
            <View style={[itemStyles.badge, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[itemStyles.badgeText, { color: colors.textSecondary }]}>
                Inactive
              </Text>
            </View>
          )}
        </View>

        <View style={itemStyles.metaLine}>
          <Text style={[itemStyles.metaText, { color: colors.textSecondary }]}>
            Qty {item.quantity}
          </Text>
          {item.batch ? (
            <Text style={[itemStyles.metaText, { color: colors.textSecondary }]}>
              · Batch {item.batch}
            </Text>
          ) : null}
        </View>

        <View style={itemStyles.metaLine}>
          <MaterialCommunityIcons name="calendar-clock-outline" size={13} color={expiryColor} />
          <Text style={[itemStyles.expiryText, { color: expiryColor }]}>
            Expires {fmtDate(item.expiryDate)}
          </Text>
          {expiryLabel && (
            <Text style={[itemStyles.expiryTag, { color: expiryColor }]}>{expiryLabel}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// Owner-only management screen. Anyone browsing someone else's donation is
// routed to /donations/donation-market-details instead — see list/search/
// dashboard navigation for the ownership check.
export default function DonationDetailsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();

  const donations = useDonationStore((state) => state.donations);
  const isLoadingDonations = useDonationStore((state) => state.isLoading);
  const responsesByDonation = useDonationStore((state) => state.responsesByDonation);
  const updateDonationStatus = useDonationStore((state) => state.updateDonationStatus);
  const deleteDonation = useDonationStore((state) => state.deleteDonation);
  const approveResponse = useDonationStore((state) => state.approveResponse);
  const rejectResponse = useDonationStore((state) => state.rejectResponse);
  const fetchResponses = useDonationStore((state) => state.fetchResponses);

  useEffect(() => {
    if (id) fetchResponses(id);
  }, [id]);


  const donation = useMemo(() => donations.find((d) => d.id === id), [donations, id]);
  const responses = useMemo(
    () => (id ? responsesByDonation[id] ?? [] : []),
    [responsesByDonation, id],
  );

  const expiringSoonCount = useMemo(
    () =>
      donation
        ? donation.donatedItems.filter((i) => {
            const days = daysUntil(i.expiryDate);
            return days >= 0 && days <= 30;
          }).length
        : 0,
    [donation],
  );
  const expiredCount = useMemo(
    () =>
      donation ? donation.donatedItems.filter((i) => daysUntil(i.expiryDate) < 0).length : 0,
    [donation],
  );

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

  const isOwner = donation.createdBy === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
            This is a management view
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Only {donation.facilityName} can manage this donation.
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: "/donations/donation-market-details",
                params: { id: donation.id },
              })
            }
            style={[styles.claimButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.claimButtonText}>View donation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_META[donation.status];

  const handleStatusChange = async (status: DonationStatus) => {
    const ok = await updateDonationStatus(donation.id, status);
    toast[ok ? "success" : "error"](ok ? "Status updated." : "Couldn't update the status.");
  };

  const handleApprove = async (responseId: string) => {
    const confirmed = await confirm({
      title: "Approve this claim?",
      message: "The claimed quantities will be deducted from the donation's available items.",
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    const ok = await approveResponse(donation.id, responseId);
    toast[ok ? "success" : "error"](ok ? "Claim approved." : "Couldn't approve the claim.");
  };

  const handleReject = async (responseId: string) => {
    const ok = await rejectResponse(donation.id, responseId);
    toast[ok ? "success" : "error"](ok ? "Claim declined." : "Couldn't decline the claim.");
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete donation?",
      message: `This will permanently remove ${donation.code}. This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    const ok = await deleteDonation(donation.id);
    if (ok) {
      toast.success("Donation deleted.");
      router.back();
    } else {
      toast.error("Couldn't delete the donation.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {donation.facilityName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{donation.code}</Text>
        </View>
        <PrintButton
          variant="icon"
          fileName={`Donation-${donation.code}-Items`}
          getHtml={() => buildDonationItemListHtml(donation)}
        />
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/donations/add-donation", params: { id: donation.id } })
          }
          style={[styles.headerIconButton, { backgroundColor: colors.backgroundSecondary }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.postedByRow}>
          <ClickableAvatar
            entityType="facility"
            entityId={donation.facility}
            name={donation.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this donation"
            size={38}
          />
          <View>
            <Text style={[styles.postedByLabel, { color: colors.textSecondary }]}>Donated by</Text>
            <Text style={[styles.postedByName, { color: colors.text }]}>{donation.facilityName}</Text>
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusPill, { backgroundColor: colors.backgroundElement }]}>
              <MaterialCommunityIcons name={statusMeta.icon as any} size={13} color={colors.text} />
              <Text style={[styles.statusPillText, { color: colors.text }]}>{statusMeta.label}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
            <Text style={[styles.value, { color: colors.text }]}>{donation.facilityLocation}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Posted</Text>
            <Text style={[styles.value, { color: colors.text }]}>{fmtDate(donation.createdAt)}</Text>
          </View>
          {donation.categories.length > 0 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Categories</Text>
              <Text
                style={[styles.value, { color: colors.text, flex: 1, textAlign: "right" }]}
                numberOfLines={2}
              >
                {donation.categories.join(", ")}
              </Text>
            </View>
          )}
          {donation.termsOfService ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Terms</Text>
              <Text style={[styles.value, { color: colors.text, flex: 1, textAlign: "right" }]}>
                {donation.termsOfService}
              </Text>
            </View>
          ) : null}
          {donation.comment ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Comment</Text>
              <Text style={[styles.value, { color: colors.text, flex: 1, textAlign: "right" }]}>
                {donation.comment}
              </Text>
            </View>
          ) : null}
        </View>

        {(expiredCount > 0 || expiringSoonCount > 0) && (
          <View style={styles.alertRow}>
            {expiredCount > 0 && (
              <View style={[styles.alertPill, { backgroundColor: colors.error + "18" }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={colors.error} />
                <Text style={[styles.alertPillText, { color: colors.error }]}>
                  {expiredCount} expired
                </Text>
              </View>
            )}
            {expiringSoonCount > 0 && (
              <View style={[styles.alertPill, { backgroundColor: colors.warning + "18" }]}>
                <MaterialCommunityIcons name="clock-alert-outline" size={13} color={colors.warning} />
                <Text style={[styles.alertPillText, { color: colors.warning }]}>
                  {expiringSoonCount} expiring soon
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Items ({donation.donatedItems.length})
        </Text>
        <View style={{ gap: 8 }}>
          {donation.donatedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Claims ({responses.length})
        </Text>
        {responses.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No claims yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {responses.map((response) => (
              <DonationResponseCard
                key={response.id}
                response={response}
                isOwner
                onApprove={() => handleApprove(response.id)}
                onReject={() => handleReject(response.id)}
              />
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Visibility</Text>
        <View style={styles.statusActionsRow}>
          {(Object.keys(STATUS_META) as DonationStatus[]).map((status) => {
            const meta = STATUS_META[status];
            const active = donation.status === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => handleStatusChange(status)}
                style={[
                  styles.statusActionButton,
                  {
                    backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={15}
                  color={active ? "#fff" : colors.text}
                />
                <Text style={[styles.statusActionText, { color: active ? "#fff" : colors.text }]}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={handleDelete} style={[styles.deleteButton, { borderColor: colors.error }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete donation</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  postedByRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  postedByLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  postedByName: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, gap: 8 },
  label: { fontSize: 12 },
  value: { fontSize: 13, fontWeight: "500" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  statusPillText: { fontSize: 12, fontWeight: "600" },
  alertRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  alertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertPillText: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  statusActionsRow: { flexDirection: "row", gap: 8 },
  statusActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusActionText: { fontSize: 12, fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteButtonText: { fontSize: 13, fontWeight: "600" },
  claimButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  claimButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

const itemStyles = StyleSheet.create({
  row: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  product: { fontSize: 14, fontWeight: "600", flex: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12 },
  expiryText: { fontSize: 12, fontWeight: "500" },
  expiryTag: { fontSize: 10, fontWeight: "700", marginLeft: 2 },
});
