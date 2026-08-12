// RxRfqResponseSummaryModal.tsx
import React, { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  RxRfqItem,
  RxRfqResponseFormData,
  RxRfqAdditionalCostItem,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { SafeAreaView } from "react-native-safe-area-context";
import ArcGaugeNew from "@/shared/components/arc-gauge";

interface RxRfqResponseSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  formData: RxRfqResponseFormData;
  rfqItems: RxRfqItem[]; // original RFQ lines for fulfilment calc
  rfqSubmissionDeadline: Date;
  isSaving?: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const diffDays = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / 86400000);

// ─── sub-components ─────────────────────────────────────────────────────────

const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View style={[summaryStyles.divider, { backgroundColor: color }]} />
);

const MetaRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  colors: any;
}> = ({ icon, label, value, colors }) => (
  <View style={summaryStyles.metaRow}>
    <MaterialCommunityIcons
      name={icon as any}
      size={16}
      color={colors.textSecondary}
    />
    <Text style={[summaryStyles.metaLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
    <Text
      style={[summaryStyles.metaValue, { color: colors.text }]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
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

// ─── main component ──────────────────────────────────────────────────────────

const RxRfqResponseSummaryModal: React.FC<RxRfqResponseSummaryModalProps> = ({
  visible,
  onClose,
  onSaveDraft,
  onPublish,
  formData,
  rfqItems,
  rfqSubmissionDeadline,
  isSaving = false,
}) => {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const {
      items,
      additionalCosts,
      currency,
      quoteValidUntil,
      estimatedDeliveryDate,
    } = formData;

    // ── fulfilment ──────────────────────────────────────────────────────────
    const totalRfqItems = rfqItems.length;
    const respondedCount = items.length;
    const vfrPct =
      totalRfqItems > 0 ? (respondedCount / totalRfqItems) * 100 : 0;

    // Volume: sum of responded qty vs requested qty
    const totalRequestedQty = rfqItems.reduce((s, i) => s + i.quantity, 0);
    const totalOfferedQty = items.reduce((s, i) => s + i.quantity, 0);
    const volPct =
      totalRequestedQty > 0 ? (totalOfferedQty / totalRequestedQty) * 100 : 0;

    // Value fulfilment: items subtotal
    const itemsSubtotal = items.reduce((s, i) => s + i.amount, 0);

    // Additional costs
    const mandatoryCosts = additionalCosts.filter((c) => c.isRequired);
    const optionalCosts = additionalCosts.filter((c) => !c.isRequired);
    const mandatoryTotal = mandatoryCosts.reduce((s, c) => s + c.amount, 0);
    const optionalTotal = optionalCosts.reduce((s, c) => s + c.amount, 0);
    const grandTotal = itemsSubtotal + mandatoryTotal;

    // Alternatives
    const altCount = items.filter((i) => i.offeredAlternative).length;

    // Dates
    const today = new Date();
    const validityDays = diffDays(today, quoteValidUntil);
    const deliveryDays = diffDays(today, estimatedDeliveryDate);
    const deadlineDays = diffDays(today, rfqSubmissionDeadline);

    return {
      totalRfqItems,
      respondedCount,
      vfrPct,
      totalRequestedQty,
      totalOfferedQty,
      volPct,
      itemsSubtotal,
      mandatoryCosts,
      optionalCosts,
      mandatoryTotal,
      optionalTotal,
      grandTotal,
      altCount,
      validityDays,
      deliveryDays,
      deadlineDays,
      currency,
      quoteValidUntil,
      estimatedDeliveryDate,
    };
  }, [formData, rfqItems]);

  const gaugeColor = (pct: number) => {
    if (pct >= 80) return colors.success;
    if (pct >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBack}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Quote Summary
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Review before submitting
            </Text>
          </View>
          {/* deadline urgency badge */}
          <View
            style={[
              styles.deadlineBadge,
              {
                backgroundColor:
                  stats.deadlineDays <= 1
                    ? colors.error + "18"
                    : stats.deadlineDays <= 3
                      ? colors.warning + "18"
                      : colors.success + "18",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={13}
              color={
                stats.deadlineDays <= 1
                  ? colors.error
                  : stats.deadlineDays <= 3
                    ? colors.warning
                    : colors.success
              }
            />
            <Text
              style={[
                styles.deadlineBadgeText,
                {
                  color:
                    stats.deadlineDays <= 1
                      ? colors.error
                      : stats.deadlineDays <= 3
                        ? colors.warning
                        : colors.success,
                },
              ]}
            >
              {stats.deadlineDays <= 0
                ? "Overdue"
                : `${stats.deadlineDays}d left`}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Fulfilment gauges ───────────────────────────────────── */}
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
                <View style={summaryStyles.altRow}>
                  <View
                    style={[
                      summaryStyles.altIcon,
                      { backgroundColor: colors.warning + "18" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal"
                      size={16}
                      color={colors.warning}
                    />
                  </View>
                  <Text
                    style={[
                      summaryStyles.altText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {stats.altCount} alternative
                    {stats.altCount > 1 ? "s" : ""} offered
                  </Text>
                  <Text
                    style={[summaryStyles.altPct, { color: colors.warning }]}
                  >
                    {Math.round((stats.altCount / stats.respondedCount) * 100)}%
                    of quoted items
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ── Value breakdown ─────────────────────────────────────── */}
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
              Value Breakdown
            </Text>

            <View style={summaryStyles.valueRow}>
              <Text
                style={[
                  summaryStyles.valueLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Items subtotal
              </Text>
              <Text style={[summaryStyles.valueAmount, { color: colors.text }]}>
                {fmt(stats.itemsSubtotal, stats.currency)}
              </Text>
            </View>

            {/* Mandatory costs */}
            {stats.mandatoryCosts.length > 0 && (
              <>
                <View style={summaryStyles.costGroupHeader}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={13}
                    color={colors.error}
                  />
                  <Text
                    style={[
                      summaryStyles.costGroupLabel,
                      { color: colors.error },
                    ]}
                  >
                    Mandatory costs ({stats.mandatoryCosts.length})
                  </Text>
                </View>
                {stats.mandatoryCosts.map((c) => (
                  <View key={c.id} style={summaryStyles.costRow}>
                    <Text
                      style={[
                        summaryStyles.costDesc,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      · {c.description}
                    </Text>
                    <Text
                      style={[summaryStyles.costAmt, { color: colors.text }]}
                    >
                      {fmt(c.amount, stats.currency)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Optional costs */}
            {stats.optionalCosts.length > 0 && (
              <>
                <View style={summaryStyles.costGroupHeader}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={13}
                    color={colors.info}
                  />
                  <Text
                    style={[
                      summaryStyles.costGroupLabel,
                      { color: colors.info },
                    ]}
                  >
                    Optional costs ({stats.optionalCosts.length})
                  </Text>
                </View>
                {stats.optionalCosts.map((c) => (
                  <View key={c.id} style={summaryStyles.costRow}>
                    <Text
                      style={[
                        summaryStyles.costDesc,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      · {c.description}
                    </Text>
                    <Text
                      style={[
                        summaryStyles.costAmt,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {fmt(c.amount, stats.currency)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <Divider color={colors.border} />

            {/* Grand total */}
            <View style={summaryStyles.grandTotalRow}>
              <View>
                <Text
                  style={[
                    summaryStyles.grandTotalLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Grand Total
                </Text>
                {stats.optionalTotal > 0 && (
                  <Text
                    style={[
                      summaryStyles.grandTotalNote,
                      { color: colors.textSecondary },
                    ]}
                  >
                    excl. {fmt(stats.optionalTotal, stats.currency)} optional
                  </Text>
                )}
              </View>
              <Text
                style={[summaryStyles.grandTotalValue, { color: colors.text }]}
              >
                {fmt(stats.grandTotal, stats.currency)}
              </Text>
            </View>
          </View>

          {/* ── Validity & delivery ─────────────────────────────────── */}
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
              Terms & Timeline
            </Text>

            <MetaRow
              icon="calendar-check-outline"
              label="Quote valid until"
              value={`${fmtDate(formData.quoteValidUntil)} · ${stats.validityDays}d`}
              colors={colors}
            />
            <MetaRow
              icon="truck-delivery-outline"
              label="Est. delivery"
              value={`${fmtDate(formData.estimatedDeliveryDate)} · ${stats.deliveryDays}d`}
              colors={colors}
            />
            <MetaRow
              icon="swap-horizontal"
              label="Incoterms"
              value={formData.incoterms}
              colors={colors}
            />
            <MetaRow
              icon="cash-multiple"
              label="Payment terms"
              value={formData.paymentTerms}
              colors={colors}
            />
            <MetaRow
              icon="currency-usd"
              label="Currency"
              value={formData.currency}
              colors={colors}
            />

            {/* RFQ validity progress bar */}
            <Divider color={colors.border} />
            <View style={summaryStyles.validityBlock}>
              <View style={summaryStyles.validityHeader}>
                <Text
                  style={[
                    summaryStyles.validityLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Quote validity period
                </Text>
                <Text
                  style={[summaryStyles.validityDays, { color: colors.text }]}
                >
                  {stats.validityDays} days
                </Text>
              </View>
              <ProgressBar
                pct={Math.min(100, (stats.validityDays / 90) * 100)}
                color={gaugeColor(
                  Math.min(100, (stats.validityDays / 90) * 100),
                )}
                trackColor={colors.backgroundElement}
                height={7}
              />
              <Text
                style={[
                  summaryStyles.validityHint,
                  { color: colors.textSecondary },
                ]}
              >
                Based on 90-day benchmark
              </Text>
            </View>
          </View>

          {/* ── Vendor comment preview ──────────────────────────────── */}
          {formData.vendorComment?.trim() ? (
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
                Your Comment
              </Text>
              <Text
                style={[
                  summaryStyles.commentText,
                  { color: colors.textSecondary },
                ]}
              >
                {formData.vendorComment}
              </Text>
            </View>
          ) : null}

          {/* bottom spacing so content clears the sticky footer */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── Sticky action footer ────────────────────────────────────── */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.draftButton,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
            onPress={onSaveDraft}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={18}
              color={colors.text}
            />
            <Text style={[styles.draftButtonText, { color: colors.text }]}>
              Save Draft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.publishButton, { backgroundColor: colors.text }]}
            onPress={onPublish}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="send-outline"
              size={18}
              color={colors.backgroundSecondary}
            />
            <Text
              style={[
                styles.publishButtonText,
                { color: colors.backgroundSecondary },
              ]}
            >
              Submit Quote
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBack: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },
  deadlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deadlineBadgeText: { fontSize: 12, fontWeight: "600" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
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

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  draftButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  draftButtonText: { fontSize: 15, fontWeight: "600" },
  publishButton: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  publishButtonText: { fontSize: 15, fontWeight: "600" },
});

const summaryStyles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, width: "100%" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  metaLabel: { fontSize: 13, flex: 1 },
  metaValue: { fontSize: 13, fontWeight: "500", maxWidth: "55%" },

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

  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  valueLabel: { fontSize: 13 },
  valueAmount: { fontSize: 13, fontWeight: "500" },

  costGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    marginBottom: 2,
  },
  costGroupLabel: { fontSize: 12, fontWeight: "600" },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingLeft: 8,
  },
  costDesc: { fontSize: 12, flex: 1 },
  costAmt: { fontSize: 12, fontWeight: "500" },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 4,
  },
  grandTotalLabel: { fontSize: 13, fontWeight: "600" },
  grandTotalNote: { fontSize: 11, marginTop: 2 },
  grandTotalValue: { fontSize: 20, fontWeight: "700" },

  validityBlock: { gap: 6 },
  validityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validityLabel: { fontSize: 12, fontWeight: "500" },
  validityDays: { fontSize: 12, fontWeight: "600" },
  validityHint: { fontSize: 11 },

  commentText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
  },
});

export default RxRfqResponseSummaryModal;
