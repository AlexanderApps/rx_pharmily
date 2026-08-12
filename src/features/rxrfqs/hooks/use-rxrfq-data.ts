import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  RxRfqCardData,
  RxRfqMarketPlaceData,
  RxRfqsFormData,
  RxRfqStatusType,
  RxRfqResponseFormData,
  RxRfqResponseData,
  RxRfqResponseCardData,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { IncotermOption } from "@/shared/types/shared.types";

const INCOTERM_OPTIONS_LIST: IncotermOption[] = [
  { code: "EXW", label: "EXW — Ex Works" },
  { code: "FOB", label: "FOB — Free On Board" },
  { code: "CIF", label: "CIF — Cost, Insurance & Freight" },
  { code: "DDP", label: "DDP — Delivered Duty Paid" },
  { code: "FCA", label: "FCA — Free Carrier" },
];

function generateRfqCode(id: string) {
  return `RFQ-${id.toString().padStart(4, "0")}`;
}

function mapVisibilityRuleRow(row: any) {
  return {
    id: row.id,
    ruleType: row.rule_type,
    region: row.region ?? undefined,
    facilityType: row.facility_type ?? undefined,
    facility: row.facility_id ?? undefined,
  };
}

function mapItemRow(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: Number(row.quantity),
    uom: row.uom,
    allowAlternatives: row.allow_alternatives,
    comment: row.comment ?? undefined,
  };
}

function mapRfqRow(row: any): RxRfqMarketPlaceData {
  return {
    id: row.id,
    code: row.code,
    facilityId: row.facility_id,
    description: row.description,
    categories: row.categories ?? [],
    termsOfService: row.terms_of_service,
    incoterms: row.incoterms,
    currency: row.currency,
    submissionDeadline: new Date(row.submission_deadline),
    minShelfLifeMonths: row.min_shelf_life_months,
    strictMinShelfLife: row.strict_min_shelf_life,
    deliveryDate: new Date(row.delivery_date),
    comment: row.comment,
    isActive: row.is_active,
    status: row.status,
    items: (row.rxrfq_items ?? []).map(mapItemRow),
    visibilityScope: row.visibility_scope,
    visibilityRules: (row.rxrfq_visibility_rules ?? []).map(mapVisibilityRuleRow),
    publishedAt: row.published_at ? new Date(row.published_at) : new Date(row.created_at),
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    productCount: row.product_count,
    responseCount: row.response_count,
    awardedVendorId: row.awarded_vendor_id ?? undefined,
    awardDate: row.award_date ? new Date(row.award_date) : undefined,
    justificationNotes: row.justification_notes ?? undefined,
  };
}

function mapResponseItemRow(row: any) {
  return {
    id: row.id,
    rfqItemId: row.rfq_item_id,
    productId: row.product_id,
    quantity: Number(row.quantity),
    rate: Number(row.rate),
    amount: Number(row.amount),
    offeredAlternative: row.offered_alternative,
    alternativeProductDetails: row.alternative_product_details ?? undefined,
    comment: row.comment ?? undefined,
  };
}

function mapAdditionalCostRow(row: any) {
  return {
    id: row.id,
    costType: row.cost_type,
    description: row.description,
    amount: Number(row.amount),
    isRequired: row.is_required,
  };
}

function mapResponseRow(row: any, vendorFacilityName: string): RxRfqResponseData {
  return {
    id: row.id,
    rfqId: row.rxrfq_id,
    vendorFacility: vendorFacilityName,
    status: row.status,
    quoteValidUntil: new Date(row.quote_valid_until),
    estimatedDeliveryDate: new Date(row.estimated_delivery_date),
    incoterms: row.incoterms,
    currency: row.currency,
    paymentTerms: row.payment_terms,
    vendorComment: row.vendor_comment ?? undefined,
    items: (row.rxrfq_response_items ?? []).map(mapResponseItemRow),
    additionalCosts: (row.rxrfq_additional_costs ?? []).map(mapAdditionalCostRow),
    createdAt: new Date(row.created_at),
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
    createdBy: row.created_by,
    totalItemsAmount: Number(row.total_items_amount),
    totalRequiredCosts: Number(row.total_required_costs),
    totalOptionalCosts: Number(row.total_optional_costs),
    grandTotal: Number(row.grand_total),
  };
}

type RxRfqsStore = {
  rxrfqs: RxRfqCardData[];
  rxrfqMarketPlace: RxRfqMarketPlaceData[];
  rxrfqResponses: RxRfqResponseData[];
  incotermOptions: IncotermOption[];
  isLoading: boolean;

  fetchRxRfqs: () => Promise<void>;
  fetchRxRfq: (id: string) => Promise<void>;
  fetchResponsesForRfq: (rfqId: string) => Promise<void>;
  fetchResponse: (id: string) => Promise<void>;

  addRxRfq: (data: RxRfqsFormData) => Promise<string | undefined>;
  updateRxRfq: (id: string, data: Partial<RxRfqsFormData>) => Promise<boolean>;
  updateRxRfqStatus: (id: string, status: RxRfqStatusType) => Promise<void>;
  extendRxRfqDeadline: (id: string, newDeadline: Date) => Promise<void>;
  addRxRfqResponse: (data: RxRfqResponseFormData) => Promise<string | undefined>;
  awardRxRfqResponse: (rfqId: string, responseId: string) => Promise<boolean>;

  getResponsesForRfq: (rfqId: string) => RxRfqResponseData[];
};

// Shared select string — every RFQ fetch needs its items + visibility
// rules embedded, so this is defined once rather than repeated per query.
const RFQ_SELECT = "*, rxrfq_items(*), rxrfq_visibility_rules(*)";
const RESPONSE_SELECT = "*, rxrfq_response_items(*), rxrfq_additional_costs(*)";

// facilities is deliberately not stored here — it used to be, fetched
// independently on a one-time timer in the root layout, which is exactly
// why a facility created after that fetch (e.g. via the creation-request
// flow) would show as "Unknown facility" on any RFQ referencing it. This
// always reads useProfileStore's live copy instead, so it can never go
// stale independently of the facility actually existing.
function toCardData(rfq: RxRfqMarketPlaceData): RxRfqCardData {
  const facilities = useProfileStore.getState().facilities;
  const facility = facilities.find((f) => f.id === rfq.facilityId);
  return {
    id: rfq.id,
    code: rfq.code,
    facilityName: facility?.name ?? "Unknown facility",
    facilityLocation: facility?.location ?? "-",
    status: rfq.status,
    publishedAt: rfq.publishedAt,
    submissionDeadline: rfq.submissionDeadline,
    productCount: rfq.productCount,
    responseCount: rfq.responseCount,
  };
}

// Responses don't carry their own human-readable code (only RFQs do) — this
// derives a short reference from the id for display contexts that want one.
export function convertResponseDataToCardData(response: RxRfqResponseData): RxRfqResponseCardData {
  return {
    id: response.id,
    rxRfqRequestId: response.rfqId,
    code: `RESP-${response.id.slice(0, 8).toUpperCase()}`,
    vendorFacility: response.vendorFacility,
    estimatedDeliveryDate: response.estimatedDeliveryDate,
    submittedAt: response.submittedAt,
    totalItemsAmount: response.totalItemsAmount,
    totalRequiredCosts: response.totalRequiredCosts,
    totalOptionalCosts: response.totalOptionalCosts,
    grandTotal: response.grandTotal,
  };
}

export const useRxRfqsStore = create<RxRfqsStore>((set, get) => ({
  rxrfqs: [],
  rxrfqMarketPlace: [],
  rxrfqResponses: [],
  incotermOptions: INCOTERM_OPTIONS_LIST,
  isLoading: false,

  fetchRxRfqs: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("rxrfqs")
      .select(RFQ_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[rxrfq] fetchRxRfqs failed:", error.message);
      set({ isLoading: false });
      return;
    }
    const rxrfqMarketPlace = (data ?? []).map(mapRfqRow);
    set({
      rxrfqMarketPlace,
      rxrfqs: rxrfqMarketPlace.map((r) => toCardData(r)),
      isLoading: false,
    });
  },

  fetchRxRfq: async (id) => {
    const { data, error } = await supabase.from("rxrfqs").select(RFQ_SELECT).eq("id", id).single();
    if (error || !data) {
      console.warn("[rxrfq] fetchRxRfq failed:", error?.message);
      return;
    }
    const rfq = mapRfqRow(data);
    set((state) => {
      const rxrfqMarketPlace = [rfq, ...state.rxrfqMarketPlace.filter((r) => r.id !== id)];
      return { rxrfqMarketPlace, rxrfqs: rxrfqMarketPlace.map((r) => toCardData(r)) };
    });
  },

  fetchResponsesForRfq: async (rfqId) => {
    const { data, error } = await supabase
      .from("rxrfq_responses")
      .select(`${RESPONSE_SELECT}, facilities:vendor_facility_id(name)`)
      .eq("rxrfq_id", rfqId);
    if (error) {
      console.warn("[rxrfq] fetchResponsesForRfq failed:", error.message);
      return;
    }
    const responses = (data ?? []).map((row: any) => mapResponseRow(row, row.facilities?.name ?? "Unknown facility"));
    set((state) => ({
      rxrfqResponses: [...state.rxrfqResponses.filter((r) => r.rfqId !== rfqId), ...responses],
    }));
  },

  fetchResponse: async (id) => {
    const { data, error } = await supabase
      .from("rxrfq_responses")
      .select(`${RESPONSE_SELECT}, facilities:vendor_facility_id(name)`)
      .eq("id", id)
      .single();
    if (error || !data) {
      console.warn("[rxrfq] fetchResponse failed:", error?.message);
      return;
    }
    const response = mapResponseRow(data, (data as any).facilities?.name ?? "Unknown facility");
    set((state) => ({
      rxrfqResponses: [response, ...state.rxrfqResponses.filter((r) => r.id !== id)],
    }));
  },

  addRxRfq: async (data) => {
    const userId = await requireUserId();
    const { items, visibilityRules, ...rest } = data;

    const { data: row, error } = await supabase
      .from("rxrfqs")
      .insert({
        code: generateRfqCode(Date.now().toString()),
        facility_id: rest.facilityId,
        description: rest.description,
        categories: rest.categories,
        terms_of_service: rest.termsOfService,
        incoterms: rest.incoterms,
        currency: rest.currency,
        submission_deadline: rest.submissionDeadline.toISOString(),
        min_shelf_life_months: rest.minShelfLifeMonths,
        strict_min_shelf_life: rest.strictMinShelfLife,
        delivery_date: rest.deliveryDate.toISOString(),
        comment: rest.comment,
        is_active: rest.isActive,
        status: rest.status,
        visibility_scope: rest.visibilityScope,
        published_at: rest.status === "published" ? new Date().toISOString() : null,
        created_by: userId,
        product_count: items.length,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[rxrfq] addRxRfq failed:", error?.message);
      return undefined;
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("rxrfq_items").insert(
        items.map((item) => ({
          rxrfq_id: row.id,
          product_id: item.productId,
          quantity: item.quantity,
          uom: item.uom,
          allow_alternatives: item.allowAlternatives,
          comment: item.comment ?? null,
        })),
      );
      if (itemsError) console.warn("[rxrfq] addRxRfq (items) failed:", itemsError.message);
    }

    if (visibilityRules.length > 0) {
      const { error: rulesError } = await supabase.from("rxrfq_visibility_rules").insert(
        visibilityRules.map((rule) => ({
          rxrfq_id: row.id,
          rule_type: rule.ruleType,
          region: rule.region ?? null,
          facility_type: rule.facilityType ?? null,
          facility_id: rule.facility ?? null,
        })),
      );
      if (rulesError) console.warn("[rxrfq] addRxRfq (visibility rules) failed:", rulesError.message);
    }

    await get().fetchRxRfq(row.id);

    if (row.status === "published") {
      const newRfq = get().rxrfqMarketPlace.find((r) => r.id === row.id);
      useNotificationStore.getState().addNotification(
        "rxrfq_new_entry",
        "New RxRFQ posted",
        `${row.code} — ${row.description || "a new request for quote"} was posted.`,
        { pathname: "/rfqs/rxrfq-market-details", params: { id: row.id } },
      );
    }

    return row.id;
  },

  updateRxRfq: async (id, data) => {
    const patch: Record<string, any> = {};
    if (data.facilityId !== undefined) patch.facility_id = data.facilityId;
    if (data.description !== undefined) patch.description = data.description;
    if (data.categories !== undefined) patch.categories = data.categories;
    if (data.termsOfService !== undefined) patch.terms_of_service = data.termsOfService;
    if (data.incoterms !== undefined) patch.incoterms = data.incoterms;
    if (data.currency !== undefined) patch.currency = data.currency;
    if (data.submissionDeadline !== undefined) patch.submission_deadline = data.submissionDeadline.toISOString();
    if (data.minShelfLifeMonths !== undefined) patch.min_shelf_life_months = data.minShelfLifeMonths;
    if (data.strictMinShelfLife !== undefined) patch.strict_min_shelf_life = data.strictMinShelfLife;
    if (data.deliveryDate !== undefined) patch.delivery_date = data.deliveryDate.toISOString();
    if (data.comment !== undefined) patch.comment = data.comment;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.status !== undefined) patch.status = data.status;
    if (data.visibilityScope !== undefined) patch.visibility_scope = data.visibilityScope;
    if (data.items !== undefined) patch.product_count = data.items.length;

    const { error } = await supabase.from("rxrfqs").update(patch).eq("id", id);
    if (error) {
      console.warn("[rxrfq] updateRxRfq failed:", error.message);
      return false;
    }

    if (data.items) {
      await supabase.from("rxrfq_items").delete().eq("rxrfq_id", id);
      if (data.items.length > 0) {
        await supabase.from("rxrfq_items").insert(
          data.items.map((item) => ({
            rxrfq_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            uom: item.uom,
            allow_alternatives: item.allowAlternatives,
            comment: item.comment ?? null,
          })),
        );
      }
    }
    if (data.visibilityRules) {
      await supabase.from("rxrfq_visibility_rules").delete().eq("rxrfq_id", id);
      if (data.visibilityRules.length > 0) {
        await supabase.from("rxrfq_visibility_rules").insert(
          data.visibilityRules.map((rule) => ({
            rxrfq_id: id,
            rule_type: rule.ruleType,
            region: rule.region ?? null,
            facility_type: rule.facilityType ?? null,
            facility_id: rule.facility ?? null,
          })),
        );
      }
    }

    await get().fetchRxRfq(id);
    return true;
  },

  updateRxRfqStatus: async (id, status) => {
    const existing = get().rxrfqMarketPlace.find((r) => r.id === id);
    const patch: Record<string, any> = { status };
    if (status === "published" && existing && !existing.publishedAt) {
      patch.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from("rxrfqs").update(patch).eq("id", id);
    if (error) {
      console.warn("[rxrfq] updateRxRfqStatus failed:", error.message);
      return;
    }
    await get().fetchRxRfq(id);
  },

  extendRxRfqDeadline: async (id, newDeadline) => {
    const existing = get().rxrfqMarketPlace.find((r) => r.id === id);
    const patch: Record<string, any> = { submission_deadline: newDeadline.toISOString() };
    if (existing?.status === "expired") patch.status = "published";
    const { error } = await supabase.from("rxrfqs").update(patch).eq("id", id);
    if (error) {
      console.warn("[rxrfq] extendRxRfqDeadline failed:", error.message);
      return;
    }
    await get().fetchRxRfq(id);
  },

  addRxRfqResponse: async (data) => {
    const userId = await requireUserId();
    const totalItemsAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
    const totalRequiredCosts = data.additionalCosts.filter((c) => c.isRequired).reduce((sum, c) => sum + c.amount, 0);
    const totalOptionalCosts = data.additionalCosts.filter((c) => !c.isRequired).reduce((sum, c) => sum + c.amount, 0);
    const grandTotal = totalItemsAmount + totalRequiredCosts + totalOptionalCosts;

    const { data: row, error } = await supabase
      .from("rxrfq_responses")
      .insert({
        rxrfq_id: data.rfqId,
        vendor_facility_id: data.vendorFacility, // a real facility id now, from MyFacilityPicker
        status: data.status,
        quote_valid_until: data.quoteValidUntil.toISOString(),
        estimated_delivery_date: data.estimatedDeliveryDate.toISOString(),
        incoterms: data.incoterms,
        currency: data.currency,
        payment_terms: data.paymentTerms,
        vendor_comment: data.vendorComment ?? null,
        created_by: userId,
        submitted_at: new Date().toISOString(),
        total_items_amount: totalItemsAmount,
        total_required_costs: totalRequiredCosts,
        total_optional_costs: totalOptionalCosts,
        grand_total: grandTotal,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[rxrfq] addRxRfqResponse failed:", error?.message);
      return undefined;
    }

    if (data.items.length > 0) {
      await supabase.from("rxrfq_response_items").insert(
        data.items.map((item) => ({
          response_id: row.id,
          rfq_item_id: item.rfqItemId,
          product_id: item.productId,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          offered_alternative: item.offeredAlternative,
          alternative_product_details: item.alternativeProductDetails ?? null,
          comment: item.comment ?? null,
        })),
      );
    }
    if (data.additionalCosts.length > 0) {
      await supabase.from("rxrfq_additional_costs").insert(
        data.additionalCosts.map((cost) => ({
          response_id: row.id,
          cost_type: cost.costType,
          description: cost.description,
          amount: cost.amount,
          is_required: cost.isRequired,
        })),
      );
    }

    await supabase
      .from("rxrfqs")
      .update({ response_count: (get().rxrfqMarketPlace.find((r) => r.id === data.rfqId)?.responseCount ?? 0) + 1 })
      .eq("id", data.rfqId);

    await get().fetchRxRfq(data.rfqId);
    await get().fetchResponsesForRfq(data.rfqId);

    const targetRfq = get().rxrfqMarketPlace.find((rfq) => rfq.id === data.rfqId);
    if (targetRfq && targetRfq.createdBy === userId) {
      const vendorFacility = useProfileStore.getState().facilities.find((f) => f.id === data.vendorFacility);
      useNotificationStore.getState().addNotification(
        "rxrfq_response_received",
        "New response on your RxRFQ",
        `${vendorFacility?.name ?? "A vendor"} responded to ${targetRfq.code}.`,
        { pathname: "/rfqs/rxrfq-details-screen", params: { id: targetRfq.id } },
      );
    }

    return row.id;
  },

  awardRxRfqResponse: async (rfqId, responseId) => {
    const { error } = await supabase
      .from("rxrfqs")
      .update({ status: "awarded", awarded_vendor_id: responseId, award_date: new Date().toISOString() })
      .eq("id", rfqId);
    if (error) {
      console.warn("[rxrfq] awardRxRfqResponse failed:", error.message);
      return false;
    }

    await get().fetchRxRfq(rfqId);

    const currentUserId = useProfileStore.getState().user.id;
    const awardedResponse = get().rxrfqResponses.find((r) => r.id === responseId);
    const awardedRfq = get().rxrfqMarketPlace.find((rfq) => rfq.id === rfqId);
    if (awardedResponse && awardedResponse.createdBy === currentUserId && awardedRfq) {
      useNotificationStore.getState().addNotification(
        "rxrfq_award_decision",
        "Your quote was awarded",
        `Your response to ${awardedRfq.code} was awarded.`,
        { pathname: "/rfqs/response-details", params: { id: awardedResponse.id } },
      );
    }
    return true;
  },

  getResponsesForRfq: (rfqId) => get().rxrfqResponses.filter((r) => r.rfqId === rfqId),
}));
