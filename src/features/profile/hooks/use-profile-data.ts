import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import {
  CoverLetterTemplate,
  CoverLetterTemplateFormData,
  DEFAULT_ENTITY_VISIBILITY,
  DEFAULT_USER_VISIBILITY,
  FacilityCreationRequest,
  FacilityCreationRequestFormData,
  FacilityMembership,
  FacilityMembershipRequest,
  FacilityOrganizationRequest,
  FacilityProfile,
  FacilityProfileFormData,
  KycDocument,
  KycDocumentType,
  KycEntityType,
  KycRecord,
  OrganizationCreationRequest,
  OrganizationCreationRequestFormData,
  OrganizationProfile,
  OrganizationProfileFormData,
  PriceTemplate,
  PriceTemplateItem,
  PublicProfileVisibility,
  UserProfile,
  UserProfileFormData,
} from "@/features/profile/types/profile.types";
import { useNotificationStore } from "@/features/notifications/hooks/use-notifications-data";
import { AccountRole, isSuperadminRole } from "@/features/auth/types/auth.types";

// Lightweight row for the superadmin role-management screen — not the
// full UserProfile shape, just what's needed to list and manage everyone.
export interface AdminUserSummary {
  id: string;
  fullName: string;
  email: string;
  accountRole: AccountRole;
  kycStatus: string;
  avatarColor: string;
  createdAt: Date;
}

function mapUserSummaryRow(row: any): AdminUserSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    accountRole: row.account_role,
    kycStatus: row.kyc_status,
    avatarColor: row.avatar_color,
    createdAt: new Date(row.created_at),
  };
}

// Placeholder shown only for the brief window before fetchMyProfile()
// resolves — the root layout already gates every screen behind the auth
// loading state, so in practice this is rarely visible.
const EMPTY_USER: UserProfile = {
  id: "",
  fullName: "",
  email: "",
  role: "Pharmacist",
  avatarColor: "#64748b",
  kyc: { status: "unverified", documents: [] },
  createdAt: new Date(),
  publicVisibility: DEFAULT_USER_VISIBILITY,
};

function mapKycFields(row: any): KycRecord {
  return {
    status: row.kyc_status,
    documents: [],
    submittedAt: row.kyc_submitted_at ? new Date(row.kyc_submitted_at) : undefined,
    reviewedAt: row.kyc_reviewed_at ? new Date(row.kyc_reviewed_at) : undefined,
    reviewedBy: row.kyc_reviewed_by ?? undefined,
    rejectionReason: row.kyc_rejection_reason ?? undefined,
  };
}

function mapUserRow(row: any): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    licenseNumber: row.license_number ?? undefined,
    bio: row.bio ?? undefined,
    avatarColor: row.avatar_color,
    kyc: mapKycFields(row),
    createdAt: new Date(row.created_at),
    publicVisibility: { showEmail: row.public_show_email, showPhone: row.public_show_phone },
    location: row.location ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

function mapFacilityRow(row: any): FacilityProfile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    location: row.location,
    region: row.region,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    registrationNumber: row.registration_number ?? undefined,
    organizationId: row.organization_id ?? undefined,
    adminUserId: row.admin_user_id,
    kyc: mapKycFields(row),
    publicVisibility: { showEmail: row.public_show_email, showPhone: row.public_show_phone },
    createdAt: new Date(row.created_at),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

function mapOrganizationRow(row: any, facilityIds: string[]): OrganizationProfile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    registrationNumber: row.registration_number ?? undefined,
    headquartersLocation: row.headquarters_location ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    adminUserId: row.admin_user_id,
    facilityIds,
    kyc: mapKycFields(row),
    createdAt: new Date(row.created_at),
    publicVisibility: { showEmail: row.public_show_email, showPhone: row.public_show_phone },
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

// facility_memberships doesn't denormalize user name/email/avatar — those
// live on profiles, so this expects the row to come from a query that
// embedded the related profile (see fetchFacilityMembers below).
function mapMembershipRow(row: any): FacilityMembership {
  const profile = row.profiles ?? {};
  return {
    id: row.id,
    facilityId: row.facility_id,
    userId: row.user_id,
    userName: profile.full_name ?? "Unknown",
    userEmail: profile.email ?? "",
    avatarColor: profile.avatar_color ?? "#64748b",
    role: row.role,
    joinedAt: new Date(row.joined_at),
  };
}

function mapFacilityCreationRequestRow(row: any): FacilityCreationRequest {
  return {
    id: row.id,
    requestedBy: row.requested_by,
    name: row.name,
    type: row.type,
    location: row.location,
    region: row.region,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    registrationNumber: row.registration_number ?? undefined,
    status: row.status,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    createdAt: new Date(row.created_at),
    resultingFacilityId: row.resulting_facility_id ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

function mapOrganizationCreationRequestRow(row: any): OrganizationCreationRequest {
  return {
    id: row.id,
    requestedBy: row.requested_by,
    name: row.name,
    type: row.type,
    registrationNumber: row.registration_number ?? undefined,
    headquartersLocation: row.headquarters_location ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    createdAt: new Date(row.created_at),
    resultingOrganizationId: row.resulting_organization_id ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

// Expects requester profile info embedded via a join (see the fetch
// action below) — same reasoning as mapMembershipRow, since the request
// table itself only stores the id.
function mapFacilityMembershipRequestRow(row: any): FacilityMembershipRequest {
  const profile = row.profiles ?? {};
  return {
    id: row.id,
    facilityId: row.facility_id,
    requestedBy: row.requested_by,
    requesterName: profile.full_name ?? "Unknown",
    requesterEmail: profile.email ?? "",
    requesterAvatarColor: profile.avatar_color ?? "#64748b",
    requesterKycStatus: profile.kyc_status ?? "unverified",
    status: row.status,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapFacilityOrganizationRequestRow(row: any): FacilityOrganizationRequest {
  return {
    id: row.id,
    facilityId: row.facility_id,
    facilityName: row.facilities?.name ?? "Unknown facility",
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Unknown organization",
    requestedBy: row.requested_by,
    status: row.status,
    reviewComment: row.review_comment ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapCoverLetterRow(row: any): CoverLetterTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapPriceTemplateItemRow(row: any): PriceTemplateItem {
  return { id: row.id, product: row.product, rate: Number(row.rate), unit: row.unit ?? undefined };
}

function mapPriceTemplateRow(row: any): PriceTemplate {
  return {
    id: row.id,
    facilityId: row.facility_id,
    title: row.title,
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at),
    items: (row.price_template_items ?? []).map(mapPriceTemplateItemRow),
  };
}

function mapKycDocumentRow(row: any): KycDocument {
  return {
    id: row.id,
    type: row.document_type,
    imageUri: row.image_uri ?? undefined,
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at),
  };
}

// Distinct from `user` (which always means "the signed-in person's own
// profile") — this is any *other* user an admin is reviewing KYC for.
// Conflating the two was the actual bug: approving someone else's KYC
// was writing the result into the admin's own `user.kyc`, since there
// was previously no separate place for "some other user's KYC" to live
// at all.
export interface KycReviewUser {
  id: string;
  fullName: string;
  kyc: KycRecord;
}

function mapKycReviewUserRow(row: any): KycReviewUser {
  return {
    id: row.id,
    fullName: row.full_name,
    kyc: {
      status: row.kyc_status,
      documents: [],
      submittedAt: row.kyc_submitted_at ? new Date(row.kyc_submitted_at) : undefined,
      reviewedAt: row.kyc_reviewed_at ? new Date(row.kyc_reviewed_at) : undefined,
      reviewedBy: row.kyc_reviewed_by ?? undefined,
      rejectionReason: row.kyc_rejection_reason ?? undefined,
    },
  };
}

function parseCsv(csvText: string): { product: string; rate: number; unit?: string }[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const first = lines[0].split(",");
  const looksLikeHeader = Number.isNaN(Number(first[1]));
  const dataLines = looksLikeHeader ? lines.slice(1) : lines;

  const items: { product: string; rate: number; unit?: string }[] = [];
  for (const line of dataLines) {
    const cells = line.split(",").map((c) => c.trim());
    const [product, rateStr, unit] = cells;
    const rate = Number(rateStr);
    if (!product || Number.isNaN(rate)) continue;
    items.push({ product, rate, unit: unit || undefined });
  }
  return items;
}

function kycTable(entityType: KycEntityType): "profiles" | "facilities" | "organizations" {
  return entityType === "user" ? "profiles" : entityType === "facility" ? "facilities" : "organizations";
}

type ProfileStore = {
  user: UserProfile;
  facilities: FacilityProfile[];
  organizations: OrganizationProfile[];
  facilityMemberships: FacilityMembership[];
  coverLetterTemplates: CoverLetterTemplate[];
  priceTemplates: PriceTemplate[];
  facilityCreationRequests: FacilityCreationRequest[];
  organizationCreationRequests: OrganizationCreationRequest[];
  facilityMembershipRequests: FacilityMembershipRequest[];
  facilityOrganizationRequests: FacilityOrganizationRequest[];
  allUsers: AdminUserSummary[];
  // Other users' KYC (not the signed-in person's own — that's always
  // `user`). Admin-only, populated by fetchUsersForKycReview.
  usersForKycReview: KycReviewUser[];
  isLoading: boolean;

  fetchAllUsers: () => Promise<void>;
  fetchUsersForKycReview: () => Promise<void>;
  getSuperadminCount: () => number;
  // Covers promote-to-admin, promote-to-superadmin, and demote-to-user —
  // all three are the same underlying operation (change account_role),
  // and the database trigger is what actually enforces who's allowed to
  // do it and the 5-superadmin cap, so this just surfaces whatever it
  // says rather than duplicating that logic here.
  changeUserRole: (userId: string, newRole: AccountRole) => Promise<{ ok: boolean; error?: string }>;

  fetchMyProfile: () => Promise<void>;
  fetchFacilities: () => Promise<void>;
  fetchOrganizations: () => Promise<void>;
  fetchFacilityMembers: (facilityId: string) => Promise<void>;
  // Admin-only lookup — which facilities is a given user already a member
  // of? Not stored globally like the other membership fetches (this is
  // about someone else's memberships, not the signed-in person's own),
  // just returned directly for the detail view that needs it.
  fetchUserFacilityMemberships: (userId: string) => Promise<{ facilityId: string; facilityName: string; role: string }[]>;
  // Fetches every facility_memberships row for the CURRENT user, across
  // every facility they belong to — not one facility at a time. Without
  // this, getMyFacilities() has nothing to filter against until the user
  // happens to open a specific facility's own profile screen first, which
  // is a chicken-and-egg problem: the "My Facilities" list is supposed to
  // be how they find that screen in the first place.
  fetchMyFacilityMemberships: () => Promise<void>;
  fetchCoverLetterTemplates: () => Promise<void>;
  fetchPriceTemplates: () => Promise<void>;
  fetchKycDocuments: (entityType: KycEntityType, entityId: string) => Promise<void>;
  fetchFacilityCreationRequests: () => Promise<void>;
  fetchOrganizationCreationRequests: () => Promise<void>;
  fetchFacilityMembershipRequests: (facilityId?: string) => Promise<void>;
  fetchFacilityOrganizationRequests: () => Promise<void>;

  getFacility: (id: string) => FacilityProfile | undefined;
  getOrganization: (id: string) => OrganizationProfile | undefined;
  // Resolves a user id to a display name/avatar from whatever's already
  // been loaded locally (e.g. via fetchFacilityMembers) — falls back to a
  // generic placeholder rather than doing a network round-trip on every
  // render, since this is called from render-path components.
  getUserDisplay: (userId: string) => { id: string; name: string; avatarColor: string };
  getMyFacilities: () => FacilityProfile[];
  getFacilityMembers: (facilityId: string) => FacilityMembership[];

  updateUserProfile: (data: UserProfileFormData) => Promise<void>;
  updateFacilityProfile: (id: string, data: FacilityProfileFormData) => Promise<void>;
  updateOrganizationProfile: (id: string, data: OrganizationProfileFormData) => Promise<void>;

  updateUserVisibility: (visibility: Partial<PublicProfileVisibility>) => Promise<void>;
  updateFacilityVisibility: (id: string, visibility: Partial<PublicProfileVisibility>) => Promise<void>;
  updateOrganizationVisibility: (id: string, visibility: Partial<PublicProfileVisibility>) => Promise<void>;

  addKycDocument: (
    entityType: KycEntityType,
    entityId: string,
    type: KycDocumentType,
    fileName: string,
    imageUri?: string,
  ) => Promise<void>;
  removeKycDocument: (entityType: KycEntityType, entityId: string, documentId: string) => Promise<void>;
  submitKyc: (entityType: KycEntityType, entityId: string) => Promise<boolean>;
  approveKyc: (entityType: KycEntityType, entityId: string) => Promise<void>;
  rejectKyc: (entityType: KycEntityType, entityId: string, reason: string) => Promise<void>;

  // Creation is request/approve now, not self-service — a verified user
  // submits details, an admin approves (which is what actually creates the
  // row) or rejects.
  submitFacilityCreationRequest: (data: FacilityCreationRequestFormData) => Promise<{ ok: boolean; error?: string }>;
  approveFacilityCreationRequest: (id: string, comment?: string) => Promise<void>;
  rejectFacilityCreationRequest: (id: string, comment: string) => Promise<void>;

  submitOrganizationCreationRequest: (
    data: OrganizationCreationRequestFormData,
  ) => Promise<{ ok: boolean; error?: string }>;
  approveOrganizationCreationRequest: (id: string, comment?: string) => Promise<void>;
  rejectOrganizationCreationRequest: (id: string, comment: string) => Promise<void>;

  // Joining an existing (verified) facility is request/approve too —
  // replaces the old add-by-email flow, which could only ever be done by
  // the facility owner typing someone in; now anyone can ask to join, and
  // either the owner or an admin decides.
  requestFacilityMembership: (facilityId: string) => Promise<{ ok: boolean; error?: string }>;
  approveFacilityMembershipRequest: (id: string) => Promise<void>;
  rejectFacilityMembershipRequest: (id: string, comment: string) => Promise<void>;
  removeFacilityMember: (membershipId: string) => Promise<void>;

  requestFacilityOrganizationLink: (
    facilityId: string,
    organizationId: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  approveFacilityOrganizationRequest: (id: string) => Promise<void>;
  rejectFacilityOrganizationRequest: (id: string, comment: string) => Promise<void>;
  removeFacilityFromOrganization: (organizationId: string, facilityId: string) => Promise<void>;

  addCoverLetterTemplate: (data: CoverLetterTemplateFormData) => Promise<void>;
  updateCoverLetterTemplate: (id: string, data: CoverLetterTemplateFormData) => Promise<void>;
  deleteCoverLetterTemplate: (id: string) => Promise<void>;

  addPriceTemplate: (facilityId: string, title: string, fileName: string, csvText: string) => Promise<void>;
  deletePriceTemplate: (id: string) => Promise<void>;
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  user: EMPTY_USER,
  facilities: [],
  organizations: [],
  facilityMemberships: [],
  coverLetterTemplates: [],
  priceTemplates: [],
  facilityCreationRequests: [],
  organizationCreationRequests: [],
  facilityMembershipRequests: [],
  facilityOrganizationRequests: [],
  allUsers: [],
  usersForKycReview: [],
  isLoading: false,

  fetchMyProfile: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error || !data) {
      console.warn("[profile] fetchMyProfile failed:", error?.message);
      return;
    }
    set({ user: mapUserRow(data) });
  },

  fetchAllUsers: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, account_role, kyc_status, avatar_color, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchAllUsers failed:", error.message);
      return;
    }
    set({ allUsers: (data ?? []).map(mapUserSummaryRow) });
  },

  // Only users who've actually submitted KYC (status != 'unverified')
  // are fetched — most registered users never submit KYC at all, so
  // pulling every profile the way fetchAllUsers does would be wasteful
  // and mostly noise for a review queue. Excludes the signed-in admin's
  // own row, since that's already represented via `user`, not this list
  // — keeping the two separate is what fixes approve/reject incorrectly
  // overwriting the admin's own profile state instead of the actual
  // user being reviewed.
  fetchUsersForKycReview: async () => {
    const myId = await requireUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_reviewed_by, kyc_rejection_reason")
      .neq("kyc_status", "unverified")
      .neq("id", myId)
      .order("kyc_submitted_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchUsersForKycReview failed:", error.message);
      return;
    }
    const users = (data ?? []).map(mapKycReviewUserRow);
    if (users.length === 0) {
      set({ usersForKycReview: [] });
      return;
    }

    const { data: docRows, error: docError } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("entity_type", "user")
      .in(
        "entity_id",
        users.map((u) => u.id),
      );
    if (docError) {
      console.warn("[profile] fetchUsersForKycReview (documents) failed:", docError.message);
      set({ usersForKycReview: users });
      return;
    }

    const docsByUserId = new Map<string, KycDocument[]>();
    for (const row of docRows ?? []) {
      const list = docsByUserId.get(row.entity_id) ?? [];
      list.push(mapKycDocumentRow(row));
      docsByUserId.set(row.entity_id, list);
    }

    set({
      usersForKycReview: users.map((u) => ({
        ...u,
        kyc: { ...u.kyc, documents: docsByUserId.get(u.id) ?? [] },
      })),
    });
  },

  // Synchronous, derived from whatever's already loaded via fetchAllUsers
  // — lets the UI show "X of 5 used" and grey out the promote action
  // before hitting the cap, rather than only finding out from the
  // database trigger's rejection after the fact. The trigger remains the
  // actual enforcement; this is just so the UI doesn't offer an action
  // that's guaranteed to fail.
  getSuperadminCount: () => get().allUsers.filter((u) => isSuperadminRole(u.accountRole)).length,

  changeUserRole: async (userId, newRole) => {
    const { error } = await supabase.from("profiles").update({ account_role: newRole }).eq("id", userId);
    if (error) {
      // The database trigger is the actual source of truth here (the
      // 5-superadmin cap, "only a superadmin can do this", "at least one
      // superadmin must remain") — its exception message is what's
      // actually shown, this isn't re-deriving the rule client-side.
      return { ok: false, error: error.message };
    }

    set((state) => ({
      allUsers: state.allUsers.map((u) => (u.id === userId ? { ...u, accountRole: newRole } : u)),
    }));

    // If the change was to the currently-loaded profile screen's own
    // user (e.g. a superadmin demoting themselves), keep useProfileStore
    // in sync too. Note: this does NOT refresh useAuthStore().profile —
    // that's what every isAdmin/isSuperadmin gate in the app actually
    // reads from, and importing useAuthStore here would recreate the
    // require cycle already fixed earlier (use-auth-data.ts imports
    // useProfileStore for identity sync, so the reverse import would
    // cycle back). Callers changing their OWN role should also call
    // useAuthStore.getState().refreshProfile() themselves afterward.
    if (get().user.id === userId) {
      await get().fetchMyProfile();
    }

    return { ok: true };
  },

  fetchFacilities: async () => {
    const { data, error } = await supabase.from("facilities").select("*").order("name");
    if (error) {
      console.warn("[profile] fetchFacilities failed:", error.message);
      return;
    }
    set({ facilities: (data ?? []).map(mapFacilityRow) });
  },

  fetchOrganizations: async () => {
    const { data, error } = await supabase.from("organizations").select("*, facilities(id)").order("name");
    if (error) {
      console.warn("[profile] fetchOrganizations failed:", error.message);
      return;
    }
    set({
      organizations: (data ?? []).map((row: any) =>
        mapOrganizationRow(row, (row.facilities ?? []).map((f: any) => f.id)),
      ),
    });
  },

  fetchFacilityMembers: async (facilityId) => {
    const { data, error } = await supabase
      .from("facility_memberships")
      .select("*, profiles(full_name, email, avatar_color)")
      .eq("facility_id", facilityId);
    if (error) {
      console.warn("[profile] fetchFacilityMembers failed:", error.message);
      return;
    }
    const fetched = (data ?? []).map(mapMembershipRow);
    set((state) => ({
      facilityMemberships: [
        ...state.facilityMemberships.filter((m) => m.facilityId !== facilityId),
        ...fetched,
      ],
    }));
  },

  fetchUserFacilityMemberships: async (userId) => {
    const { data, error } = await supabase
      .from("facility_memberships")
      .select("facility_id, role, facilities(name)")
      .eq("user_id", userId);
    if (error) {
      console.warn("[profile] fetchUserFacilityMemberships failed:", error.message);
      return [];
    }
    return (data ?? []).map((row: any) => ({
      facilityId: row.facility_id,
      facilityName: row.facilities?.name ?? "Unknown facility",
      role: row.role,
    }));
  },

  fetchMyFacilityMemberships: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("facility_memberships")
      .select("*, profiles(full_name, email, avatar_color)")
      .eq("user_id", userId);
    if (error) {
      console.warn("[profile] fetchMyFacilityMemberships failed:", error.message);
      return;
    }
    const fetched = (data ?? []).map(mapMembershipRow);
    set((state) => ({
      facilityMemberships: [
        ...state.facilityMemberships.filter((m) => m.userId !== userId),
        ...fetched,
      ],
    }));
  },

  fetchCoverLetterTemplates: async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("cover_letter_templates")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchCoverLetterTemplates failed:", error.message);
      return;
    }
    set({ coverLetterTemplates: (data ?? []).map(mapCoverLetterRow) });
  },

  fetchPriceTemplates: async () => {
    const { data, error } = await supabase
      .from("price_templates")
      .select("*, price_template_items(*)")
      .order("uploaded_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchPriceTemplates failed:", error.message);
      return;
    }
    set({ priceTemplates: (data ?? []).map(mapPriceTemplateRow) });
  },

  fetchKycDocuments: async (entityType, entityId) => {
    const { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) {
      console.warn("[profile] fetchKycDocuments failed:", error.message);
      return;
    }
    const documents = (data ?? []).map(mapKycDocumentRow);
    set((state) => {
      if (entityType === "user") return { user: { ...state.user, kyc: { ...state.user.kyc, documents } } };
      if (entityType === "facility") {
        return {
          facilities: state.facilities.map((f) =>
            f.id === entityId ? { ...f, kyc: { ...f.kyc, documents } } : f,
          ),
        };
      }
      return {
        organizations: state.organizations.map((o) =>
          o.id === entityId ? { ...o, kyc: { ...o.kyc, documents } } : o,
        ),
      };
    });
  },

  fetchFacilityCreationRequests: async () => {
    const { data, error } = await supabase
      .from("facility_creation_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchFacilityCreationRequests failed:", error.message);
      return;
    }
    set({ facilityCreationRequests: (data ?? []).map(mapFacilityCreationRequestRow) });
  },

  fetchOrganizationCreationRequests: async () => {
    const { data, error } = await supabase
      .from("organization_creation_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchOrganizationCreationRequests failed:", error.message);
      return;
    }
    set({ organizationCreationRequests: (data ?? []).map(mapOrganizationCreationRequestRow) });
  },

  fetchFacilityMembershipRequests: async (facilityId) => {
    let query = supabase
      .from("facility_membership_requests")
      .select("*, profiles:requested_by(full_name, email, avatar_color, kyc_status)")
      .order("created_at", { ascending: false });
    if (facilityId) query = query.eq("facility_id", facilityId);
    const { data, error } = await query;
    if (error) {
      console.warn("[profile] fetchFacilityMembershipRequests failed:", error.message);
      return;
    }
    const fetched = (data ?? []).map(mapFacilityMembershipRequestRow);
    set((state) => ({
      facilityMembershipRequests: facilityId
        ? [...state.facilityMembershipRequests.filter((r) => r.facilityId !== facilityId), ...fetched]
        : fetched,
    }));
  },

  fetchFacilityOrganizationRequests: async () => {
    const { data, error } = await supabase
      .from("facility_organization_requests")
      .select("*, facilities(name), organizations(name)")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[profile] fetchFacilityOrganizationRequests failed:", error.message);
      return;
    }
    set({ facilityOrganizationRequests: (data ?? []).map(mapFacilityOrganizationRequestRow) });
  },

  getFacility: (id) => get().facilities.find((f) => f.id === id),
  getOrganization: (id) => get().organizations.find((o) => o.id === id),

  getUserDisplay: (userId) => {
    if (userId === get().user.id) {
      return { id: get().user.id, name: get().user.fullName, avatarColor: get().user.avatarColor };
    }
    const membership = get().facilityMemberships.find((m) => m.userId === userId);
    if (membership) {
      return { id: membership.userId, name: membership.userName, avatarColor: membership.avatarColor };
    }
    return { id: userId, name: "Unknown user", avatarColor: "#64748b" };
  },

  getMyFacilities: () => {
    const myId = get().user.id;
    const myFacilityIds = new Set(
      get()
        .facilityMemberships.filter((m) => m.userId === myId)
        .map((m) => m.facilityId),
    );
    return get().facilities.filter((f) => myFacilityIds.has(f.id));
  },

  getFacilityMembers: (facilityId) =>
    get().facilityMemberships.filter((m) => m.facilityId === facilityId),

  updateUserProfile: async (data) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        role: data.role,
        license_number: data.licenseNumber ?? null,
        bio: data.bio ?? null,
        location: data.location ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
      .eq("id", userId);
    if (error) {
      console.warn("[profile] updateUserProfile failed:", error.message);
      return;
    }
    set((state) => ({ user: { ...state.user, ...data } }));
  },

  updateFacilityProfile: async (id, data) => {
    const { error } = await supabase
      .from("facilities")
      .update({
        name: data.name,
        type: data.type,
        location: data.location,
        region: data.region,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        registration_number: data.registrationNumber ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
      .eq("id", id);
    if (error) {
      console.warn("[profile] updateFacilityProfile failed:", error.message);
      return;
    }
    set((state) => ({
      facilities: state.facilities.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
  },

  updateOrganizationProfile: async (id, data) => {
    const { error } = await supabase
      .from("organizations")
      .update({
        name: data.name,
        type: data.type,
        registration_number: data.registrationNumber ?? null,
        headquarters_location: data.headquartersLocation ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
      .eq("id", id);
    if (error) {
      console.warn("[profile] updateOrganizationProfile failed:", error.message);
      return;
    }
    set((state) => ({
      organizations: state.organizations.map((o) => (o.id === id ? { ...o, ...data } : o)),
    }));
  },

  updateUserVisibility: async (visibility) => {
    const userId = await requireUserId();
    const patch: Record<string, boolean> = {};
    if (visibility.showEmail !== undefined) patch.public_show_email = visibility.showEmail;
    if (visibility.showPhone !== undefined) patch.public_show_phone = visibility.showPhone;
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) {
      console.warn("[profile] updateUserVisibility failed:", error.message);
      return;
    }
    set((state) => ({
      user: { ...state.user, publicVisibility: { ...state.user.publicVisibility, ...visibility } },
    }));
  },

  updateFacilityVisibility: async (id, visibility) => {
    const patch: Record<string, boolean> = {};
    if (visibility.showEmail !== undefined) patch.public_show_email = visibility.showEmail;
    if (visibility.showPhone !== undefined) patch.public_show_phone = visibility.showPhone;
    const { error } = await supabase.from("facilities").update(patch).eq("id", id);
    if (error) {
      console.warn("[profile] updateFacilityVisibility failed:", error.message);
      return;
    }
    set((state) => ({
      facilities: state.facilities.map((f) =>
        f.id === id ? { ...f, publicVisibility: { ...f.publicVisibility, ...visibility } } : f,
      ),
    }));
  },

  updateOrganizationVisibility: async (id, visibility) => {
    const patch: Record<string, boolean> = {};
    if (visibility.showEmail !== undefined) patch.public_show_email = visibility.showEmail;
    if (visibility.showPhone !== undefined) patch.public_show_phone = visibility.showPhone;
    const { error } = await supabase.from("organizations").update(patch).eq("id", id);
    if (error) {
      console.warn("[profile] updateOrganizationVisibility failed:", error.message);
      return;
    }
    set((state) => ({
      organizations: state.organizations.map((o) =>
        o.id === id ? { ...o, publicVisibility: { ...o.publicVisibility, ...visibility } } : o,
      ),
    }));
  },

  addKycDocument: async (entityType, entityId, type, fileName, imageUri) => {
    // Note: imageUri is stored as-is (a plain text column) — this doesn't
    // upload to Supabase Storage. Wire that up separately and pass the
    // resulting object path/URL in here once you do.
    const { data: row, error } = await supabase
      .from("kyc_documents")
      .insert({ entity_type: entityType, entity_id: entityId, document_type: type, file_name: fileName, image_uri: imageUri ?? null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[profile] addKycDocument failed:", error?.message);
      return;
    }
    const doc = mapKycDocumentRow(row);
    set((state) => {
      if (entityType === "user") {
        return { user: { ...state.user, kyc: { ...state.user.kyc, documents: [...state.user.kyc.documents, doc] } } };
      }
      if (entityType === "facility") {
        return {
          facilities: state.facilities.map((f) =>
            f.id === entityId ? { ...f, kyc: { ...f.kyc, documents: [...f.kyc.documents, doc] } } : f,
          ),
        };
      }
      return {
        organizations: state.organizations.map((o) =>
          o.id === entityId ? { ...o, kyc: { ...o.kyc, documents: [...o.kyc.documents, doc] } } : o,
        ),
      };
    });
  },

  removeKycDocument: async (entityType, entityId, documentId) => {
    const { error } = await supabase.from("kyc_documents").delete().eq("id", documentId);
    if (error) {
      console.warn("[profile] removeKycDocument failed:", error.message);
      return;
    }
    set((state) => {
      if (entityType === "user") {
        return {
          user: {
            ...state.user,
            kyc: { ...state.user.kyc, documents: state.user.kyc.documents.filter((d) => d.id !== documentId) },
          },
        };
      }
      if (entityType === "facility") {
        return {
          facilities: state.facilities.map((f) =>
            f.id === entityId
              ? { ...f, kyc: { ...f.kyc, documents: f.kyc.documents.filter((d) => d.id !== documentId) } }
              : f,
          ),
        };
      }
      return {
        organizations: state.organizations.map((o) =>
          o.id === entityId
            ? { ...o, kyc: { ...o.kyc, documents: o.kyc.documents.filter((d) => d.id !== documentId) } }
            : o,
        ),
      };
    });
  },

  submitKyc: async (entityType, entityId) => {
    const table = kycTable(entityType);
    const { error } = await supabase
      .from(table)
      .update({ kyc_status: "pending", kyc_submitted_at: new Date().toISOString(), kyc_rejection_reason: null })
      .eq("id", entityId);
    if (error) {
      console.warn("[profile] submitKyc failed:", error.message);
      return false;
    }
    set((state) => {
      const patch = { status: "pending" as const, submittedAt: new Date(), rejectionReason: undefined };
      if (entityType === "user") return { user: { ...state.user, kyc: { ...state.user.kyc, ...patch } } };
      if (entityType === "facility") {
        return { facilities: state.facilities.map((f) => (f.id === entityId ? { ...f, kyc: { ...f.kyc, ...patch } } : f)) };
      }
      return { organizations: state.organizations.map((o) => (o.id === entityId ? { ...o, kyc: { ...o.kyc, ...patch } } : o)) };
    });
    return true;
  },

  approveKyc: async (entityType, entityId) => {
    const reviewerId = await requireUserId();
    const table = kycTable(entityType);
    const isSelf = entityType === "user" && entityId === get().user.id;
    const entityName = isSelf
      ? get().user.fullName
      : entityType === "user"
        ? get().usersForKycReview.find((u) => u.id === entityId)?.fullName
        : entityType === "facility"
          ? get().facilities.find((f) => f.id === entityId)?.name
          : get().organizations.find((o) => o.id === entityId)?.name;

    const { error } = await supabase
      .from(table)
      .update({
        kyc_status: "verified",
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewed_by: reviewerId,
        kyc_rejection_reason: null,
      })
      .eq("id", entityId);
    if (error) {
      console.warn("[profile] approveKyc failed:", error.message);
      return;
    }

    set((state) => {
      const patch = { status: "verified" as const, reviewedAt: new Date(), reviewedBy: reviewerId, rejectionReason: undefined };
      if (isSelf) return { user: { ...state.user, kyc: { ...state.user.kyc, ...patch } } };
      if (entityType === "user") {
        return {
          usersForKycReview: state.usersForKycReview.map((u) =>
            u.id === entityId ? { ...u, kyc: { ...u.kyc, ...patch } } : u,
          ),
        };
      }
      if (entityType === "facility") {
        return { facilities: state.facilities.map((f) => (f.id === entityId ? { ...f, kyc: { ...f.kyc, ...patch } } : f)) };
      }
      return { organizations: state.organizations.map((o) => (o.id === entityId ? { ...o, kyc: { ...o.kyc, ...patch } } : o)) };
    });

    useNotificationStore.getState().addNotification(
      "kyc_decision",
      `${isSelf ? "You are" : `${entityName ?? "Your submission"} is`} verified`,
      `${isSelf ? "Your submission" : entityName ?? "Your submission"} has been verified.`,
      { pathname: entityType === "user" ? "/profile/user-profile" : entityType === "facility" ? "/profile/facility-profile" : "/profile/organization-profile" },
    );
  },

  rejectKyc: async (entityType, entityId, reason) => {
    const reviewerId = await requireUserId();
    const table = kycTable(entityType);
    const isSelf = entityType === "user" && entityId === get().user.id;
    const entityName = isSelf
      ? get().user.fullName
      : entityType === "user"
        ? get().usersForKycReview.find((u) => u.id === entityId)?.fullName
        : entityType === "facility"
          ? get().facilities.find((f) => f.id === entityId)?.name
          : get().organizations.find((o) => o.id === entityId)?.name;

    const { error } = await supabase
      .from(table)
      .update({
        kyc_status: "rejected",
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewed_by: reviewerId,
        kyc_rejection_reason: reason,
      })
      .eq("id", entityId);
    if (error) {
      console.warn("[profile] rejectKyc failed:", error.message);
      return;
    }

    set((state) => {
      const patch = { status: "rejected" as const, reviewedAt: new Date(), reviewedBy: reviewerId, rejectionReason: reason };
      if (isSelf) return { user: { ...state.user, kyc: { ...state.user.kyc, ...patch } } };
      if (entityType === "user") {
        return {
          usersForKycReview: state.usersForKycReview.map((u) =>
            u.id === entityId ? { ...u, kyc: { ...u.kyc, ...patch } } : u,
          ),
        };
      }
      if (entityType === "facility") {
        return { facilities: state.facilities.map((f) => (f.id === entityId ? { ...f, kyc: { ...f.kyc, ...patch } } : f)) };
      }
      return { organizations: state.organizations.map((o) => (o.id === entityId ? { ...o, kyc: { ...o.kyc, ...patch } } : o)) };
    });

    useNotificationStore.getState().addNotification(
      "kyc_decision",
      `Verification needs attention`,
      `${isSelf ? "Your submission" : entityName ?? "Your submission"} was not approved: ${reason}`,
      { pathname: entityType === "user" ? "/profile/user-profile" : entityType === "facility" ? "/profile/facility-profile" : "/profile/organization-profile" },
    );
  },

  submitFacilityCreationRequest: async (data) => {
    const userId = await requireUserId();
    if (get().user.kyc.status !== "verified") {
      return { ok: false, error: "Your account must be verified before you can request a new facility." };
    }
    const { data: row, error } = await supabase
      .from("facility_creation_requests")
      .insert({
        requested_by: userId,
        name: data.name.trim(),
        type: data.type,
        location: data.location.trim(),
        region: data.region.trim(),
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        registration_number: data.registrationNumber?.trim() || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
      .select()
      .single();
    if (error || !row) return { ok: false, error: error?.message ?? "Couldn't submit request." };

    set((state) => ({
      facilityCreationRequests: [mapFacilityCreationRequestRow(row), ...state.facilityCreationRequests],
    }));
    return { ok: true };
  },

  approveFacilityCreationRequest: async (id, comment) => {
    const reviewerId = await requireUserId();
    const request = get().facilityCreationRequests.find((r) => r.id === id);
    if (!request) return;

    const { data: facilityRow, error: facilityError } = await supabase
      .from("facilities")
      .insert({
        name: request.name,
        type: request.type,
        location: request.location,
        region: request.region,
        address: request.address ?? null,
        phone: request.phone ?? null,
        email: request.email ?? null,
        registration_number: request.registrationNumber ?? null,
        admin_user_id: request.requestedBy,
        latitude: request.latitude ?? null,
        longitude: request.longitude ?? null,
      })
      .select()
      .single();
    if (facilityError || !facilityRow) {
      console.warn("[profile] approveFacilityCreationRequest (facility insert) failed:", facilityError?.message);
      return;
    }

    // The requester becomes the facility's Owner automatically — they
    // asked for it to exist, so they're the one running it.
    const { error: membershipError } = await supabase
      .from("facility_memberships")
      .insert({ facility_id: facilityRow.id, user_id: request.requestedBy, role: "Owner" });
    if (membershipError) {
      console.warn("[profile] approveFacilityCreationRequest (owner membership) failed:", membershipError.message);
    }

    const { error: updateError } = await supabase
      .from("facility_creation_requests")
      .update({
        status: "approved",
        review_comment: comment?.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        resulting_facility_id: facilityRow.id,
      })
      .eq("id", id);
    if (updateError) {
      console.warn("[profile] approveFacilityCreationRequest (request update) failed:", updateError.message);
      return;
    }

    await get().fetchFacilities();
    await get().fetchFacilityMembers(facilityRow.id);
    set((state) => ({
      facilityCreationRequests: state.facilityCreationRequests.map((r) =>
        r.id === id
          ? { ...r, status: "approved" as const, reviewComment: comment?.trim(), reviewedBy: reviewerId, reviewedAt: new Date(), resultingFacilityId: facilityRow.id }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "facility_creation_decision",
      "Facility approved",
      `"${request.name}" has been created. Submit KYC documents to get it verified.`,
      { pathname: "/profile/facility-profile", params: { id: facilityRow.id } },
    );
  },

  rejectFacilityCreationRequest: async (id, comment) => {
    const reviewerId = await requireUserId();
    const request = get().facilityCreationRequests.find((r) => r.id === id);
    if (!request) return;

    const { error } = await supabase
      .from("facility_creation_requests")
      .update({
        status: "rejected",
        review_comment: comment.trim(),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[profile] rejectFacilityCreationRequest failed:", error.message);
      return;
    }

    set((state) => ({
      facilityCreationRequests: state.facilityCreationRequests.map((r) =>
        r.id === id
          ? { ...r, status: "rejected" as const, reviewComment: comment.trim(), reviewedBy: reviewerId, reviewedAt: new Date() }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "facility_creation_decision",
      "Facility request declined",
      `"${request.name}" was not approved: ${comment.trim()}`,
      { pathname: "/profile" },
    );
  },

  submitOrganizationCreationRequest: async (data) => {
    const userId = await requireUserId();
    if (get().user.kyc.status !== "verified") {
      return { ok: false, error: "Your account must be verified before you can request a new organization." };
    }
    const { data: row, error } = await supabase
      .from("organization_creation_requests")
      .insert({
        requested_by: userId,
        name: data.name.trim(),
        type: data.type,
        registration_number: data.registrationNumber?.trim() || null,
        headquarters_location: data.headquartersLocation?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
      .select()
      .single();
    if (error || !row) return { ok: false, error: error?.message ?? "Couldn't submit request." };

    set((state) => ({
      organizationCreationRequests: [mapOrganizationCreationRequestRow(row), ...state.organizationCreationRequests],
    }));
    return { ok: true };
  },

  approveOrganizationCreationRequest: async (id, comment) => {
    const reviewerId = await requireUserId();
    const request = get().organizationCreationRequests.find((r) => r.id === id);
    if (!request) return;

    const { data: orgRow, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: request.name,
        type: request.type,
        registration_number: request.registrationNumber ?? null,
        headquarters_location: request.headquartersLocation ?? null,
        email: request.email ?? null,
        phone: request.phone ?? null,
        admin_user_id: request.requestedBy,
        latitude: request.latitude ?? null,
        longitude: request.longitude ?? null,
      })
      .select()
      .single();
    if (orgError || !orgRow) {
      console.warn("[profile] approveOrganizationCreationRequest (org insert) failed:", orgError?.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("organization_creation_requests")
      .update({
        status: "approved",
        review_comment: comment?.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        resulting_organization_id: orgRow.id,
      })
      .eq("id", id);
    if (updateError) {
      console.warn("[profile] approveOrganizationCreationRequest (request update) failed:", updateError.message);
      return;
    }

    await get().fetchOrganizations();
    set((state) => ({
      organizationCreationRequests: state.organizationCreationRequests.map((r) =>
        r.id === id
          ? { ...r, status: "approved" as const, reviewComment: comment?.trim(), reviewedBy: reviewerId, reviewedAt: new Date(), resultingOrganizationId: orgRow.id }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "organization_creation_decision",
      "Organization approved",
      `"${request.name}" has been created. Submit KYC documents to get it verified.`,
      { pathname: "/profile/organization-profile", params: { id: orgRow.id } },
    );
  },

  rejectOrganizationCreationRequest: async (id, comment) => {
    const reviewerId = await requireUserId();
    const request = get().organizationCreationRequests.find((r) => r.id === id);
    if (!request) return;

    const { error } = await supabase
      .from("organization_creation_requests")
      .update({
        status: "rejected",
        review_comment: comment.trim(),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[profile] rejectOrganizationCreationRequest failed:", error.message);
      return;
    }

    set((state) => ({
      organizationCreationRequests: state.organizationCreationRequests.map((r) =>
        r.id === id
          ? { ...r, status: "rejected" as const, reviewComment: comment.trim(), reviewedBy: reviewerId, reviewedAt: new Date() }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "organization_creation_decision",
      "Organization request declined",
      `"${request.name}" was not approved: ${comment.trim()}`,
      { pathname: "/profile" },
    );
  },

  requestFacilityMembership: async (facilityId) => {
    const userId = await requireUserId();
    const facility = get().facilities.find((f) => f.id === facilityId);
    if (!facility) return { ok: false, error: "Facility not found." };
    if (facility.kyc.status !== "verified") {
      return { ok: false, error: "This facility must be verified before you can request to join." };
    }
    const alreadyMember = get().facilityMemberships.some(
      (m) => m.facilityId === facilityId && m.userId === userId,
    );
    if (alreadyMember) return { ok: false, error: "You're already a member of this facility." };

    const { data: row, error } = await supabase
      .from("facility_membership_requests")
      .insert({ facility_id: facilityId, requested_by: userId })
      .select("*, profiles:requested_by(full_name, email, avatar_color, kyc_status)")
      .single();
    if (error || !row) {
      // The partial unique index rejects a second pending request with a
      // constraint violation — surface that as a plain, expected message
      // rather than a raw database error.
      const message = error?.message?.includes("duplicate")
        ? "You already have a pending request for this facility."
        : (error?.message ?? "Couldn't submit request.");
      return { ok: false, error: message };
    }

    set((state) => ({
      facilityMembershipRequests: [mapFacilityMembershipRequestRow(row), ...state.facilityMembershipRequests],
    }));

    if (facility.adminUserId) {
      useNotificationStore.getState().addNotification(
        "facility_membership_request_received",
        "New membership request",
        `${get().user.fullName} wants to join ${facility.name}.`,
        { pathname: "/profile/facility-profile", params: { id: facility.id } },
      );
    }

    return { ok: true };
  },

  approveFacilityMembershipRequest: async (id) => {
    const request = get().facilityMembershipRequests.find((r) => r.id === id);
    if (!request) return;
    const reviewerId = await requireUserId();
    const facility = get().facilities.find((f) => f.id === request.facilityId);

    const { data: membershipRow, error: membershipError } = await supabase
      .from("facility_memberships")
      .insert({ facility_id: request.facilityId, user_id: request.requestedBy, role: "Member" })
      .select("*, profiles(full_name, email, avatar_color)")
      .single();
    if (membershipError || !membershipRow) {
      console.warn("[profile] approveFacilityMembershipRequest (membership insert) failed:", membershipError?.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("facility_membership_requests")
      .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      console.warn("[profile] approveFacilityMembershipRequest (request update) failed:", updateError.message);
      return;
    }

    const membership = mapMembershipRow(membershipRow);
    set((state) => ({
      facilityMemberships: [...state.facilityMemberships, membership],
      facilityMembershipRequests: state.facilityMembershipRequests.map((r) =>
        r.id === id ? { ...r, status: "approved" as const, reviewedBy: reviewerId, reviewedAt: new Date() } : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "facility_membership_decision",
      "Membership request approved",
      `You're now a member of ${facility?.name ?? "the facility"}.`,
      { pathname: "/profile/facility-profile", params: { id: request.facilityId } },
    );
  },

  rejectFacilityMembershipRequest: async (id, comment) => {
    const request = get().facilityMembershipRequests.find((r) => r.id === id);
    if (!request) return;
    const reviewerId = await requireUserId();
    const facility = get().facilities.find((f) => f.id === request.facilityId);

    const { error } = await supabase
      .from("facility_membership_requests")
      .update({
        status: "rejected",
        review_comment: comment.trim(),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[profile] rejectFacilityMembershipRequest failed:", error.message);
      return;
    }

    set((state) => ({
      facilityMembershipRequests: state.facilityMembershipRequests.map((r) =>
        r.id === id
          ? { ...r, status: "rejected" as const, reviewComment: comment.trim(), reviewedBy: reviewerId, reviewedAt: new Date() }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "facility_membership_decision",
      "Membership request declined",
      `Your request to join ${facility?.name ?? "the facility"} was not approved: ${comment.trim()}`,
      { pathname: "/profile" },
    );
  },

  removeFacilityMember: async (membershipId) => {
    const { error } = await supabase.from("facility_memberships").delete().eq("id", membershipId);
    if (error) {
      console.warn("[profile] removeFacilityMember failed:", error.message);
      return;
    }
    set((state) => ({
      facilityMemberships: state.facilityMemberships.filter((m) => m.id !== membershipId),
    }));
  },

  requestFacilityOrganizationLink: async (facilityId, organizationId) => {
    const userId = await requireUserId();
    const facility = get().facilities.find((f) => f.id === facilityId);
    const org = get().organizations.find((o) => o.id === organizationId);
    if (!facility || !org) return { ok: false, error: "Facility or organization not found." };
    if (facility.adminUserId !== userId) return { ok: false, error: "Only the facility's owner can request this." };
    if (facility.kyc.status !== "verified") return { ok: false, error: "Your facility must be verified first." };
    if (org.kyc.status !== "verified") return { ok: false, error: "This organization must be verified first." };
    if (facility.organizationId) return { ok: false, error: "This facility already belongs to an organization." };

    const { data: row, error } = await supabase
      .from("facility_organization_requests")
      .insert({ facility_id: facilityId, organization_id: organizationId, requested_by: userId })
      .select("*, facilities(name), organizations(name)")
      .single();
    if (error || !row) {
      const message = error?.message?.includes("duplicate")
        ? "There's already a pending request for this facility and organization."
        : (error?.message ?? "Couldn't submit request.");
      return { ok: false, error: message };
    }

    set((state) => ({
      facilityOrganizationRequests: [mapFacilityOrganizationRequestRow(row), ...state.facilityOrganizationRequests],
    }));

    useNotificationStore.getState().addNotification(
      "facility_organization_request_received",
      "New facility-to-organization request",
      `${facility.name} wants to join ${org.name}.`,
      { pathname: "/profile/organization-profile", params: { id: org.id } },
    );

    return { ok: true };
  },

  approveFacilityOrganizationRequest: async (id) => {
    const request = get().facilityOrganizationRequests.find((r) => r.id === id);
    if (!request) return;
    const reviewerId = await requireUserId();

    const { error: facilityError } = await supabase
      .from("facilities")
      .update({ organization_id: request.organizationId })
      .eq("id", request.facilityId);
    if (facilityError) {
      console.warn("[profile] approveFacilityOrganizationRequest (facility update) failed:", facilityError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("facility_organization_requests")
      .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      console.warn("[profile] approveFacilityOrganizationRequest (request update) failed:", updateError.message);
      return;
    }

    set((state) => ({
      facilities: state.facilities.map((f) =>
        f.id === request.facilityId ? { ...f, organizationId: request.organizationId } : f,
      ),
      organizations: state.organizations.map((o) =>
        o.id === request.organizationId ? { ...o, facilityIds: [...o.facilityIds, request.facilityId] } : o,
      ),
      facilityOrganizationRequests: state.facilityOrganizationRequests.map((r) =>
        r.id === id ? { ...r, status: "approved" as const, reviewedBy: reviewerId, reviewedAt: new Date() } : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "facility_organization_decision",
      "Facility joined organization",
      `${request.facilityName} now belongs to ${request.organizationName}.`,
      { pathname: "/profile/facility-profile", params: { id: request.facilityId } },
    );
  },

  rejectFacilityOrganizationRequest: async (id, comment) => {
    const request = get().facilityOrganizationRequests.find((r) => r.id === id);
    if (!request) return;
    const reviewerId = await requireUserId();

    const { error } = await supabase
      .from("facility_organization_requests")
      .update({
        status: "rejected",
        review_comment: comment.trim(),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("[profile] rejectFacilityOrganizationRequest failed:", error.message);
      return;
    }

    set((state) => ({
      facilityOrganizationRequests: state.facilityOrganizationRequests.map((r) =>
        r.id === id
          ? { ...r, status: "rejected" as const, reviewComment: comment.trim(), reviewedBy: reviewerId, reviewedAt: new Date() }
          : r,
      ),
    }));

    useNotificationStore.getState().addNotification(
      "facility_organization_decision",
      "Facility-to-organization request declined",
      `${request.facilityName}'s request to join ${request.organizationName} was not approved: ${comment.trim()}`,
      { pathname: "/profile/facility-profile", params: { id: request.facilityId } },
    );
  },

  removeFacilityFromOrganization: async (organizationId, facilityId) => {
    const { error } = await supabase.from("facilities").update({ organization_id: null }).eq("id", facilityId);
    if (error) {
      console.warn("[profile] removeFacilityFromOrganization failed:", error.message);
      return;
    }
    set((state) => ({
      facilities: state.facilities.map((f) => (f.id === facilityId ? { ...f, organizationId: undefined } : f)),
      organizations: state.organizations.map((o) =>
        o.id === organizationId ? { ...o, facilityIds: o.facilityIds.filter((id) => id !== facilityId) } : o,
      ),
    }));
  },

  addCoverLetterTemplate: async (data) => {
    const userId = await requireUserId();
    const { data: row, error } = await supabase
      .from("cover_letter_templates")
      .insert({ user_id: userId, title: data.title.trim(), body: data.body.trim() })
      .select()
      .single();
    if (error || !row) {
      console.warn("[profile] addCoverLetterTemplate failed:", error?.message);
      return;
    }
    set((state) => ({ coverLetterTemplates: [mapCoverLetterRow(row), ...state.coverLetterTemplates] }));
  },

  updateCoverLetterTemplate: async (id, data) => {
    const { error } = await supabase
      .from("cover_letter_templates")
      .update({ title: data.title.trim(), body: data.body.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.warn("[profile] updateCoverLetterTemplate failed:", error.message);
      return;
    }
    set((state) => ({
      coverLetterTemplates: state.coverLetterTemplates.map((t) =>
        t.id === id ? { ...t, title: data.title.trim(), body: data.body.trim(), updatedAt: new Date() } : t,
      ),
    }));
  },

  deleteCoverLetterTemplate: async (id) => {
    const { error } = await supabase.from("cover_letter_templates").delete().eq("id", id);
    if (error) {
      console.warn("[profile] deleteCoverLetterTemplate failed:", error.message);
      return;
    }
    set((state) => ({ coverLetterTemplates: state.coverLetterTemplates.filter((t) => t.id !== id) }));
  },

  addPriceTemplate: async (facilityId, title, fileName, csvText) => {
    const items = parseCsv(csvText);
    const { data: templateRow, error: templateError } = await supabase
      .from("price_templates")
      .insert({ facility_id: facilityId, title: title.trim(), file_name: fileName })
      .select()
      .single();
    if (templateError || !templateRow) {
      console.warn("[profile] addPriceTemplate failed:", templateError?.message);
      return;
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("price_template_items")
        .insert(items.map((item) => ({ price_template_id: templateRow.id, product: item.product, rate: item.rate, unit: item.unit ?? null })));
      if (itemsError) {
        console.warn("[profile] addPriceTemplate (items) failed:", itemsError.message);
      }
    }

    const template: PriceTemplate = {
      id: templateRow.id,
      facilityId,
      title: title.trim(),
      fileName,
      uploadedAt: new Date(templateRow.uploaded_at),
      items: items.map((item, i) => ({ id: `pending-${i}`, ...item })),
    };
    set((state) => ({ priceTemplates: [template, ...state.priceTemplates] }));
  },

  deletePriceTemplate: async (id) => {
    const { error } = await supabase.from("price_templates").delete().eq("id", id);
    if (error) {
      console.warn("[profile] deletePriceTemplate failed:", error.message);
      return;
    }
    set((state) => ({ priceTemplates: state.priceTemplates.filter((t) => t.id !== id) }));
  },
}));
