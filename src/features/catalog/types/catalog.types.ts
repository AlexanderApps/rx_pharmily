// Canonical product catalog. Every feature that previously stored a raw
// product name string (RxRFQ items, MediScope requests, price template
// rows, donation items) should reference a product by id here instead —
// this is what makes those relationships real foreign keys rather than
// free text, and is what a relational backend (Frappe or Supabase, either
// way) will expect the frontend to already be modeling.
export interface Product {
  id: string;
  name: string;
  category?: string;
  defaultUnit?: string;
  // ATC (Anatomical Therapeutic Chemical) classification code(s) — a
  // product can have more than one, separated by "/". Free text rather
  // than a strict format, since coverage/conventions vary.
  atcCode?: string;
  description?: string;
  // Audit trail — who touched this row and when, for a catalog that
  // multiple admins/superadmins can edit.
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  // Soft delete — set by an admin removing a product from normal view.
  // A superadmin can still permanently delete on top of this; regular
  // admin removal never does.
  deletedAt?: Date;
  deletedBy?: string;
  // The formulary request (if any) this product was merged in from —
  // nullable, since a superadmin/admin can also add a product directly
  // without a request behind it.
  sourceFormularyRequestId?: string;
}

// pending -> approved -> merged is the normal path (an admin/superadmin
// reviews, then separately does the cleanup-and-merge step); pending ->
// rejected is the other. "approved" is deliberately NOT the same as being
// in the catalog — nothing is added to products until the merge step,
// which is a distinct admin action with an editable copy of the data,
// not an automatic side effect of approval.
export type FormularyRequestStatus = "pending" | "approved" | "rejected" | "merged";

export interface FormularyRequest {
  id: string;
  productName: string;
  category?: string;
  defaultUnit?: string;
  notes?: string;
  imageUri?: string;
  status: FormularyRequestStatus;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  createdBy: string;
  // Set once merged, pointing at the Product that was actually created.
  resultingProductId?: string;
  mergedAt?: Date;
  mergedBy?: string;
}

export interface FormularyRequestFormData {
  productName: string;
  category?: string;
  defaultUnit?: string;
  notes?: string;
  imageUri?: string;
}

// What an admin submits when actually merging an approved request into
// the catalog — the "editable copy, cleaned up" step. Deliberately a
// separate shape from Product/FormularyRequest: it's neither the raw
// request as the user typed it nor a full product row, just what the
// admin is expected to fill in or correct at merge time.
export interface FormularyMergeFormData {
  name: string;
  category?: string;
  defaultUnit?: string;
  atcCode?: string;
  description?: string;
}
