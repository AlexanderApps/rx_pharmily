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
  <View className="w-full" style={{ height: StyleSheet.hairlineWidth, backgroundColor: color }} />
);

const MetaRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  colors: any;
}> = ({ icon, label, value, colors }) => (
  <View className="flex-row items-center gap-2.5 py-1">
    <MaterialCommunityIcons
      name={icon as any}
      size={16}
      color={colors.textSecondary}
    />
    <Text className="text-[13px] flex-1" style={{ color: colors.textSecondary }}>
      {label}
    </Text>
    <Text
      className="text-[13px] font-medium max-w-[55%]"
      style={{ color: colors.text }}
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
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View className="flex-row items-center px-4 py-3.5 border-b gap-3" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={onClose} className="p-1">
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
              Quote Summary
            </Text>
            <Text className="text-xs mt-px" style={{ color: colors.textSecondary }}>
              Review before submitting
            </Text>
          </View>
          {/* deadline urgency badge */}
          <View
            className="flex-row items-center gap-1 px-[9px] py-[5px] rounded-lg"
            style={{
              backgroundColor:
                stats.deadlineDays <= 1
                  ? colors.error + "18"
                  : stats.deadlineDays <= 3
                    ? colors.warning + "18"
                    : colors.success + "18",
            }}
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
              className="text-xs font-semibold"
              style={{
                color:
                  stats.deadlineDays <= 1
                    ? colors.error
                    : stats.deadlineDays <= 3
                      ? colors.warning
                      : colors.success,
              }}
            >
              {stats.deadlineDays <= 0
                ? "Overdue"
                : `${stats.deadlineDays}d left`}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Fulfilment gauges ───────────────────────────────────── */}
          <View
            className="rounded-[14px] border p-4 gap-3"
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
                  <Text
                    className="flex-1 text-[13px]"
                    style={{ color: colors.textSecondary }}
                  >
                    {stats.altCount} alternative
                    {stats.altCount > 1 ? "s" : ""} offered
                  </Text>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.warning }}
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
            className="rounded-[14px] border p-4 gap-3"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
              Value Breakdown
            </Text>

            <View className="flex-row justify-between items-center py-[3px]">
              <Text
                className="text-[13px]"
                style={{ color: colors.textSecondary }}
              >
                Items subtotal
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {fmt(stats.itemsSubtotal, stats.currency)}
              </Text>
            </View>

            {/* Mandatory costs */}
            {stats.mandatoryCosts.length > 0 && (
              <>
                <View className="flex-row items-center gap-1.5 mt-1 mb-0.5">
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={13}
                    color={colors.error}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.error }}
                  >
                    Mandatory costs ({stats.mandatoryCosts.length})
                  </Text>
                </View>
                {stats.mandatoryCosts.map((c) => (
                  <View key={c.id} className="flex-row justify-between py-[3px] pl-2">
                    <Text
                      className="text-xs flex-1"
                      style={{ color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      · {c.description}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.text }}
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
                <View className="flex-row items-center gap-1.5 mt-1 mb-0.5">
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={13}
                    color={colors.info}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: colors.info }}
                  >
                    Optional costs ({stats.optionalCosts.length})
                  </Text>
                </View>
                {stats.optionalCosts.map((c) => (
                  <View key={c.id} className="flex-row justify-between py-[3px] pl-2">
                    <Text
                      className="text-xs flex-1"
                      style={{ color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      · {c.description}
                    </Text>
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      {fmt(c.amount, stats.currency)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <Divider color={colors.border} />

            {/* Grand total */}
            <View className="flex-row justify-between items-end pt-1">
              <View>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  Grand Total
                </Text>
                {stats.optionalTotal > 0 && (
                  <Text
                    className="text-[11px] mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    excl. {fmt(stats.optionalTotal, stats.currency)} optional
                  </Text>
                )}
              </View>
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                {fmt(stats.grandTotal, stats.currency)}
              </Text>
            </View>
          </View>

          {/* ── Validity & delivery ─────────────────────────────────── */}
          <View
            className="rounded-[14px] border p-4 gap-3"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <Text className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
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
            <View className="gap-1.5">
              <View className="flex-row justify-between items-center">
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Quote validity period
                </Text>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.text }}
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
                className="text-[11px]"
                style={{ color: colors.textSecondary }}
              >
                Based on 90-day benchmark
              </Text>
            </View>
          </View>

          {/* ── Vendor comment preview ──────────────────────────────── */}
          {formData.vendorComment?.trim() ? (
            <View
              className="rounded-[14px] border p-4 gap-3"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <Text className="text-sm font-bold mb-0.5" style={{ color: colors.text }}>
                Your Comment
              </Text>
              <Text
                className="text-[13px] leading-5 italic"
                style={{ color: colors.textSecondary }}
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
          className="flex-row gap-2.5 px-4 py-3.5 border-t"
          style={{
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl border"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            }}
            onPress={onSaveDraft}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={18}
              color={colors.text}
            />
            <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
              Save Draft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-[1.4] flex-row items-center justify-center gap-2 py-3.5 rounded-xl"
            style={{ backgroundColor: colors.text }}
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
              className="text-[15px] font-semibold"
              style={{ color: colors.backgroundSecondary }}
            >
              Submit Quote
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default RxRfqResponseSummaryModal;
