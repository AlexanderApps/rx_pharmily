import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity, Platform} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import {
  RxRfqsData,
  RxRfqResponseCardData,
  RxRfqStatusType,
} from "@/features/rxrfqs/types/rxrfqs.types";
import RxRfqStatusBadge from "@/features/rxrfqs/components/rxrfq-status-badge";
import RxRfqReadonlyItemsList from "@/features/rxrfqs/components/rxrfq-readonly-items-list";
import RxRfqResponseSummaryCard from "@/features/rxrfqs/components/rxrfq-response-summary-card";
import RxRfqStatusActionsSheet, {
  RxRfqStatusAction,
} from "@/features/rxrfqs/components/rxrfq-status-actions-sheet";
import RxRfqExtendDeadlineSheet from "@/features/rxrfqs/components/rxrfq-extend-deadline-sheet";
import PrintButton from "@/shared/components/print-button";
import { buildRfqSummaryHtml } from "@/features/rxrfqs/utils/rxrfq-pdf";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import {
  useRxRfqsStore,
  convertResponseDataToCardData,
} from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { SafeAreaView } from "react-native-safe-area-context";

const fmtDate = (d?: Date) =>
  d
    ? d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const fmtDateTime = (d?: Date) =>
  d
    ? d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const diffDays = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / 86400000);

const RxRfqDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const actionsSheetRef = useRef<BottomSheetModal>(null);
  const extendSheetRef = useRef<BottomSheetModal>(null);

  const rxRfqData = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const isLoadingRfqs = useRxRfqsStore((state) => state.isLoading);
  const rxrfqResponses = useRxRfqsStore((state) => state.rxrfqResponses);
  const facilities = useProfileStore((state) => state.facilities);
  const products = useCatalogStore((state) => state.products);
  const fetchResponsesForRfq = useRxRfqsStore((state) => state.fetchResponsesForRfq);
  const updateRxRfqStatus = useRxRfqsStore((state) => state.updateRxRfqStatus);
  const extendRxRfqDeadline = useRxRfqsStore(
    (state) => state.extendRxRfqDeadline,
  );

  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) fetchResponsesForRfq(id);
  }, [id]);

  const rfq: RxRfqsData | null = useMemo(() => {
    let data = rxRfqData.find((item) => item.id === id);
    if (!data) return null;
    return { ...data, isBanned: false, bannedAt: new Date() };
  }, [rxRfqData, id]);

  const responses: RxRfqResponseCardData[] = useMemo(
    () =>
      rxrfqResponses
        .filter((response) => response.rfqId === id)
        .map(convertResponseDataToCardData),
    [rxrfqResponses, id],
  );

  const rawResponses = useMemo(
    () => rxrfqResponses.filter((response) => response.rfqId === id),
    [rxrfqResponses, id],
  );

  const onStatusChange = (newStatus: RxRfqStatusType) => {
    if (rfq) updateRxRfqStatus(rfq.id, newStatus);
  };

  const onExtendDeadline = (newDeadline: Date) => {
    if (rfq) extendRxRfqDeadline(rfq.id, newDeadline);
  };

  const onEdit = () => {
    if (rfq)
      router.push({ pathname: "/rfqs/add-rfqs", params: { id: rfq.id } });
  };

  if (!rfq) {
    if (isLoadingRfqs) {
      return (
        <SafeAreaView style={{ flex: 1 }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text>No RFQ found for id: {id}</Text>
      </SafeAreaView>
    );
  }
  const daysToDeadline = useMemo(
    () => diffDays(new Date(), rfq.submissionDeadline),
    [rfq.submissionDeadline],
  );

  const deadlineColor = useMemo(() => {
    if (rfq.status !== "published") return colors.textSecondary;
    if (daysToDeadline <= 1) return colors.error;
    if (daysToDeadline <= 3) return colors.warning;
    return colors.success;
  }, [daysToDeadline, rfq.status, colors]);

  const sortedResponses = useMemo(
    () => [...responses].sort((a, b) => b.grandTotal - a.grandTotal),
    [responses],
  );

  const handleStatusAction = (action: RxRfqStatusAction) => {
    actionsSheetRef.current?.dismiss();

    if (action.key === "award") {
      // Awarding requires picking a winning response — route to that flow.
      router.push({
        pathname: "/rfqs/award-rfq",
        params: { id: rfq.id },
      });
      return;
    }

    if (action.key === "extend") {
      // Give the actions sheet time to dismiss before presenting another.
      setTimeout(() => extendSheetRef.current?.present(), 250);
      return;
    }

    if (action.targetStatus) {
      onStatusChange(action.targetStatus);
    }
  };

  const handleExtendConfirm = (newDeadline: Date) => {
    extendSheetRef.current?.dismiss();
    onExtendDeadline(newDeadline);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header */}
        <View className="flex-row items-center px-3 py-3 border-b gap-1" style={{ borderBottomColor: colors.border }}>
          {Platform.OS !== "web" && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1.5"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
          )}

          <View className="flex-1 items-center gap-1">
            <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
              {rfq.code}
            </Text>
            <RxRfqStatusBadge status={rfq.status} size="sm" />
          </View>

          {rfq.status === "draft" && (
            <TouchableOpacity onPress={onEdit} className="p-1.5">
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          )}

          <PrintButton
            variant="icon"
            fileName={`RFQ-${rfq.code}-Summary`}
            getHtml={() =>
              buildRfqSummaryHtml(
                rfq,
                rawResponses,
                facilities.find((f) => f.id === rfq.facilityId),
                products,
              )
            }
          />

          <TouchableOpacity
            onPress={() => actionsSheetRef.current?.present()}
            className="p-1.5"
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Flagged warning */}
          {rfq.isBanned && (
            <View
              className="flex-row items-start gap-2.5 rounded-xl border p-3"
              style={{
                backgroundColor: colors.error + "12",
                borderColor: colors.error + "30",
              }}
            >
              <MaterialCommunityIcons
                name="shield-alert-outline"
                size={18}
                color={colors.error}
              />
              <View style={{ flex: 1 }}>
                <Text className="text-[13px] font-bold" style={{ color: colors.error }}>
                  This RFQ has been flagged
                </Text>
                {rfq.justificationNotes ? (
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {rfq.justificationNotes}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Award banner */}
          {rfq.status === "awarded" && (
            <View
              className="flex-row items-center gap-2.5 rounded-xl border p-3"
              style={{
                backgroundColor: colors.success + "12",
                borderColor: colors.success + "30",
              }}
            >
              <MaterialCommunityIcons
                name="trophy-outline"
                size={18}
                color={colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text className="text-[13px] font-bold" style={{ color: colors.success }}>
                  Vendor awarded
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  {fmtDate(rfq.awardDate)}
                </Text>
              </View>
            </View>
          )}

          {/* Title card */}
          <View
            className="rounded-[14px] border p-4 gap-2.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center gap-2.5 mb-1">
              <ClickableAvatar
                entityType="facility"
                entityId={rfq.facilityId}
                name={facilities.find((f) => f.id === rfq.facilityId)?.name ?? "Unknown facility"}
                avatarColor={colors.secondary}
                subtitle="Posted this RFQ"
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: colors.textSecondary }}>Posted by</Text>
                <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
                  {facilities.find((f) => f.id === rfq.facilityId)?.name ?? "Unknown facility"}
                </Text>
              </View>
            </View>
            {rfq.description ? (
              <Text
                className="text-[13px] leading-[19px]"
                style={{ color: colors.textSecondary }}
              >
                {rfq.description}
              </Text>
            ) : null}
            {rfq.categories.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 mt-0.5">
                {rfq.categories.map((cat) => (
                  <View
                    key={cat}
                    className="px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: colors.backgroundElement }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      {cat}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Stats */}
          <View className="flex-row flex-wrap gap-2">
            <View
              className="grow rounded-xl border p-2.5 items-center gap-1"
              style={{
                flexBasis: "23%",
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={18}
                color={colors.textSecondary}
              />
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {rfq.productCount}
              </Text>
              <Text className="text-[10px] text-center" style={{ color: colors.textSecondary }}>
                Products
              </Text>
            </View>
            <View
              className="grow rounded-xl border p-2.5 items-center gap-1"
              style={{
                flexBasis: "23%",
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {rfq.responseCount}
              </Text>
              <Text className="text-[10px] text-center" style={{ color: colors.textSecondary }}>
                Responses
              </Text>
            </View>
            <View
              className="grow rounded-xl border p-2.5 items-center gap-1"
              style={{
                flexBasis: "23%",
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={18}
                color={colors.textSecondary}
              />
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {rfq.currency}
              </Text>
              <Text className="text-[10px] text-center" style={{ color: colors.textSecondary }}>
                Currency
              </Text>
            </View>
            <View
              className="grow rounded-xl border p-2.5 items-center gap-1"
              style={{
                flexBasis: "23%",
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="truck-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {rfq.incoterms}
              </Text>
              <Text className="text-[10px] text-center" style={{ color: colors.textSecondary }}>
                Incoterms
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View
            className="rounded-[14px] border p-4 gap-2.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Timeline
            </Text>

            <View className="flex-row justify-between items-center py-[3px]">
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Created
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {fmtDateTime(rfq.createdAt)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-[3px]">
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Published
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {rfq.publishedAt
                  ? fmtDateTime(rfq.publishedAt)
                  : "Not yet published"}
              </Text>
            </View>

            <View
              className="flex-row justify-between items-center pt-2.5 mt-1"
              style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Submission deadline
                </Text>
                <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                  {fmtDateTime(rfq.submissionDeadline)}
                </Text>
                {rfq.status === "published" && (
                  <Text
                    className="text-[11px] font-semibold mt-0.5"
                    style={{ color: deadlineColor }}
                  >
                    {daysToDeadline > 0
                      ? `${daysToDeadline} day${daysToDeadline > 1 ? "s" : ""} remaining`
                      : "Deadline passed"}
                  </Text>
                )}
              </View>
              {(rfq.status === "published" || rfq.status === "expired") && (
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 px-3 py-[7px] rounded-lg border"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElement,
                  }}
                  onPress={() => extendSheetRef.current?.present()}
                >
                  <MaterialCommunityIcons
                    name="calendar-plus"
                    size={14}
                    color={colors.text}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.text }}
                  >
                    Extend
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row justify-between items-center py-[3px]">
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Expected delivery
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {fmtDate(rfq.deliveryDate)}
              </Text>
            </View>
          </View>

          {/* Requirements & terms */}
          <View
            className="rounded-[14px] border p-4 gap-2.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Requirements & Terms
            </Text>

            <View className="flex-row justify-between items-center py-[3px]">
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Minimum shelf life
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                  {rfq.minShelfLifeMonths} months
                </Text>
                {rfq.strictMinShelfLife && (
                  <View
                    className="px-[7px] py-0.5 rounded-md"
                    style={{ backgroundColor: colors.warning + "18" }}
                  >
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: colors.warning }}
                    >
                      Strict
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {rfq.termsOfService ? (
              <View style={{ marginTop: 4 }}>
                <Text
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Terms of service
                </Text>
                <Text className="text-xs leading-[18px]" style={{ color: colors.text }}>
                  {rfq.termsOfService}
                </Text>
              </View>
            ) : null}

            {rfq.comment ? (
              <View style={{ marginTop: 4 }}>
                <Text
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Internal comment
                </Text>
                <Text
                  className="text-xs leading-[18px]"
                  style={{ color: colors.textSecondary, fontStyle: "italic" }}
                >
                  {rfq.comment}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Items */}
          <View
            className="rounded-[14px] border p-4 gap-2.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Requested Items ({rfq.items.length})
            </Text>
            <RxRfqReadonlyItemsList items={rfq.items} />
          </View>

          {/* Visibility */}
          <View
            className="rounded-[14px] border p-4 gap-2.5"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Visibility
            </Text>
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name={
                  rfq.visibilityScope === "All" ? "earth" : "filter-outline"
                }
                size={18}
                color={colors.textSecondary}
              />
              <Text className="text-[13px] flex-1" style={{ color: colors.text }}>
                {rfq.visibilityScope === "All"
                  ? "Visible to all vendors on the marketplace"
                  : `Restricted · ${rfq.visibilityRules.length} rule${rfq.visibilityRules.length > 1 ? "s" : ""}`}
              </Text>
            </View>
            {rfq.visibilityScope === "Restricted" &&
              rfq.visibilityRules.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mt-1">
                  {rfq.visibilityRules.map((rule, idx) => (
                    <View
                      key={rule.id || idx}
                      className="px-2.5 py-[5px] rounded-lg"
                      style={{ backgroundColor: colors.backgroundElement }}
                    >
                      <Text
                        className="text-[11px] font-medium"
                        style={{ color: colors.textSecondary }}
                      >
                        {rule.ruleType}:{" "}
                        {rule.region || rule.facilityType || rule.facility}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
          </View>

          {/* Responses */}
          <View className="gap-2">
            <View className="flex-row justify-between items-baseline">
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                Responses ({responses.length})
              </Text>
              {responses.length > 1 && (
                <Text
                  className="text-[11px]"
                  style={{ color: colors.textSecondary }}
                >
                  Sorted by quote value
                </Text>
              )}
            </View>

            {sortedResponses.length === 0 ? (
              <View
                className="items-center justify-center py-7 px-5 rounded-xl border border-dashed gap-2"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                }}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text
                  className="text-[13px] text-center"
                  style={{ color: colors.textSecondary }}
                >
                  {rfq.status === "draft"
                    ? "Publish this RFQ to start receiving vendor responses."
                    : "No responses received yet."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {sortedResponses.map((response) => (
                  <RxRfqResponseSummaryCard
                    key={response.id}
                    response={response}
                    currency={rfq.currency}
                    isAwarded={rfq.awardedVendorId === response.id}
                    onPress={() =>
                      router.push({
                        pathname: "/rfqs/response-details",
                        params: { id: response.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <RxRfqStatusActionsSheet
          ref={actionsSheetRef}
          status={rfq.status}
          responseCount={responses.length}
          onClose={() => {}}
          onAction={handleStatusAction}
        />

        <RxRfqExtendDeadlineSheet
          ref={extendSheetRef}
          currentDeadline={rfq.submissionDeadline}
          onClose={() => {}}
          onConfirm={handleExtendConfirm}
        />
      </View>
    </SafeAreaView>
  );
};

export default RxRfqDetailsScreen;
