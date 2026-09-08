// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";
import type { NotificationCategory, NotificationLink } from "./types.ts";

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
// into every Edge Function's environment by Supabase — no manual
// `supabase secrets set` needed for these two specifically. The service
// role key bypasses RLS entirely, which is correct and safe here: this
// code runs server-side with no end-user input reaching it directly
// (the trigger is a DB webhook, not a client request), so there's no
// equivalent of "insert only for yourself" to enforce.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export { supabaseAdmin };

/**
 * Insert a notification for exactly one recipient. Mirrors the client
 * store's addNotification — including the same "don't notify someone
 * about their own action" guard, since a webhook firing on an update a
 * user made to their own row (e.g. self-service edits) should stay
 * silent the same way the client-side version always did.
 */
export async function insertNotification(
  recipientId: string,
  actingUserId: string | null,
  category: NotificationCategory,
  title: string,
  body: string,
  link?: NotificationLink,
): Promise<void> {
  if (actingUserId && recipientId === actingUserId) {
    console.log(`[notify-dispatch] insertNotification(${category}): skipped, recipient is the acting user`);
    return;
  }
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: recipientId,
    category,
    title,
    body,
    link_pathname: link?.pathname ?? null,
    link_params: link?.params ?? null,
  });
  if (error) {
    console.error(`[notify-dispatch] insertNotification(${category}) failed:`, error);
  } else {
    console.log(`[notify-dispatch] insertNotification(${category}): sent to ${recipientId}`);
  }
}

/**
 * Insert a notification for every profile that's explicitly opted into
 * this category — mirrors the client store's addBroadcastNotification,
 * including the same reasoning: every "_new_entry" category defaults to
 * OFF, so a missing notification_settings row correctly excludes that
 * user rather than including them.
 */
export async function insertBroadcastNotification(
  actingUserId: string | null,
  category: NotificationCategory,
  title: string,
  body: string,
  link?: NotificationLink,
  options?: { adminOnly?: boolean },
): Promise<void> {
  const { data: settingsRows, error: settingsError } = await supabaseAdmin
    .from("notification_settings")
    .select("user_id")
    .eq("category", category)
    .eq("enabled", true);
  if (settingsError) {
    console.error(`[notify-dispatch] insertBroadcastNotification(${category}) settings lookup failed:`, settingsError);
    return;
  }

  const optedInIds = (settingsRows ?? []).map((r: any) => r.user_id as string);
  let recipientIds = actingUserId ? optedInIds.filter((id) => id !== actingUserId) : optedInIds;
  if (recipientIds.length === 0) {
    console.log(`[notify-dispatch] insertBroadcastNotification(${category}): 0 recipients`);
    return;
  }

  if (options?.adminOnly) {
    const { data: adminRows, error: adminError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .in("account_role", ["admin", "superadmin"])
      .in("id", recipientIds);
    if (adminError) {
      console.error(`[notify-dispatch] insertBroadcastNotification(${category}) admin lookup failed:`, adminError);
      return;
    }
    const adminIds = new Set((adminRows ?? []).map((r: any) => r.id as string));
    recipientIds = recipientIds.filter((id) => adminIds.has(id));
    if (recipientIds.length === 0) {
      console.log(`[notify-dispatch] insertBroadcastNotification(${category}): 0 recipients after admin-only filter`);
      return;
    }
  }

  const { error: insertError } = await supabaseAdmin.from("notifications").insert(
    recipientIds.map((userId) => ({
      user_id: userId,
      category,
      title,
      body,
      link_pathname: link?.pathname ?? null,
      link_params: link?.params ?? null,
    })),
  );
  if (insertError) {
    console.error(`[notify-dispatch] insertBroadcastNotification(${category}) insert failed:`, insertError);
  } else {
    console.log(`[notify-dispatch] insertBroadcastNotification(${category}): sent to ${recipientIds.length} recipient(s)`);
  }
}
