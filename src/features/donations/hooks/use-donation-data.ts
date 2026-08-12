import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  Donation,
  DonationCardData,
  DonationFormData,
  DonationItem,
  DonationResponse,
  DonationResponseFormData,
  DonationStatus,
} from "@/features/donations/types/donation.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

function mapItemRow(row: any): DonationItem {
  return {
    id: row.id,
    product: row.product,
    quantity: Number(row.quantity),
    batch: row.batch ?? undefined,
    expiryDate: new Date(row.expiry_date),
    status: row.status,
    isActive: row.is_active,
    isCustomProduct: row.is_custom_product,
  };
}

// facilityName/facilityLocation are resolved live from the shared
// facilities table (via useProfileStore) rather than stored on the
// donation row itself — a facility created or renamed after this donation
// was posted still resolves correctly, instead of freezing whatever name
// existed at post time (the exact bug class fixed in RxRFQ this session).
function mapDonationRow(row: any): Donation {
  const facility = useProfileStore.getState().facilities.find((f) => f.id === row.facility_id);
  return {
    id: row.id,
    code: row.code,
    facility: row.facility_id,
    facilityName: facility?.name ?? "Unknown facility",
    facilityLocation: facility?.location ?? "-",
    categories: row.categories ?? [],
    termsOfService: row.terms_of_service,
    comment: row.comment,
    isActive: row.is_active,
    status: row.status,
    donatedItems: (row.donation_items ?? []).map(mapItemRow),
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    responseCount: row.response_count,
  };
}

function mapResponseItemRow(row: any) {
  return {
    id: row.id,
    donationItemId: row.donation_item_id,
    product: row.product,
    requestedQuantity: Number(row.requested_quantity),
  };
}

function mapResponseRow(row: any, responderFacilityName: string): DonationResponse {
  return {
    id: row.id,
    donationId: row.donation_id,
    responderFacility: responderFacilityName,
    items: (row.donation_response_items ?? []).map(mapResponseItemRow),
    comment: row.comment ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
  };
}

const DONATION_SELECT = "*, donation_items(*)";
const RESPONSE_SELECT = "*, donation_response_items(*)";

// Pure mapper, no store/network access needed — Donation already carries
// facilityName/location resolved at fetch time.
export function convertToCardData(donation: Donation): DonationCardData {
  return {
    id: donation.id,
    facilityName: donation.facilityName,
    location: donation.facilityLocation,
    createdAt: donation.createdAt,
    itemCount: donation.donatedItems.length,
    status: donation.status,
    isActive: donation.isActive,
    responseCount: donation.responseCount,
    isOwner: donation.createdBy === useProfileStore.getState().user.id,
  };
}

type DonationStore = {
  donations: Donation[];
  responsesByDonation: Record<string, DonationResponse[]>;
  isLoading: boolean;

  fetchDonations: () => Promise<void>;
  fetchDonation: (id: string) => Promise<void>;
  fetchResponses: (donationId: string) => Promise<void>;

  getDonation: (id: string) => Donation | undefined;
  getResponses: (donationId: string) => DonationResponse[];

  addDonation: (data: DonationFormData) => Promise<string | undefined>;
  updateDonation: (id: string, data: DonationFormData) => Promise<boolean>;
  updateDonationStatus: (id: string, status: DonationStatus) => Promise<boolean>;
  deleteDonation: (id: string) => Promise<boolean>;

  addResponse: (data: DonationResponseFormData) => Promise<boolean>;
  approveResponse: (donationId: string, responseId: string) => Promise<boolean>;
  rejectResponse: (donationId: string, responseId: string) => Promise<boolean>;
};

export const useDonationStore = create<DonationStore>((set, get) => ({
  donations: [],
  responsesByDonation: {},
  isLoading: false,

  fetchDonations: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from("donations")
      .select(DONATION_SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[donations] fetchDonations failed:", error.message);
      set({ isLoading: false });
      return;
    }
    set({ donations: (data ?? []).map(mapDonationRow), isLoading: false });
  },

  fetchDonation: async (id) => {
    const { data, error } = await supabase.from("donations").select(DONATION_SELECT).eq("id", id).single();
    if (error || !data) {
      console.warn("[donations] fetchDonation failed:", error?.message);
      return;
    }
    const donation = mapDonationRow(data);
    set((state) => ({ donations: [donation, ...state.donations.filter((d) => d.id !== id)] }));
  },

  fetchResponses: async (donationId) => {
    const { data, error } = await supabase
      .from("donation_responses")
      .select(`${RESPONSE_SELECT}, facilities:responder_facility_id(name)`)
      .eq("donation_id", donationId);
    if (error) {
      console.warn("[donations] fetchResponses failed:", error.message);
      return;
    }
    const responses = (data ?? []).map((row: any) => mapResponseRow(row, row.facilities?.name ?? "Unknown facility"));
    set((state) => ({
      responsesByDonation: { ...state.responsesByDonation, [donationId]: responses },
    }));
  },

  getDonation: (id) => get().donations.find((d) => d.id === id),
  getResponses: (donationId) => get().responsesByDonation[donationId] ?? [],

  addDonation: async (data) => {
    const userId = await requireUserId();
    const { donatedItems, facility, ...rest } = data;

    const { data: row, error } = await supabase
      .from("donations")
      .insert({
        code: `DON-${Date.now().toString().slice(-6)}`,
        facility_id: facility,
        categories: rest.categories,
        terms_of_service: rest.termsOfService,
        comment: rest.comment,
        is_active: rest.isActive,
        status: rest.status,
        created_by: userId,
      })
      .select()
      .single();
    if (error || !row) {
      console.warn("[donations] addDonation failed:", error?.message);
      return undefined;
    }

    if (donatedItems.length > 0) {
      const { error: itemsError } = await supabase.from("donation_items").insert(
        donatedItems.map((item) => ({
          donation_id: row.id,
          product: item.product,
          quantity: item.quantity,
          batch: item.batch ?? null,
          expiry_date: item.expiryDate.toISOString().slice(0, 10),
          status: item.status,
          is_active: item.isActive,
          is_custom_product: item.isCustomProduct,
        })),
      );
      if (itemsError) console.warn("[donations] addDonation (items) failed:", itemsError.message);
    }

    await get().fetchDonation(row.id);

    const donation = get().donations.find((d) => d.id === row.id);
    if (donation) {
      useNotificationStore.getState().addNotification(
        "donation_new_entry",
        "New donation posted",
        `${donation.facilityName} posted a new donation (${donation.code}).`,
        { pathname: "/donations/donation-market-details", params: { id: donation.id } },
      );
    }

    return row.id;
  },

  updateDonation: async (id, data) => {
    const { error } = await supabase
      .from("donations")
      .update({
        facility_id: data.facility,
        categories: data.categories,
        terms_of_service: data.termsOfService,
        comment: data.comment,
        is_active: data.isActive,
        status: data.status,
      })
      .eq("id", id);
    if (error) {
      console.warn("[donations] updateDonation failed:", error.message);
      return false;
    }

    await supabase.from("donation_items").delete().eq("donation_id", id);
    if (data.donatedItems.length > 0) {
      await supabase.from("donation_items").insert(
        data.donatedItems.map((item) => ({
          donation_id: id,
          product: item.product,
          quantity: item.quantity,
          batch: item.batch ?? null,
          expiry_date: item.expiryDate.toISOString().slice(0, 10),
          status: item.status,
          is_active: item.isActive,
          is_custom_product: item.isCustomProduct,
        })),
      );
    }

    await get().fetchDonation(id);
    return true;
  },

  updateDonationStatus: async (id, status) => {
    const { error } = await supabase.from("donations").update({ status }).eq("id", id);
    if (error) {
      console.warn("[donations] updateDonationStatus failed:", error.message);
      return false;
    }
    set((state) => ({ donations: state.donations.map((d) => (d.id === id ? { ...d, status } : d)) }));
    return true;
  },

  deleteDonation: async (id) => {
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) {
      console.warn("[donations] deleteDonation failed:", error.message);
      return false;
    }
    set((state) => {
      const { [id]: _removed, ...rest } = state.responsesByDonation;
      return { donations: state.donations.filter((d) => d.id !== id), responsesByDonation: rest };
    });
    return true;
  },

  addResponse: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("donation_responses")
      .insert({
        donation_id: data.donationId,
        responder_facility_id: data.responderFacility,
        comment: data.comment ?? null,
        created_by: userId,
      })
      .select("*, facilities:responder_facility_id(name)")
      .single();
    if (error || !row) {
      console.warn("[donations] addResponse failed:", error?.message);
      return false;
    }

    if (data.items.length > 0) {
      await supabase.from("donation_response_items").insert(
        data.items.map((item) => ({
          response_id: row.id,
          donation_item_id: item.donationItemId,
          product: item.product,
          requested_quantity: item.requestedQuantity,
        })),
      );
    }

    await supabase
      .from("donations")
      .update({ response_count: (get().donations.find((d) => d.id === data.donationId)?.responseCount ?? 0) + 1 })
      .eq("id", data.donationId);

    await get().fetchDonation(data.donationId);
    await get().fetchResponses(data.donationId);

    const donation = get().donations.find((d) => d.id === data.donationId);
    if (donation && donation.createdBy === userId) {
      const responderName = (row as any).facilities?.name ?? "A facility";
      useNotificationStore.getState().addNotification(
        "donation_claim_received",
        "New claim on your donation",
        `${responderName} claimed items from ${donation.code}.`,
        { pathname: "/donations/donation-details", params: { id: donation.id } },
      );
    }
    return true;
  },

  approveResponse: async (donationId, responseId) => {
    const responses = get().responsesByDonation[donationId] ?? [];
    const response = responses.find((r) => r.id === responseId);
    const donation = get().donations.find((d) => d.id === donationId);
    if (!response || !donation) return false;

    // Deduct claimed quantities from the underlying donated items,
    // deactivating any that hit zero — same business rule as the mock,
    // just written back to the real rows now.
    for (const claimedItem of response.items) {
      const donatedItem = donation.donatedItems.find((i) => i.id === claimedItem.donationItemId);
      if (!donatedItem) continue;
      const remaining = Math.max(0, donatedItem.quantity - claimedItem.requestedQuantity);
      await supabase
        .from("donation_items")
        .update({ quantity: remaining, is_active: remaining > 0 })
        .eq("id", donatedItem.id);
    }

    const { error } = await supabase.from("donation_responses").update({ status: "approved" }).eq("id", responseId);
    if (error) {
      console.warn("[donations] approveResponse failed:", error.message);
      return false;
    }

    await get().fetchDonation(donationId);
    await get().fetchResponses(donationId);

    const currentUserId = useProfileStore.getState().user.id;
    if (response.createdBy === currentUserId) {
      useNotificationStore.getState().addNotification(
        "donation_claim_decision",
        "Your claim was approved",
        `Your claim on ${donation.code} was approved.`,
        { pathname: "/donations/donation-market-details", params: { id: donation.id } },
      );
    }
    return true;
  },

  rejectResponse: async (donationId, responseId) => {
    const responses = get().responsesByDonation[donationId] ?? [];
    const response = responses.find((r) => r.id === responseId);
    const donation = get().donations.find((d) => d.id === donationId);

    const { error } = await supabase.from("donation_responses").update({ status: "rejected" }).eq("id", responseId);
    if (error) {
      console.warn("[donations] rejectResponse failed:", error.message);
      return false;
    }

    await get().fetchResponses(donationId);

    const currentUserId = useProfileStore.getState().user.id;
    if (response && donation && response.createdBy === currentUserId) {
      useNotificationStore.getState().addNotification(
        "donation_claim_decision",
        "Your claim was declined",
        `Your claim on ${donation.code} was declined.`,
        { pathname: "/donations/donation-market-details", params: { id: donation.id } },
      );
    }
    return true;
  },
}));
