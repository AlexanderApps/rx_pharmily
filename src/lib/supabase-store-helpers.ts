import { supabase } from "@/lib/supabase";

// Every store's fetch/mutate actions wrap their Supabase call in this so
// errors show up consistently (console + a returned {ok, error} shape)
// instead of each store inventing its own error handling.
export async function withSupabase<T>(
  label: string,
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`[supabase] ${label} failed:`, error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn(`[supabase] ${label} threw:`, message);
    return { ok: false, error: message };
  }
}

// Most insert/update actions need "who's doing this" — throws clearly
// rather than silently writing a null created_by/user_id if someone calls
// a mutation while signed out (shouldn't happen behind the auth gate, but
// cheap to guard).
//
// Uses getSession() rather than getUser() deliberately: getUser() makes a
// fresh network round-trip that revalidates the JWT against the server on
// every single call, while getSession() just reads the locally cached
// session — the same source features/auth/hooks/use-auth-data.ts's own
// session state comes from. Using getUser() here meant this helper could
// momentarily disagree with the session every screen already treats as
// valid (most visibly during rapid sign-in/sign-out switching, e.g.
// testing with multiple accounts back to back), throwing "Not signed in"
// even though the app's own auth state said otherwise.
export async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not signed in.");
  return session.user.id;
}
