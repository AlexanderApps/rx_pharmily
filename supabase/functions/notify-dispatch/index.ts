import { dispatch } from "./handlers.ts";
import type { WebhookPayload } from "./types.ts";

// Database Webhooks can be configured to send a custom HTTP header —
// this checks it against a secret set via `supabase secrets set`, so
// this endpoint can't be triggered by an arbitrary POST from outside
// Supabase. Without this, anyone who found this function's URL could
// insert fake notifications for any user (the service role key inside
// helpers.ts bypasses RLS by design, which makes this check the only
// thing standing between "internal webhook" and "public write access").
const WEBHOOK_SECRET = Deno.env.get("NOTIFY_WEBHOOK_SECRET");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== WEBHOOK_SECRET) {
      console.warn("[notify-dispatch] rejected request: missing or wrong x-webhook-secret header");
      return new Response("Unauthorized", { status: 401 });
    }
  } else {
    // Not fatal — the function still works — but worth surfacing
    // loudly, since running without this means the endpoint is
    // unauthenticated. See README.md's setup steps to add it.
    console.warn("[notify-dispatch] NOTIFY_WEBHOOK_SECRET is not set — this endpoint is unauthenticated");
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    await dispatch(payload);
  } catch (err) {
    // Logged, not re-thrown as a 500 — a webhook delivery failure on
    // Supabase's side would otherwise retry, and a bug in one
    // notification's logic shouldn't look like the whole endpoint is
    // down. The underlying database change this was reacting to has
    // already committed either way; a missed notification is a much
    // smaller problem than that.
    console.error("[notify-dispatch] dispatch threw:", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
