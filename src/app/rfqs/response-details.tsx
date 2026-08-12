import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
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
  <View style={[styles.divider, { backgroundColor: color }]} />
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
      style={[
        itemStyles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: status === "unfulfilled" ? 0.75 : 1,
        },
      ]}
    >
      <View style={itemStyles.headerRow}>
        <Text
          style={[itemStyles.productName, { color: colors.text }]}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <View style={itemStyles.badgeGroup}>
          {responseItem?.offeredAlternative && (
            <View
              style={[
                itemStyles.badge,
                { backgroundColor: colors.info + "18" },
              ]}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={12}
                color={colors.info}
              />
              <Text style={[itemStyles.badgeText, { color: colors.info }]}>
                Alternative
              </Text>
            </View>
          )}
          <View
            style={[
              itemStyles.badge,
              { backgroundColor: statusColor + "18" },
            ]}
          >
            <MaterialCommunityIcons
              name={statusMeta.icon as any}
              size={12}
              color={statusColor}
            />
            <Text style={[itemStyles.badgeText, { color: statusColor }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>
      </View>

      {responseItem?.offeredAlternative &&
        responseItem.alternativeProductDetails && (
          <View
            style={[
              itemStyles.altBox,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[itemStyles.altText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {responseItem.alternativeProductDetails}
            </Text>
          </View>
        )}

      <View style={itemStyles.qtyRow}>
        <Text style={[itemStyles.qtyLabel, { color: colors.textSecondary }]}>
          Qty offered
        </Text>
        <Text style={[itemStyles.qtyValue, { color: colors.text }]}>
          {offeredQty} / {requestedQty} {rfqItem.uom}
        </Text>
      </View>
      <ProgressBar
        pct={fulfilPct}
        color={statusColor}
        trackColor={colors.backgroundElement}
      />

      {responseItem ? (
        <View style={itemStyles.grid}>
          <View style={itemStyles.gridCol}>
            <Text
              style={[itemStyles.metaLabel, { color: colors.textSecondary }]}
            >
              Rate
            </Text>
            <Text style={[itemStyles.metaValue, { color: colors.text }]}>
              {currency} {formatAmount(responseItem.rate)}
            </Text>
          </View>
          <View style={[itemStyles.gridCol, itemStyles.alignRight]}>
            <Text
              style={[itemStyles.metaLabel, { color: colors.textSecondary }]}
            >
              Total Amount
            </Text>
            <Text style={[itemStyles.totalAmount, { color: colors.text }]}>
              {currency} {formatAmount(responseItem.amount)}
            </Text>
          </View>
        </View>
      ) : (
        <Text
          style={[itemStyles.noResponseText, { color: colors.textSecondary }]}
        >
          The vendor did not include this item in their quote.
        </Text>
      )}

      {!!(responseItem?.comment && responseItem.comment.trim().length > 0) && (
        <View
          style={[itemStyles.commentSection, { borderTopColor: colors.border }]}
        >
          <MaterialCommunityIcons
            name="comment-text-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text
            style={[itemStyles.commentText, { color: colors.textSecondary }]}
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {response.vendorFacility}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Response to {rfq?.code ?? response.rfqId}
          </Text>
        </View>
        {isAwarded && (
          <View
            style={[styles.awardBadge, { backgroundColor: colors.success + "18" }]}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={14}
              color={colors.success}
            />
            <Text style={[styles.awardBadgeText, { color: colors.success }]}>
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
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Submitted
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {fmtDate(response.submittedAt)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Quote valid until
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {fmtDate(response.quoteValidUntil)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Estimated delivery
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {fmtDate(response.estimatedDeliveryDate)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Incoterms
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {response.incoterms || "-"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Payment terms
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {response.paymentTerms || "-"}
            </Text>
          </View>
          {response.vendorComment ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Comment
              </Text>
              <Text style={[styles.value, { color: colors.text, flex: 1, textAlign: "right" }]}>
                {response.vendorComment}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Fulfilment Overview */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Fulfilment Overview
          </Text>
          <View style={styles.gaugeRow}>
            {/* VFR */}
            <View style={styles.gaugeItem}>
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
                style={[styles.gaugeLabel, { color: colors.textSecondary }]}
              >
                Item Fulfilment
              </Text>
              <Text style={[styles.gaugeSub, { color: colors.text }]}>
                {stats.respondedCount} / {stats.totalRfqItems} items
              </Text>
            </View>
            <View
              style={[
                styles.gaugeDivider,
                { backgroundColor: colors.border },
              ]}
            />
            {/* Volume */}
            <View style={styles.gaugeItem}>
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
                style={[styles.gaugeLabel, { color: colors.textSecondary }]}
              >
                Volume Fulfilment
              </Text>
              <Text style={[styles.gaugeSub, { color: colors.text }]}>
                {stats.totalOfferedQty} / {stats.totalRequestedQty} units
              </Text>
            </View>
          </View>

          {/* Alternatives row */}
          {stats.altCount > 0 && (
            <>
              <Divider color={colors.border} />
              <View style={styles.altRow}>
                <View
                  style={[
                    styles.altIcon,
                    { backgroundColor: colors.warning + "18" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={16}
                    color={colors.warning}
                  />
                </View>
                <Text style={[styles.altText, { color: colors.textSecondary }]}>
                  {stats.altCount} alternative
                  {stats.altCount > 1 ? "s" : ""} offered
                </Text>
                <Text style={[styles.altPct, { color: colors.warning }]}>
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
        <View style={styles.itemsHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Items ({lineItems.length})
          </Text>
          <View style={styles.itemsHeaderBadges}>
            {stats.partialCount > 0 && (
              <View
                style={[
                  styles.miniBadge,
                  { backgroundColor: colors.warning + "18" },
                ]}
              >
                <Text style={[styles.miniBadgeText, { color: colors.warning }]}>
                  {stats.partialCount} partial
                </Text>
              </View>
            )}
            {stats.unfulfilledCount > 0 && (
              <View
                style={[
                  styles.miniBadge,
                  { backgroundColor: colors.error + "18" },
                ]}
              >
                <Text style={[styles.miniBadgeText, { color: colors.error }]}>
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
          style={[
            styles.card,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>
            Cost summary
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Items subtotal
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {response.currency} {formatAmount(response.totalItemsAmount)}
            </Text>
          </View>
          {response.additionalCosts.map((cost) => (
            <View style={styles.row} key={cost.id}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {cost.description}
                {!cost.isRequired ? " (optional)" : ""}
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {response.currency} {formatAmount(cost.amount)}
              </Text>
            </View>
          ))}
          <View
            style={[
              styles.row,
              styles.totalRow,
              { borderTopColor: colors.border },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Grand total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {response.currency} {formatAmount(response.grandTotal)}
            </Text>
          </View>
        </View>

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
  awardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  awardBadgeText: { fontSize: 11, fontWeight: "700" },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { fontSize: 12 },
  value: { fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: "700" },
  totalValue: { fontSize: 15, fontWeight: "800" },

  // Fulfilment overview
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  gaugeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  gaugeItem: { alignItems: "center", gap: 6, flex: 1 },
  gaugeLabel: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  gaugeSub: { fontSize: 11, fontWeight: "400", textAlign: "center" },
  gaugeDivider: { width: 1, height: 80, marginHorizontal: 8 },
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  altIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  altText: { flex: 1, fontSize: 13 },
  altPct: { fontSize: 12, fontWeight: "600" },

  // Items section header
  itemsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  itemsHeaderBadges: { flexDirection: "row", gap: 6 },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniBadgeText: { fontSize: 11, fontWeight: "700" },
});

// ─── per-line-item card styles ─────────────────────────────────────────────

const itemStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  productName: { fontSize: 15, fontWeight: "600", flex: 1 },
  badgeGroup: { flexDirection: "row", gap: 6 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  altBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 9,
    borderRadius: 8,
    gap: 6,
  },
  altText: { fontSize: 12, flex: 1, fontStyle: "italic", lineHeight: 16 },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qtyLabel: { fontSize: 12 },
  qtyValue: { fontSize: 13, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridCol: { flexDirection: "column" },
  alignRight: { alignItems: "flex-end" },
  metaLabel: { fontSize: 11, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: "500" },
  totalAmount: { fontSize: 14, fontWeight: "700" },
  noResponseText: { fontSize: 12, fontStyle: "italic" },
  commentSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 6,
  },
  commentText: { fontSize: 12, flex: 1, lineHeight: 16 },
});
