import { createClient } from "npm:@supabase/supabase-js@2";
import { getVerificationProvider } from "./verification-provider.ts";
import { handleCheck, handleStart } from "./handlers.ts";
import type { RequestBody } from "./types.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Authorization header" }), { status: 401 });
  }

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid or expired session" }), { status: 401 });
  }
  const callerId = userData.user.id;

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), { status: 400 });
  }

  if (!body.entityType || !body.entityId) {
    return new Response(JSON.stringify({ ok: false, error: "entityType and entityId are required" }), { status: 400 });
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

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[phone-verification] unhandled error:", err);
    return new Response(JSON.stringify({ ok: false, error: "Internal error" }), { status: 500 });
  }
});
