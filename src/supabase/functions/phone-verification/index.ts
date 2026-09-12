import { createClient } from "npm:@supabase/supabase-js@2";
import { getVerificationProvider } from "./verification-provider.ts";
import { handleCheck, handleStart } from "./handlers.ts";
import type { RequestBody } from "./types.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Required for this function to be callable from a browser at all —
// Supabase Edge Functions do NOT add CORS headers automatically. This
// app runs on web (React Native Web) as well as native, and a browser
// enforces CORS while native apps don't: without this, a web caller's
// preflight OPTIONS request gets a bare, header-less 405 from the
// `req.method !== "POST"` check below, the browser blocks the actual
// POST from ever being sent, and supabase-js reports this as a
// network-level FunctionsFetchError — which looks identical to a
// generic connectivity failure and, critically, is NOT a
// FunctionsHttpError, so the client's own error.context.json()
// extraction path (see use-phone-verification-data.ts) never even
// runs. Every response below goes through jsonResponse() specifically
// so this header can never be accidentally left off any one of them.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Unlike send-push/notify-dispatch (webhooks, authenticated with a
// shared secret set by this project, not by the end user), this
// function is called directly by a signed-in person from the app — so
// it authenticates with their own JWT instead. This client, built with
// the caller's own Authorization header, is used ONLY to confirm who
// they are (auth.getUser()) — every actual read/write against
// phone_otp_codes, phone_verification_requests, and the profiles/
// facilities/organizations tables happens through the service-role
// client below, since none of that is meant to be directly reachable
// by a client-held anon/user key.
Deno.serve(async (req: Request) => {
  // The browser sends this before the real POST whenever the request
  // carries custom headers (Authorization, Content-Type) — which every
  // supabase.functions.invoke() call does. It carries no body and
  // expects only these headers back, not a JSON payload.
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ ok: false, error: "Missing Authorization header" }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ ok: false, error: "Invalid or expired session" }, 401);
  }
  const callerId = userData.user.id;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (!body.entityType || !body.entityId) {
    return jsonResponse({ ok: false, error: "entityType and entityId are required" }, 400);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  // DummyVerificationProvider needs entityType/entityId up front to
  // read/write its own phone_otp_codes rows — a real provider
  // (Prelude) ignores these two arguments entirely, since it has no
  // local storage of its own.
  const { provider, isDummy } = getVerificationProvider(supabaseAdmin, body.entityType, body.entityId);

  try {
    const result =
      body.action === "start"
        ? await handleStart(supabaseAdmin, provider, isDummy, callerId, body)
        : body.action === "check"
          ? await handleCheck(supabaseAdmin, provider, callerId, body)
          : { status: 400, body: { ok: false, error: `Unknown action: ${(body as { action?: string }).action}` } };

    return jsonResponse(result.body, result.status);
  } catch (err) {
    console.error("[phone-verification] unhandled error:", err);
    return jsonResponse({ ok: false, error: "Internal error" }, 500);
  }
});
