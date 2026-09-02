import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isSuperadminRole } from "@/features/auth/types/auth.types";
import { usePaymentsStore } from "@/features/payments/hooks/use-payments-data";
import { Payment } from "@/features/payments/types/payments.types";
import { formatAmount } from "@/shared/utils/format";

export default function AdminPaymentsScreen() {
  const { colors } = useTheme();
  // Deliberately isSuperadminRole, not isAdminRole — marking a payment
  // paid or cancelled is superadmin-only, matching the RLS policy on
  // the payments table itself (see 20260822000000_payments_table.sql).
  // A regular admin landing here via a stale link sees the same
  // redirect any non-admin would.
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));

  const pendingPayments = usePaymentsStore((state) => state.pendingPayments);
  const fetchPendingPayments = usePaymentsStore((state) => state.fetchPendingPayments);
  const markPaymentPaid = usePaymentsStore((state) => state.markPaymentPaid);
  const markPaymentCancelled = usePaymentsStore((state) => state.markPaymentCancelled);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const [markPaidTarget, setMarkPaidTarget] = useState<Payment | null>(null);
  const [amountPaidText, setAmountPaidText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sorted = useMemo(
    () => [...pendingPayments].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [pendingPayments],
  );

  if (!isSuperadmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const openMarkPaid = (payment: Payment) => {
    setMarkPaidTarget(payment);
    // Pre-filled with what's owed, since that's what most payments will
    // actually match — still editable, since amountPaid isn't enforced
    // to equal amountDue (a superadmin can record a partial or
    // over-payment and it's just recorded as-is).
    setAmountPaidText(payment.amountDue.toString());
  };

  const confirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    const amount = Number(amountPaidText);
    if (!amountPaidText.trim() || Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setIsSubmitting(true);
    const success = await markPaymentPaid(markPaidTarget.id, amount);
    setIsSubmitting(false);
    if (!success) {
      toast.error("Couldn't mark this payment as paid. Try again.");
      return;
    }
    toast.success("Payment marked paid.");
    setMarkPaidTarget(null);
    setAmountPaidText("");
  };

  const handleCancel = async (payment: Payment) => {
    const ok = await confirm({
      title: "Cancel this payment?",
      message: `The transaction with reference ${payment.reference} will be marked cancelled.`,
      confirmLabel: "Cancel Payment",
      destructive: true,
    });
    if (!ok) return;
    const success = await markPaymentCancelled(payment.id);
    toast[success ? "success" : "error"](
      success ? "Payment cancelled." : "Couldn't cancel this payment.",
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader title="Payments" subtitle={`${pendingPayments.length} awaiting confirmation`} />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 grow"
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <EmptyState icon="cash-check" message="No payments waiting on confirmation." />
        }
        renderItem={({ item }) => (
          <PaymentCard payment={item} onMarkPaid={openMarkPaid} onCancel={handleCancel} />
        )}
      />

      {/* Mark paid modal */}
      <Modal visible={!!markPaidTarget} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] gap-2.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              Mark payment as paid
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Reference {markPaidTarget?.reference} · {markPaidTarget?.currency}{" "}
              {markPaidTarget ? formatAmount(markPaidTarget.amountDue) : ""} due
            </Text>
            <Text className="text-xs font-semibold mt-1.5" style={{ color: colors.text }}>
              Amount received ({markPaidTarget?.currency})
            </Text>
            <TextInput
              value={amountPaidText}
              onChangeText={setAmountPaidText}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              className="border rounded-[10px] px-3 py-2.5 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
              }}
              autoFocus
            />
            <View className="flex-row gap-2.5 mt-1">
              <Pressable
                onPress={() => setMarkPaidTarget(null)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement, opacity: isSubmitting ? 0.6 : 1 }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmMarkPaid}
                disabled={isSubmitting || !amountPaidText.trim()}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{
                  backgroundColor:
                    amountPaidText.trim() && !isSubmitting ? colors.success : colors.backgroundElement,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: amountPaidText.trim() && !isSubmitting ? "#fff" : colors.textSecondary,
                  }}
                >
                  {isSubmitting ? "Saving..." : "Confirm Paid"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PaymentCard({
  payment,
  onMarkPaid,
  onCancel,
}: {
  payment: Payment;
  onMarkPaid: (p: Payment) => void;
  onCancel: (p: Payment) => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-[14px] border p-3.5 gap-2"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-2.5">
        <View
          className="w-10 h-10 rounded-[10px] items-center justify-center"
          style={{ backgroundColor: colors.warning + "18" }}
        >
          <MaterialCommunityIcons name="cash-clock" size={18} color={colors.warning} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
            {payment.reference}
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
            {payment.initiatorName ?? "Unknown user"} · {format(payment.createdAt)}
          </Text>
        </View>
        <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: colors.warning + "18" }}>
          <Text className="text-[10px] font-bold" style={{ color: colors.warning }}>
            Pending
          </Text>
        </View>
      </View>

      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
        {payment.currency} {formatAmount(payment.amountDue)} due
      </Text>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onMarkPaid(payment)}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
          style={{ backgroundColor: colors.success + "18" }}
        >
          <MaterialCommunityIcons name="check" size={14} color={colors.success} />
          <Text className="text-xs font-bold" style={{ color: colors.success }}>
            Mark Paid
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onCancel(payment)}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
          style={{ backgroundColor: colors.error + "18" }}
        >
          <MaterialCommunityIcons name="close" size={14} color={colors.error} />
          <Text className="text-xs font-bold" style={{ color: colors.error }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
