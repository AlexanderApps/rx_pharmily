import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { Payment } from "@/features/payments/types/payments.types";

function mapPaymentRow(row: any): Payment {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    amountDue: Number(row.amount_due),
    amountPaid: row.amount_paid != null ? Number(row.amount_paid) : undefined,
    currency: row.currency,
    initiatedBy: row.initiated_by,
    initiatorName: row.profiles?.full_name ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

// A two-letter feature prefix (AD for ads, and so on as more paid actions
// get added) plus the current timestamp — short enough for someone to
// read aloud or type into a mobile money prompt, and unique enough in
// practice that a same-millisecond collision is effectively impossible
// (the database's own unique constraint on payments.reference is the
// real backstop regardless).
export function generatePaymentReference(prefix: string): string {
  return `${prefix.toUpperCase()}${Date.now()}`;
}

type PaymentsStore = {
  // Only ever populated with the pending queue — this store isn't a
  // general-purpose payments cache, just enough state to drive the
  // superadmin review screen.
  pendingPayments: Payment[];
  isLoading: boolean;

  fetchPendingPayments: () => Promise<void>;
  // Used by any feature's own submit action (ads today) to create the
  // payments row before creating the record that depends on it. Returns
  // undefined on failure so the caller can bail out before creating a
  // dependent record with no valid payment_id to point at.
  createPayment: (
    referencePrefix: string,
    amountDue: number,
    currency: string,
  ) => Promise<Payment | undefined>;
  markPaymentPaid: (id: string, amountPaid: number) => Promise<boolean>;
  markPaymentCancelled: (id: string) => Promise<boolean>;
};

export const usePaymentsStore = create<PaymentsStore>((set, get) => ({
  pendingPayments: [],
  isLoading: false,

  fetchPendingPayments: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("payments")
      .select("*, profiles:initiated_by(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[payments] fetchPendingPayments failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ pendingPayments: (data ?? []).map(mapPaymentRow), isLoading: false });
  },

  createPayment: async (referencePrefix, amountDue, currency) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("payments")
      .insert({
        reference: generatePaymentReference(referencePrefix),
        amount_due: amountDue,
        currency,
        initiated_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[payments] createPayment failed:", error?.message);
      return undefined;
    }
    return mapPaymentRow(row);
  },

  markPaymentPaid: async (id, amountPaid) => {
    // The database's RLS update policy is the real enforcement (see
    // 20260822000000_payments_table.sql) — this check exists to fail
    // fast with a clear message rather than let a non-superadmin hit a
    // raw policy-violation error from Supabase.
    const reviewerId = await requireUserId();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("payments")
      .update({ status: "paid", amount_paid: amountPaid, reviewed_by: reviewerId, paid_at: now })
      .eq("id", id);
    if (error) {
      console.warn("[payments] markPaymentPaid failed:", error.message);
      return false;
    }
    set({ pendingPayments: get().pendingPayments.filter((p) => p.id !== id) });
    return true;
  },

  markPaymentCancelled: async (id) => {
    const reviewerId = await requireUserId();
    const { error } = await supabase
      .from("payments")
      .update({ status: "cancelled", reviewed_by: reviewerId })
      .eq("id", id);
    if (error) {
      console.warn("[payments] markPaymentCancelled failed:", error.message);
      return false;
    }
    set({ pendingPayments: get().pendingPayments.filter((p) => p.id !== id) });
    return true;
  },
}));
