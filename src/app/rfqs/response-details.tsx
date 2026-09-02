import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { formatAmount } from "@/shared/utils/format";
import ArcGaugeNew from "@/shared/components/arc-gauge";
import PrintButton from "@/shared/components/print-button";
import { buildRfqQuoteHtml } from "@/features/rxrfqs/utils/rxrfq-pdf";
import {
  RxRfqItem,
  RxRfqResponseItem,
} from "@/features/rxrfqs/types/rxrfqs.types";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View className="w-full" style={{ height: StyleSheet.hairlineWidth, backgroundColor: color }} />
);

const ProgressBar: React.FC<{
  pct: number;
  color: string;
  trackColor: string;
  height?: number;
}> = ({ pct, color, trackColor, height = 6 }) => (
  <View
    style={{
      width: "100%",
      height,
      borderRadius: height / 2,
      backgroundColor: trackColor,
      overflow: "hidden",
    }}
  >
    <View
      style={{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        height,
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  </View>
);

// ─── per-line-item fulfilment status ─────────────────────────────────────

type LineItemStatus = "full" | "partial" | "unfulfilled";

const LINE_STATUS_META: Record<
  LineItemStatus,
  { label: string; icon: string }
> = {
  full: { label: "Fully quoted", icon: "check-circle-outline" },
  partial: { label: "Partially quoted", icon: "alert-circle-outline" },
  unfulfilled: { label: "Not quoted", icon: "close-circle-outline" },
};

const LineItemCard: React.FC<{
  rfqItem: RxRfqItem;
  responseItem?: RxRfqResponseItem;
  currency: string;
}> = ({ rfqItem, responseItem, currency }) => {
  const { colors } = useTheme();
  const productName =
    useCatalogStore((state) => state.getProduct(rfqItem.productId)?.name) ?? "Unknown product";

  const requestedQty = rfqItem.quantity;
  const offeredQty = responseItem?.quantity ?? 0;
  const fulfilPct =
    requestedQty > 0 ? (offeredQty / requestedQty) * 100 : 0;

  const status: LineItemStatus = !responseItem
    ? "unfulfilled"
    : offeredQty < requestedQty
      ? "partial"
      : "full";

  const statusColor =
    status === "full"
      ? colors.success
      : status === "partial"
        ? colors.warning
        : colors.error;
  const statusMeta = LINE_STATUS_META[status];

  return (
    <View
      className="rounded-xl border p-3.5 gap-2.5"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        opacity: status === "unfulfilled" ? 0.75 : 1,
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text
          className="text-[15px] font-semibold flex-1"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <View className="flex-row gap-1.5">
          {responseItem?.offeredAlternative && (
            <View
              className="flex-row items-center gap-1 px-[7px] py-[3px] rounded-md"
              style={{ backgroundColor: colors.info + "18" }}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={12}
                color={colors.info}
              />
              <Text className="text-[10px] font-bold uppercase" style={{ color: colors.info }}>
                Alternative
              </Text>
            </View>
          )}
          <View
            className="flex-row items-center gap-1 px-[7px] py-[3px] rounded-md"
            style={{ backgroundColor: statusColor + "18" }}
          >
            <MaterialCommunityIcons
              name={statusMeta.icon as any}
              size={12}
              color={statusColor}
            />
            <Text className="text-[10px] font-bold uppercase" style={{ color: statusColor }}>
              {statusMeta.label}
            </Text>
          </View>
        </View>
      </View>

      {responseItem?.offeredAlternative &&
        responseItem.alternativeProductDetails && (
          <View
            className="flex-row items-start p-[9px] rounded-lg gap-1.5"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              className="text-xs flex-1 italic leading-4"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              {responseItem.alternativeProductDetails}
            </Text>
          </View>
        )}

      <View className="flex-row justify-between items-center">
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          Qty offered
        </Text>
        <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
          {offeredQty} / {requestedQty} {rfqItem.uom}
        </Text>
      </View>
      <ProgressBar
        pct={fulfilPct}
        color={statusColor}
        trackColor={colors.backgroundElement}
      />

      {responseItem ? (
        <View className="flex-row justify-between items-center">
          <View className="flex-col">
            <Text
              className="text-[11px] mb-0.5"
              style={{ color: colors.textSecondary }}
            >
              Rate
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {currency} {formatAmount(responseItem.rate)}
            </Text>
          </View>
          <View className="flex-col items-end">
            <Text
              className="text-[11px] mb-0.5"
              style={{ color: colors.textSecondary }}
            >
              Total Amount
            </Text>
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              {currency} {formatAmount(responseItem.amount)}
            </Text>
          </View>
        </View>
      ) : (
        <Text
          className="text-xs italic"
          style={{ color: colors.textSecondary }}
        >
          The vendor did not include this item in their quote.
        </Text>
      )}

      {!!(responseItem?.comment && responseItem.comment.trim().length > 0) && (
        <View
          className="flex-row items-start gap-1.5 pt-2"
          style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}
        >
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text
            className="text-xs flex-1 leading-4"
            style={{ color: colors.textSecondary }}
            numberOfLines={2}
          >
            {responseItem.comment}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── main screen ──────────────────────────────────────────────────────────

export default function ResponseDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const rxrfqResponses = useRxRfqsStore((state) => state.rxrfqResponses);
  const rxRfqMarketPlace = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const facilities = useProfileStore((state) => state.facilities);
  const products = useCatalogStore((state) => state.products);
  const fetchResponse = useRxRfqsStore((state) => state.fetchResponse);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchResponse(id).finally(() => setIsLoading(false));
  }, [id]);


  const response = useMemo(
    () => rxrfqResponses.find((r) => r.id === id),
    [rxrfqResponses, id],
  );

  const rfq = useMemo(
    () => rxRfqMarketPlace.find((r) => r.id === response?.rfqId),
    [rxRfqMarketPlace, response],
  );

  // Pair up every requested RFQ line with the vendor's response line (if
  // any) so we can flag partial / missing / alternative items individually.
  const lineItems = useMemo(() => {
    if (!response) return [];
    const rfqItems = rfq?.items ?? [];

    if (rfqItems.length === 0) {
      // No RFQ reference available — fall back to showing whatever the
      // vendor quoted, treated as fully quoted since there's nothing to
      // compare against.
      return response.items.map((responseItem) => ({
        rfqItem: {
          id: responseItem.rfqItemId,
          productId: responseItem.productId,
          quantity: responseItem.quantity,
          uom: "",
          allowAlternatives: true,
        } as RxRfqItem,
        responseItem,
      }));
    }

    return rfqItems.map((rfqItem) => ({
      rfqItem,
      responseItem: response.items.find(
        (item) => item.rfqItemId === rfqItem.id,
      ),
    }));
  }, [rfq, response]);

  // ── fulfilment overview ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const rfqItems = rfq?.items ?? [];
    const items = response?.items ?? [];

    const totalRfqItems = rfqItems.length;
    const respondedCount = items.length;
    const vfrPct =
      totalRfqItems > 0 ? (respondedCount / totalRfqItems) * 100 : 0;

    // Volume: sum of responded qty vs requested qty
    const totalRequestedQty = rfqItems.reduce((s, i) => s + i.quantity, 0);
    const totalOfferedQty = items.reduce((s, i) => s + i.quantity, 0);
    const volPct =
      totalRequestedQty > 0 ? (totalOfferedQty / totalRequestedQty) * 100 : 0;

    // Alternatives
    const altCount = items.filter((i) => i.offeredAlternative).length;

    // Per-line breakdown, used for the badges next to "Items (n)" below
    const fullCount = lineItems.filter(
      (li) => li.responseItem && li.responseItem.quantity >= li.rfqItem.quantity,
    ).length;
    const partialCount = lineItems.filter(
      (li) => li.responseItem && li.responseItem.quantity < li.rfqItem.quantity,
    ).length;
    const unfulfilledCount = lineItems.filter((li) => !li.responseItem).length;

    return {
      totalRfqItems,
      respondedCount,
      vfrPct,
      totalRequestedQty,
      totalOfferedQty,
      volPct,
      altCount,
      fullCount,
      partialCount,
      unfulfilledCount,
    };
  }, [rfq, response, lineItems]);

  const gaugeColor = (pct: number) => {
    if (pct >= 80) return colors.success;
    if (pct >= 50) return colors.warning;
    return colors.error;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <DetailSkeleton rows={5} />
      </SafeAreaView>
    );
  }

  if (!response) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>
          No response found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isAwarded = rfq?.awardedVendorId === response.id;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScreenHeader
        title={response.vendorFacility}
        subtitle={`Response to ${rfq?.code ?? response.rfqId}`}
        actions={
          <>
            {isAwarded && (
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
                style={{ backgroundColor: colors.success + "18" }}
              >
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={14}
                  color={colors.success}
                />
                <Text className="text-[11px] font-bold" style={{ color: colors.success }}>
                  Awarded
                </Text>
              </View>
            )}
            {rfq && (
              <PrintButton
                variant="icon"
                fileName={`Quote-${rfq.code}-${response.vendorFacility}`}
                getHtml={() =>
                  buildRfqQuoteHtml(
                    rfq,
                    response,
                    facilities.find((f) => f.id === rfq.facilityId),
                    products,
                  )
                }
              />
            )}
          </>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View
          className="rounded-[14px] border p-4 gap-2"
          style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
        >
          <View className="flex-row justify-between py-[3px]">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Submitted
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {fmtDate(response.submittedAt)}
            </Text>
          </View>
          <View className="flex-row justify-between py-[3px]">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Quote valid until
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {fmtDate(response.quoteValidUntil)}
            </Text>
          </View>
          <View className="flex-row justify-between py-[3px]">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Estimated delivery
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {fmtDate(response.estimatedDeliveryDate)}
            </Text>
          </View>
          <View className="flex-row justify-between py-[3px]">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Incoterms
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {response.incoterms || "-"}
            </Text>
          </View>
          <View className="flex-row justify-between py-[3px]">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Payment terms
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {response.paymentTerms || "-"}
            </Text>
          </View>
          {response.vendorComment ? (
            <View className="flex-row justify-between py-[3px]">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Comment
              </Text>
              <Text className="text-[13px] font-medium flex-1 text-right" style={{ color: colors.text }}>
                {response.vendorComment}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Fulfilment Overview */}
        <View
          className="rounded-[14px] border p-4 gap-2"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <Text className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
            Fulfilment Overview
          </Text>
          <View className="flex-row items-center justify-around py-1">
            {/* VFR */}
            <View className="items-center gap-1.5 flex-1">
              <ArcGaugeNew
                pct={stats.vfrPct}
                size={90}
                stroke={8}
                color={gaugeColor(stats.vfrPct)}
                trackColor={colors.backgroundElement}
                label={`${Math.round(stats.vfrPct)}%`}
                sublabel="VFR"
                textColor={colors.text}
                subtextColor={colors.textSecondary}
              />
              <Text
                className="text-xs font-medium text-center"
                style={{ color: colors.textSecondary }}
              >
                Item Fulfilment
              </Text>
              <Text className="text-[11px] font-normal text-center" style={{ color: colors.text }}>
                {stats.respondedCount} / {stats.totalRfqItems} items
              </Text>
            </View>
            <View
              className="w-px h-20 mx-2"
              style={{ backgroundColor: colors.border }}
            />
            {/* Volume */}
            <View className="items-center gap-1.5 flex-1">
              <ArcGaugeNew
                pct={stats.volPct}
                size={90}
                stroke={8}
                color={gaugeColor(stats.volPct)}
                trackColor={colors.backgroundElement}
                label={`${Math.round(stats.volPct)}%`}
                sublabel="Vol"
                textColor={colors.text}
                subtextColor={colors.textSecondary}
              />
              <Text
                className="text-xs font-medium text-center"
                style={{ color: colors.textSecondary }}
              >
                Volume Fulfilment
              </Text>
              <Text className="text-[11px] font-normal text-center" style={{ color: colors.text }}>
                {stats.totalOfferedQty} / {stats.totalRequestedQty} units
              </Text>
            </View>
          </View>

          {/* Alternatives row */}
          {stats.altCount > 0 && (
            <>
              <Divider color={colors.border} />
              <View className="flex-row items-center gap-2.5 py-0.5">
                <View
                  className="w-7 h-7 rounded-[7px] items-center justify-center"
                  style={{ backgroundColor: colors.warning + "18" }}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={16}
                    color={colors.warning}
                  />
                </View>
                <Text className="flex-1 text-[13px]" style={{ color: colors.textSecondary }}>
                  {stats.altCount} alternative
                  {stats.altCount > 1 ? "s" : ""} offered
                </Text>
                <Text className="text-xs font-semibold" style={{ color: colors.warning }}>
                  {stats.respondedCount > 0
                    ? Math.round((stats.altCount / stats.respondedCount) * 100)
                    : 0}
                  % of quoted items
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Items — one card per requested line, flagged if partial / missing / alternative */}
        <View className="flex-row items-center justify-between flex-wrap gap-1.5">
          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Items ({lineItems.length})
          </Text>
          <View className="flex-row gap-1.5">
            {stats.partialCount > 0 && (
              <View
                className="px-2 py-[3px] rounded-md"
                style={{ backgroundColor: colors.warning + "18" }}
              >
                <Text className="text-[11px] font-bold" style={{ color: colors.warning }}>
                  {stats.partialCount} partial
                </Text>
              </View>
            )}
            {stats.unfulfilledCount > 0 && (
              <View
                className="px-2 py-[3px] rounded-md"
                style={{ backgroundColor: colors.error + "18" }}
              >
                <Text className="text-[11px] font-bold" style={{ color: colors.error }}>
                  {stats.unfulfilledCount} not quoted
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          {lineItems.map(({ rfqItem, responseItem }) => (
            <LineItemCard
              key={rfqItem.id}
              rfqItem={rfqItem}
              responseItem={responseItem}
              currency={response.currency}
            />
          ))}
        </View>

        <View
          className="rounded-[14px] border p-4 gap-2"
          style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
        >
          <Text className="text-sm font-bold" style={{ color: colors.text, marginBottom: 4 }}>
            Cost summary
          </Text>
          <View className="flex-row justify-between py-[3px]">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Items subtotal
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {response.currency} {formatAmount(response.totalItemsAmount)}
            </Text>
          </View>
          {response.additionalCosts.map((cost) => (
            <View className="flex-row justify-between py-[3px]" key={cost.id}>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {cost.description}
                {!cost.isRequired ? " (optional)" : ""}
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {response.currency} {formatAmount(cost.amount)}
              </Text>
            </View>
          ))}
          <View
            className="flex-row justify-between py-[3px] mt-1.5 pt-2.5"
            style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.text }}>
              Grand total
            </Text>
            <Text className="text-[15px] font-extrabold" style={{ color: colors.text }}>
              {response.currency} {formatAmount(response.grandTotal)}
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
