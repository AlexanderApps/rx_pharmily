import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { AuthProfile, Session, SignUpFormData, User, isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

// Bridges the real signed-in identity into the app's existing (still
// mock-data) profile store, so screens built against useProfileStore —
// My Profile, KYC display, the account menu — keep reflecting whoever is
// actually logged in. This does NOT migrate the rest of the app's data
// (facilities, RxRFQs, etc.) onto Supabase; that's a separate, larger
// project. It only keeps the *identity* layer honest.
function applyProfileToStore(profile: AuthProfile) {
  useProfileStore.setState((state) => ({
    user: {
      ...state.user,
      fullName: profile.fullName,
      email: profile.email,
      role: isAdminRole(profile.accountRole) ? "Facility Admin" : "Pharmacist",
      kyc: {
        ...state.user.kyc,
        status: profile.kycStatus,
      },
    },
  }));
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, account_role, kyc_status")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.warn("Failed to load profile:", error?.message);
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    accountRole: data.account_role,
    kycStatus: data.kyc_status,
  };
}

type AuthStore = {
  // isLoading is true only for the initial "is there already a session"
  // check on cold start — everything after that (sign in, sign out) has
  // its own per-action loading state at the call site instead, so the
  // whole app doesn't re-show a splash on every auth action.
  isLoading: boolean;
  isInitialized: boolean;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (data: SignUpFormData) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  isLoading: true,
  isInitialized: false,
  session: null,
  user: null,
  profile: null,

  initialize: async () => {
    if (get().isInitialized) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const profile = await fetchProfile(session.user.id);
      if (profile) applyProfileToStore(profile);
      set({ session, user: session.user, profile });
    }
    set({ isLoading: false, isInitialized: true });

    // Keeps the store (and the mock profile bridge) in sync with anything
    // that changes the session from outside a direct call here — a token
    // refresh, signing out in another tab on web, etc.
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        const profile = await fetchProfile(newSession.user.id);
        if (profile) applyProfileToStore(profile);
        set({ session: newSession, user: newSession.user, profile });
      } else {
        set({ session: null, user: null, profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) return { ok: false, error: error.message };
    if (!data.session) return { ok: false, error: "Sign in failed — no session returned." };

    const profile = await fetchProfile(data.user.id);
    if (profile) applyProfileToStore(profile);
    set({ session: data.session, user: data.user, profile });
    return { ok: true };
  },

  signUp: async ({ fullName, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error) return { ok: false, error: error.message };

    // If email confirmation is turned on for this Supabase project, signUp
    // succeeds but returns no session until the user clicks the
    // confirmation link — that's not a failure, just a different next step.
    if (!data.session) {
      return { ok: true, needsEmailConfirmation: true };
    }

    const profile = await fetchProfile(data.user!.id);
    if (profile) applyProfileToStore(profile);
    set({ session: data.session, user: data.user, profile });
    return { ok: true };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  refreshProfile: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    const profile = await fetchProfile(userId);
    if (profile) {
      applyProfileToStore(profile);
      set({ profile });
    }
  },
}));
