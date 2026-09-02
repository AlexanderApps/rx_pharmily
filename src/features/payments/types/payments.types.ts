export type TransactionStatus = "pending" | "paid" | "cancelled";

export interface Payment {
  id: string;
  // User-facing string the payer quotes when actually sending the mobile
  // money payment outside the app — see generatePaymentReference().
  reference: string;
  status: TransactionStatus;
  amountDue: number;
  // Deliberately not required to equal amountDue — reconciliation is the
  // superadmin's judgment call when marking a payment paid, not an
  // enforced constraint. See markPaymentPaid in use-payments-data.ts.
  amountPaid?: number;
  currency: string;
  initiatedBy: string;
  // Only populated by queries that join profiles for display purposes
  // (the superadmin review queue) — not set on a payment the app creates
  // for the current user, since there's no need to look up your own name.
  initiatorName?: string;
  reviewedBy?: string;
  paidAt?: Date;
  createdAt: Date;
}
