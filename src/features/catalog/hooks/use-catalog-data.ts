import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  FormularyMergeFormData,
  FormularyRequest,
  FormularyRequestFormData,
  Product,
} from "@/features/catalog/types/catalog.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";

// Row <-> app-type mapping. Supabase/Postgres columns are snake_case; the
// app's existing types (unchanged, so every consuming screen keeps
// working) are camelCase.
function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    defaultUnit: row.default_unit ?? undefined,
    atcCode: row.atc_code ?? undefined,
    description: row.description ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedBy: row.updated_by ?? undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    deletedBy: row.deleted_by ?? undefined,
    sourceFormularyRequestId: row.source_formulary_request_id ?? undefined,
  };
}

function mapFormularyRequestRow(row: any): FormularyRequest {
  return {
    id: row.id,
    productName: row.product_name,
    category: row.category ?? undefined,
    defaultUnit: row.default_unit ?? undefined,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    status: row.status,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    resultingProductId: row.resulting_product_id ?? undefined,
    mergedAt: row.merged_at ? new Date(row.merged_at) : undefined,
    mergedBy: row.merged_by ?? undefined,
  };
}

type CatalogStore = {
  products: Product[];
  formularyRequests: FormularyRequest[];
  isLoadingProducts: boolean;
  isLoadingFormularyRequests: boolean;

  // includeDeleted is for the admin/superadmin product management screen,
  // which needs to be able to see (and restore, or superadmin-permanently-
  // delete) soft-deleted products — everywhere else in the app should
  // never see them, which is also what the database's own RLS enforces
  // independently of whatever this fetch asks for.
  fetchProducts: (includeDeleted?: boolean) => Promise<void>;
  fetchFormularyRequests: () => Promise<void>;

  getProduct: (id: string) => Product | undefined;
  searchProducts: (query: string) => Product[];

  // Admin/superadmin actions.
  addProduct: (data: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, data: Omit<Product, "id">) => Promise<void>;
  // Soft delete — available to admin and superadmin. This is what
  // "Delete" in the product management UI should call.
  softDeleteProduct: (id: string) => Promise<void>;
  restoreProduct: (id: string) => Promise<void>;
  // Permanent delete — superadmin only, enforced by RLS regardless of
  // what calls this; a non-superadmin calling it just gets an RLS error.
  hardDeleteProduct: (id: string) => Promise<void>;
  // Folds a duplicate product into a canonical one. This soft-deletes the
  // duplicate rather than hard-deleting it, same reasoning as everywhere
  // else: an admin's "remove" is reversible, only a superadmin's isn't.
  // Doesn't reach into other tables to re-point existing product_id
  // foreign keys from duplicateId to canonicalId — do that separately
  // (e.g. a Postgres function) if you need it.
  mergeProducts: (duplicateId: string, canonicalId: string) => Promise<void>;

  // User-facing: request a medication be added to the formulary. Nothing
  // is added to the catalog until an admin/superadmin reviews it, and
  // even approval doesn't add it — see mergeFormularyRequest.
  submitFormularyRequest: (data: FormularyRequestFormData) => Promise<boolean>;
  // Approve/reject are the review step, both with an optional/required
  // comment. Approving does NOT touch the products table — it only
  // marks the request ready for the separate merge step below.
  approveFormularyRequest: (id: string, comment?: string) => Promise<void>;
  rejectFormularyRequest: (id: string, comment: string) => Promise<void>;
  // The actual "add to catalog" step, done from an editable copy of the
  // request's data (name casing fixed, ATC code and description added,
  // etc.) — this is what actually creates the Product row and marks the
  // request merged. Only callable on an already-approved request.
  mergeFormularyRequest: (id: string, data: FormularyMergeFormData) => Promise<void>;
};

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  products: [],
  formularyRequests: [],
  isLoadingProducts: false,
  isLoadingFormularyRequests: false,

  fetchProducts: async (includeDeleted = false) => {
    set({ isLoadingProducts: true });
    let query = supabase.from("products").select("*").order("name");
    if (!includeDeleted) query = query.is("deleted_at", null);
    const { data, error } = await query;
    if (error) {
      console.warn("[catalog] fetchProducts failed:", error.message);
      set({ isLoadingProducts: false });
      return;
    }
    set({ products: (data ?? []).map(mapProductRow), isLoadingProducts: false });
  },

  fetchFormularyRequests: async () => {
    set({ isLoadingFormularyRequests: true });
    const { data, error } = await supabase
      .from("formulary_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[catalog] fetchFormularyRequests failed:", error.message);
      set({ isLoadingFormularyRequests: false });
      return;
    }
    set({
      formularyRequests: (data ?? []).map(mapFormularyRequestRow),
      isLoadingFormularyRequests: false,
    });
  },

  getProduct: (id) => get().products.find((p) => p.id === id),

  searchProducts: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return get().products;
    return get().products.filter((p) => p.name.toLowerCase().includes(q));
  },

  addProduct: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("products")
      .insert({
        name: data.name,
        category: data.category,
        default_unit: data.defaultUnit,
        atc_code: data.atcCode || null,
        description: data.description || null,
        created_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[catalog] addProduct failed:", error?.message);
      return;
    }
    set((state) => ({ products: [...state.products, mapProductRow(row)] }));
  },

  updateProduct: async (id, data) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("products")
      .update({
        name: data.name,
        category: data.category,
        default_unit: data.defaultUnit,
        atc_code: data.atcCode || null,
        description: data.description || null,
        updated_by: userId,
        // updated_at is set automatically by the touch_updated_at trigger.
      })
      .eq("id", id);
    if (error) {
      console.warn("[catalog] updateProduct failed:", error.message);
      return;
    }
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...data, updatedBy: userId } : p)),
    }));
  },

  softDeleteProduct: async (id) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq("id", id);
    if (error) {
      console.warn("[catalog] softDeleteProduct failed:", error.message);
      return;
    }
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  restoreProduct: async (id) => {
    const { error } = await supabase.from("products").update({ deleted_at: null, deleted_by: null }).eq("id", id);
    if (error) {
      console.warn("[catalog] restoreProduct failed:", error.message);
      return;
    }
    await get().fetchProducts(true);
  },

  hardDeleteProduct: async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      // Expected to fail with an RLS error for anyone who isn't a
      // superadmin — that's the database enforcing the rule, not a bug.
      console.warn("[catalog] hardDeleteProduct failed:", error.message);
      return;
    }
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  mergeProducts: async (duplicateId, canonicalId) => {
    if (duplicateId === canonicalId) return;
    await get().softDeleteProduct(duplicateId);
  },

  submitFormularyRequest: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("formulary_requests")
      .insert({
        product_name: data.productName.trim(),
        category: data.category?.trim() || null,
        default_unit: data.defaultUnit?.trim() || null,
        notes: data.notes?.trim() || null,
        image_uri: data.imageUri ?? null,
        status: "pending",
        created_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[catalog] submitFormularyRequest failed:", error?.message);
      return false;
    }
    set((state) => ({ formularyRequests: [mapFormularyRequestRow(row), ...state.formularyRequests] }));
    return true;
  },

  approveFormularyRequest: async (id, comment) => {
    const request = get().formularyRequests.find((r) => r.id === id);
    if (!request) return;
    const reviewerId = await requireUserId();

    const { error } = await supabase
      .from("formulary_requests")
      .update({
        status: "approved",
        review_comment: comment?.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[catalog] approveFormularyRequest failed:", error.message);
      return;
    }

    set((state) => ({
      formularyRequests: state.formularyRequests.map((r) =>
        r.id === id
          ? { ...r, status: "approved" as const, reviewComment: comment?.trim() || undefined, reviewedBy: reviewerId, reviewedAt: new Date() }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "formulary_request_decision",
      "Formulary request approved",
      `"${request.productName}" was approved and is awaiting catalog cleanup.${comment ? ` ${comment}` : ""}`,
      { pathname: "/formulary" },
    );
  },

  rejectFormularyRequest: async (id, comment) => {
    const request = get().formularyRequests.find((r) => r.id === id);
    if (!request) return;
    const reviewerId = await requireUserId();

    const { error } = await supabase
      .from("formulary_requests")
      .update({
        status: "rejected",
        review_comment: comment.trim(),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[catalog] rejectFormularyRequest failed:", error.message);
      return;
    }

    set((state) => ({
      formularyRequests: state.formularyRequests.map((r) =>
        r.id === id
          ? { ...r, status: "rejected" as const, reviewComment: comment.trim(), reviewedBy: reviewerId, reviewedAt: new Date() }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "formulary_request_decision",
      "Formulary request declined",
      `"${request.productName}" was not added: ${comment.trim()}`,
      { pathname: "/formulary" },
    );
  },

  mergeFormularyRequest: async (id, data) => {
    const request = get().formularyRequests.find((r) => r.id === id);
    if (!request || request.status !== "approved") return;
    const userId = await requireUserId();

    const { data: productRow, error: productError } = await supabase
      .from("products")
      .insert({
        name: data.name.trim(),
        category: data.category?.trim() || null,
        default_unit: data.defaultUnit?.trim() || null,
        atc_code: data.atcCode?.trim() || null,
        description: data.description?.trim() || null,
        created_by: userId,
        source_formulary_request_id: id,
      })
      .select()
      .single();
    if (productError || !productRow) {
      console.warn("[catalog] mergeFormularyRequest (product insert) failed:", productError?.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("formulary_requests")
      .update({
        status: "merged",
        merged_at: new Date().toISOString(),
        merged_by: userId,
        resulting_product_id: productRow.id,
      })
      .eq("id", id);
    if (updateError) {
      console.warn("[catalog] mergeFormularyRequest (request update) failed:", updateError.message);
      return;
    }

    const product = mapProductRow(productRow);
    set((state) => ({
      products: [...state.products, product],
      formularyRequests: state.formularyRequests.map((r) =>
        r.id === id
          ? { ...r, status: "merged" as const, mergedAt: new Date(), mergedBy: userId, resultingProductId: product.id }
          : r,
      ),
    }));

    if (request.createdBy !== userId) {
      useNotificationStore.getState().addNotification(
        "formulary_request_decision",
        "Formulary request added to the catalog",
        `"${data.name.trim()}" is now available in the product catalog.`,
        { pathname: "/formulary" },
      );
    }
  },
}));
