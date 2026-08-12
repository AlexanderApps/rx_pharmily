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
export async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user.id;
}
