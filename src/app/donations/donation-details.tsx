import React, { useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import {
  DonationItem,
  DonationStatus,
} from "@/features/donations/types/donation.types";
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
  const expiryLabel =
    days < 0 ? "Expired" : days <= 30 ? "Expiring soon" : null;

  return (
    <View
      className="rounded-xl border p-3 gap-1.5"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        opacity: item.isActive ? 1 : 0.65,
      }}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-sm font-semibold flex-1"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {item.product}
          </Text>
          {!item.status && (
            <View
              className="px-[7px] py-0.5 rounded-md"
              style={{ backgroundColor: colors.warning + "18" }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: colors.warning }}
              >
                Needs review
              </Text>
            </View>
          )}
          {!item.isActive && (
            <View
              className="px-[7px] py-0.5 rounded-md"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: colors.textSecondary }}
              >
                Inactive
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Qty {item.quantity}
          </Text>
          {item.batch ? (
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              · Batch {item.batch}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={13}
            color={expiryColor}
          />
          <Text
            className="text-xs font-medium"
            style={{ color: expiryColor }}
          >
            Expires {fmtDate(item.expiryDate)}
          </Text>
          {expiryLabel && (
            <Text
              className="text-[10px] font-bold ml-0.5"
              style={{ color: expiryColor }}
            >
              {expiryLabel}
            </Text>
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
  const responsesByDonation = useDonationStore(
    (state) => state.responsesByDonation
  );
  const updateDonationStatus = useDonationStore(
    (state) => state.updateDonationStatus
  );
  const deleteDonation = useDonationStore((state) => state.deleteDonation);
  const approveResponse = useDonationStore((state) => state.approveResponse);
  const rejectResponse = useDonationStore((state) => state.rejectResponse);
  const fetchResponses = useDonationStore((state) => state.fetchResponses);

  useEffect(() => {
    if (id) fetchResponses(id);
  }, [id]);

  const donation = useMemo(
    () => donations.find((d) => d.id === id),
    [donations, id]
  );
  const responses = useMemo(
    () => (id ? (responsesByDonation[id] ?? []) : []),
    [responsesByDonation, id]
  );

  const expiringSoonCount = useMemo(
    () =>
      donation
        ? donation.donatedItems.filter((i) => {
            const days = daysUntil(i.expiryDate);
            return days >= 0 && days <= 30;
          }).length
        : 0,
    [donation]
  );

  const expiredCount = useMemo(
    () =>
      donation
        ? donation.donatedItems.filter((i) => daysUntil(i.expiryDate) < 0)
            .length
        : 0,
    [donation]
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

  const isOwner = donation.createdBy === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="p-4 gap-3">
          <Text
            className="text-[15px] font-semibold"
            style={{ color: colors.text }}
          >
            This is a management view
          </Text>
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            Only {donation.facilityName} can manage this donation.
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: "/donations/donation-market-details",
                params: { id: donation.id },
              })
            }
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white text-[15px] font-semibold">
              View donation
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_META[donation.status];

  const handleStatusChange = async (status: DonationStatus) => {
    const ok = await updateDonationStatus(donation.id, status);
    toast[ok ? "success" : "error"](
      ok ? "Status updated." : "Couldn't update the status."
    );
  };

  const handleApprove = async (responseId: string) => {
    const confirmed = await confirm({
      title: "Approve this claim?",
      message:
        "The claimed quantities will be deducted from the donation's available items.",
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    const ok = await approveResponse(donation.id, responseId);
    toast[ok ? "success" : "error"](
      ok ? "Claim approved." : "Couldn't approve the claim."
    );
  };

  const handleReject = async (responseId: string) => {
    const ok = await rejectResponse(donation.id, responseId);
    toast[ok ? "success" : "error"](
      ok ? "Claim declined." : "Couldn't decline the claim."
    );
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
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <ScreenHeader
        title={donation.facilityName}
        subtitle={donation.code}
        actions={
          <>
            <PrintButton
              variant="icon"
              fileName={`Donation-${donation.code}-Items`}
              getHtml={() => buildDonationItemListHtml(donation)}
            />
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/donations/add-donation",
                  params: { id: donation.id },
                })
              }
              className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView contentContainerClassName="p-4 gap-3.5">
        {/* Posted by */}
        <View className="flex-row items-center gap-2.5 mb-3.5">
          <ClickableAvatar
            entityType="facility"
            entityId={donation.facility}
            name={donation.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this donation"
            size={38}
          />
          <View>
            <Text
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Donated by
            </Text>
            <Text
              className="text-sm font-bold mt-px"
              style={{ color: colors.text }}
            >
              {donation.facilityName}
            </Text>
          </View>
        </View>

        {/* Details card */}
        <View
          className="rounded-[14px] border p-4 gap-2"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between py-[3px] gap-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Status
            </Text>
            <View
              className="flex-row items-center gap-1.5 px-2 py-[3px] rounded-[7px]"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons
                name={statusMeta.icon as any}
                size={13}
                color={colors.text}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between py-[3px] gap-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Location
            </Text>
            <Text
              className="text-[13px] font-medium"
              style={{ color: colors.text }}
            >
              {donation.facilityLocation}
            </Text>
          </View>

          <View className="flex-row justify-between py-[3px] gap-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Posted
            </Text>
            <Text
              className="text-[13px] font-medium"
              style={{ color: colors.text }}
            >
              {fmtDate(donation.createdAt)}
            </Text>
          </View>

          {donation.categories.length > 0 && (
            <View className="flex-row justify-between py-[3px] gap-2">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Categories
              </Text>
              <Text
                className="text-[13px] font-medium flex-1 text-right"
                style={{ color: colors.text }}
                numberOfLines={2}
              >
                {donation.categories.join(", ")}
              </Text>
            </View>
          )}

          {donation.termsOfService ? (
            <View className="flex-row justify-between py-[3px] gap-2">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Terms
              </Text>
              <Text
                className="text-[13px] font-medium flex-1 text-right"
                style={{ color: colors.text }}
              >
                {donation.termsOfService}
              </Text>
            </View>
          ) : null}

          {donation.comment ? (
            <View className="flex-row justify-between py-[3px] gap-2">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Comment
              </Text>
              <Text
                className="text-[13px] font-medium flex-1 text-right"
                style={{ color: colors.text }}
              >
                {donation.comment}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Alerts */}
        {(expiredCount > 0 || expiringSoonCount > 0) && (
          <View className="flex-row gap-2 flex-wrap">
            {expiredCount > 0 && (
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: colors.error + "18" }}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={13}
                  color={colors.error}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.error }}
                >
                  {expiredCount} expired
                </Text>
              </View>
            )}
            {expiringSoonCount > 0 && (
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: colors.warning + "18" }}
              >
                <MaterialCommunityIcons
                  name="clock-alert-outline"
                  size={13}
                  color={colors.warning}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.warning }}
                >
                  {expiringSoonCount} expiring soon
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Items */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Items ({donation.donatedItems.length})
        </Text>
        <View className="gap-2">
          {donation.donatedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </View>

        {/* Claims */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Claims ({responses.length})
        </Text>
        {responses.length === 0 ? (
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            No claims yet.
          </Text>
        ) : (
          <View className="gap-2">
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

        {/* Visibility */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Visibility
        </Text>
        <View className="flex-row gap-2">
          {(Object.keys(STATUS_META) as DonationStatus[]).map((status) => {
            const meta = STATUS_META[status];
            const active = donation.status === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => handleStatusChange(status)}
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px] border"
                style={{
                  backgroundColor: active
                    ? colors.primary
                    : colors.backgroundSecondary,
                  borderColor: colors.border,
                }}
              >
                <MaterialCommunityIcons
                  name={meta.icon as any}
                  size={15}
                  color={active ? "#fff" : colors.text}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: active ? "#fff" : colors.text }}
                >
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={handleDelete}
          className="flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border"
          style={{ borderColor: colors.error }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={colors.error}
          />
          <Text
            className="text-[13px] font-semibold"
            style={{ color: colors.error }}
          >
            Delete donation
          </Text>
        </TouchableOpacity>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}