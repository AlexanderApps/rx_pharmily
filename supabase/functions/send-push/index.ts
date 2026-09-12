import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import type { WebhookPayload, PushSubscriptionRow } from "./types.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_CONTACT_EMAIL = Deno.env.get("VAPID_CONTACT_EMAIL"); // any real mailto:, required by the Web Push spec so a push service can contact you if something's misbehaving

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_CONTACT_EMAIL) {
  webpush.setVapidDetails(`mailto:${VAPID_CONTACT_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Same shared-secret check as notify-dispatch — see that function's
// index.ts for the full reasoning. Set independently (a different
// secret is fine and arguably better — a leak of one doesn't also
// compromise the other), via `supabase secrets set PUSH_WEBHOOK_SECRET=...`.
const WEBHOOK_SECRET = Deno.env.get("PUSH_WEBHOOK_SECRET");

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, unknown>) {
  if (tokens.length === 0) return;
  const messages = tokens.map((to) => ({ to, title, body, data, sound: "default" }));

  // Expo's push API accepts up to 100 messages per request — this
  // app's per-user device count won't realistically approach that, so
  // one request per notification event is enough; chunking would only
  // matter for a genuinely large fan-out sent as a single push call,
  // which isn't what's happening here (each user's own devices, not a
  // broadcast list, go in one request).
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    console.error("[send-push] Expo push API request failed:", response.status, await response.text());
    return;
  }

  const result = await response.json();
  // Expo returns one ticket per message, in the same order — an
  // individual ticket can report DeviceNotRegistered even when the
  // overall HTTP request succeeded (e.g. the app was uninstalled since
  // the token was saved). Worth logging per-ticket, not just the
  // request-level status, or a stale token silently keeps "succeeding"
  // at the HTTP layer forever while never actually reaching anyone.
  (result.data ?? []).forEach((ticket: any, i: number) => {
    if (ticket.status === "error") {
      console.warn(`[send-push] Expo ticket error for token ${tokens[i]}:`, ticket.message, ticket.details);
    }
  });
}

async function sendWebPush(subscriptions: PushSubscriptionRow[], title: string, body: string, data: Record<string, unknown>) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_CONTACT_EMAIL) {
    if (subscriptions.length > 0) {
      console.warn(
        "[send-push] web push subscriptions exist for this recipient but VAPID_PUBLIC_KEY / " +
          "VAPID_PRIVATE_KEY / VAPID_CONTACT_EMAIL aren't all set — skipping web push. See this " +
          "function's README.md.",
      );
    }
    return;
  }

  const payload = JSON.stringify({ title, body, data });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.web_endpoint!, keys: { p256dh: sub.web_p256dh!, auth: sub.web_auth! } },
          payload,
        );
      } catch (err: any) {
        // 404/410 specifically mean the browser has permanently
        // invalidated this subscription (user cleared site data,
        // uninstalled, etc.) — the row is now dead weight, not just a
        // transient failure, so it's removed rather than left to fail
        // forever on every future notification.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          console.log(`[send-push] web push subscription ${sub.id} is gone (${err.statusCode}), removing it`);
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error(`[send-push] web push failed for subscription ${sub.id}:`, err?.message ?? err);
        }
      }
    }),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== WEBHOOK_SECRET) {
      console.warn("[send-push] rejected request: missing or wrong x-webhook-secret header");
      return new Response("Unauthorized", { status: 401 });
    }
  } else {
    console.warn("[send-push] PUSH_WEBHOOK_SECRET is not set — this endpoint is unauthenticated");
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    if (payload.type === "INSERT" && payload.table === "notifications" && payload.record) {
      const notification = payload.record;

      const { data: subscriptions, error } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", notification.user_id);
      if (error) {
        console.error("[send-push] push_subscriptions lookup failed:", error);
      } else {
        const rows = (subscriptions ?? []) as PushSubscriptionRow[];
        const expoTokens = rows.filter((r) => r.expo_push_token).map((r) => r.expo_push_token!);
        const webSubs = rows.filter((r) => r.platform === "web");

        const data = {
          category: notification.category,
          link_pathname: notification.link_pathname,
          link_params: notification.link_params,
        };

        await Promise.all([
          sendExpoPush(expoTokens, notification.title, notification.body, data),
          sendWebPush(webSubs, notification.title, notification.body, data),
        ]);
      }
    }
  } catch (err) {
    // Same reasoning as notify-dispatch: logged, not re-thrown as a
    // 500 — the notifications row this was reacting to already
    // committed either way, and a missed push is a smaller problem
    // than the endpoint looking "down" to Supabase's webhook retries.
    console.error("[send-push] dispatch threw:", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
