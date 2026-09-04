import { Href } from "expo-router";

export interface SearchCommand {
  id: string;
  label: string;
  // Extra words this command should match on beyond its own label —
  // e.g. "RxRFQs" also matching "rfq", "request for quote".
  keywords?: string[];
  category: "Navigate" | "Create" | "Admin";
  icon: string; // MaterialCommunityIcons name
  route: Href;
  // Only shown to admins. Regular users never see these entries at
  // all, even if they somehow typed a matching keyword — this is
  // enforced by filtering the registry itself before search runs, not
  // just hidden by CSS, so there's nothing to discover by inspecting
  // the page.
  adminOnly?: boolean;
}

// Add or remove a command by editing this array — nothing else needs to
// change. Order here is only a tie-breaker for entries with identical
// match relevance; the modal groups by category regardless of registry
// order.
export const SEARCH_COMMANDS: SearchCommand[] = [
  // ─── Navigate ─────────────────────────────────────────────────────
  { id: "nav-home", label: "Home", category: "Navigate", icon: "home-outline", route: "/(tabs)" },
  { id: "nav-community", label: "Community", keywords: ["posts", "feed"], category: "Navigate", icon: "account-group-outline", route: "/posts" },
  { id: "nav-rfqs", label: "RxRFQs", keywords: ["rfq", "request for quote", "marketplace"], category: "Navigate", icon: "file-document-outline", route: "/rfqs" },
  { id: "nav-donations", label: "Donations", category: "Navigate", icon: "heart-outline", route: "/donations" },
  { id: "nav-mediscope", label: "MediScope", keywords: ["mediscope requests"], category: "Navigate", icon: "heart-search", route: "/mediscope" },
  { id: "nav-jobs", label: "RxJobs", keywords: ["jobs", "careers"], category: "Navigate", icon: "office-building-outline", route: "/jobs" },
  { id: "nav-ads", label: "RxAds", keywords: ["ads", "advertising"], category: "Navigate", icon: "bullhorn-outline", route: "/ads" },
  { id: "nav-chat", label: "RxChat", keywords: ["chat", "messages"], category: "Navigate", icon: "chat-outline", route: "/chat" },
  { id: "nav-formulary", label: "Formulary", category: "Navigate", icon: "clipboard-plus-outline", route: "/formulary" },
  { id: "nav-vitals", label: "RxVitals", keywords: ["vitals"], category: "Navigate", icon: "heart-pulse", route: "/vitals" },
  { id: "nav-help", label: "RxHelp", keywords: ["help", "consult", "support"], category: "Navigate", icon: "lifebuoy", route: "/help" },
  { id: "nav-profile", label: "My Profile", keywords: ["account", "settings"], category: "Navigate", icon: "account-outline", route: "/profile" },
  { id: "nav-notifications", label: "Notifications", category: "Navigate", icon: "bell-outline", route: "/notifications" },

  // ─── Create ───────────────────────────────────────────────────────
  { id: "create-ad", label: "Create Ad", keywords: ["new ad", "post ad", "advertise"], category: "Create", icon: "bullhorn-outline", route: "/ads/create-ad" },
  { id: "create-post", label: "Create Post", keywords: ["new post", "share"], category: "Create", icon: "pencil-outline", route: "/posts/create-post" },
  { id: "create-rfq", label: "Create RxRFQ", keywords: ["new rfq", "request for quote"], category: "Create", icon: "file-document-plus-outline", route: "/rfqs/add-rfqs" },
  { id: "create-donation", label: "Post a Donation", keywords: ["new donation", "donate"], category: "Create", icon: "heart-plus-outline", route: "/donations/add-donation" },
  { id: "create-mediscope", label: "Create MediScope Request", keywords: ["new mediscope"], category: "Create", icon: "heart-search", route: "/mediscope/add-mediscope-request" },
  { id: "create-job", label: "Post a Job", keywords: ["new job", "hire"], category: "Create", icon: "briefcase-plus-outline", route: "/jobs/post-job" },

  // ─── Admin ────────────────────────────────────────────────────────
  { id: "admin-hub", label: "Admin Hub", category: "Admin", icon: "shield-crown-outline", route: "/admin", adminOnly: true },
  { id: "admin-ads", label: "Ad Moderation", keywords: ["review ads"], category: "Admin", icon: "bullhorn-outline", route: "/admin/ads-moderation", adminOnly: true },
  { id: "admin-rxlink", label: "RxLink Requests", keywords: ["prescriptions", "medication search"], category: "Admin", icon: "pill", route: "/admin/rxlink-requests", adminOnly: true },
  { id: "admin-kyc", label: "KYC Verification", keywords: ["kyc review", "verify"], category: "Admin", icon: "shield-search", route: "/profile/kyc-review", adminOnly: true },
  { id: "admin-facility-org", label: "Facility & Org Requests", keywords: ["membership requests"], category: "Admin", icon: "domain", route: "/admin/facility-org-requests", adminOnly: true },
  { id: "admin-products", label: "Product Catalog", keywords: ["products"], category: "Admin", icon: "pill", route: "/admin/products", adminOnly: true },
  { id: "admin-formulary", label: "Formulary Requests", category: "Admin", icon: "clipboard-plus-outline", route: "/admin/formulary-requests", adminOnly: true },
  { id: "admin-reference-data", label: "Reference Data", keywords: ["units", "categories", "regions", "incoterms", "currencies"], category: "Admin", icon: "database-outline", route: "/admin/reference-data", adminOnly: true },
  { id: "admin-reports", label: "Reports", keywords: ["bug reports", "flags"], category: "Admin", icon: "flag-outline", route: "/admin/reports", adminOnly: true },
  { id: "admin-posts-moderation", label: "Post Moderation", keywords: ["suspend post", "remove comment"], category: "Admin", icon: "forum-outline", route: "/admin/posts-moderation", adminOnly: true },
  { id: "admin-faq", label: "FAQ Management", category: "Admin", icon: "help-circle-outline", route: "/admin/faq-management", adminOnly: true },
  { id: "admin-payments", label: "Payments", keywords: ["pending payments", "confirm payment"], category: "Admin", icon: "cash-multiple", route: "/admin/payments", adminOnly: true },
  { id: "admin-roles", label: "Role Management", keywords: ["promote", "superadmin"], category: "Admin", icon: "shield-account", route: "/admin/role-management", adminOnly: true },
];
