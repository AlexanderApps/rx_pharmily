import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { VerificationProvider } from "./verification-provider.ts";
import type { CheckRequestBody, PhoneVerificationEntityType, StartRequestBody } from "./types.ts";
import { checkPhoneNumber } from "./phone-number.ts";

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_REQUESTS_PER_DAY = 5;

const ENTITY_TABLE: Record<PhoneVerificationEntityType, string> = {
  user: "profiles",
  facility: "facilities",
  organization: "organizations",
};

export interface HandlerResult {
  status: number;
  body: { ok: boolean; error?: string };
}

function ok(body: Record<string, unknown> = {}): HandlerResult {
  return { status: 200, body: { ok: true, ...body } };
}

function fail(status: number, error: string): HandlerResult {
  return { status, body: { ok: false, error } };
}

async function isOwner(
  supabaseAdmin: SupabaseClient,
  callerId: string,
  entityType: PhoneVerificationEntityType,
  entityId: string,
): Promise<boolean> {
  // Same ownership rule already established for profile_update_requests
  // (self for a user, facility Owner membership for a facility,
  // admin_user_id for an organization) — deliberately NOT calling the
  // existing is_facility_owner()/can_request_profile_update() DB
  // functions here, since both rely on auth.uid() internally rather
  // than an explicit parameter. Called via this function's service-role
  // client (no per-request user JWT context), auth.uid() would just be
  // null, silently making every ownership check fail. Querying the
  // underlying tables directly with callerId as an explicit filter
  // avoids that trap while keeping the same actual rule.
  if (entityType === "user") return entityId === callerId;

  if (entityType === "facility") {
    const { data, error } = await supabaseAdmin
      .from("facility_memberships")
      .select("user_id")
      .eq("facility_id", entityId)
      .eq("user_id", callerId)
      .eq("role", "Owner")
      .maybeSingle();
    if (error) {
      console.error("[phone-verification] facility ownership check failed:", error.message);
      return false;
    }
    return !!data;
  }

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("admin_user_id")
    .eq("id", entityId)
    .maybeSingle();
  if (error) {
    console.error("[phone-verification] organization ownership check failed:", error.message);
    return false;
  }
  return data?.admin_user_id === callerId;
}

// Rate limiting stays here, provider-agnostic, rather than inside any
// one VerificationProvider — this protects this app's own endpoint
// from abuse regardless of which provider is actually generating/
// sending/validating the code. See the migration's own comment for why
// this is a separate table from phone_otp_codes now.
async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  entityType: PhoneVerificationEntityType,
  entityId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("phone_verification_requests")
    .select("created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .gte("created_at", since24h)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[phone-verification] failed to check rate limit:", error.message);
    return { ok: false, error: "Couldn't check recent verification requests" };
  }

  const recent = data ?? [];
  if (recent.length >= MAX_REQUESTS_PER_DAY) {
    return { ok: false, error: "Too many verification requests today. Please try again tomorrow." };
  }

  const mostRecent = recent[0];
  if (mostRecent) {
    const secondsSinceLast = (Date.now() - new Date(mostRecent.created_at).getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      return { ok: false, error: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code` };
    }
  }

  return { ok: true };
}

export async function handleStart(
  supabaseAdmin: SupabaseClient,
  provider: VerificationProvider,
  isDummyProvider: boolean,
  callerId: string,
  body: StartRequestBody,
): Promise<HandlerResult> {
  const { entityType, entityId } = body;
  if (!entityType || !entityId) {
    return fail(400, "entityType and entityId are required");
  }
  if (!(await isOwner(supabaseAdmin, callerId, entityType, entityId))) {
    return fail(403, "You don't have permission to verify a phone number for this entity");
  }

  // The phone number is deliberately never taken from the request body
  // — re-derived here from the entity's own row instead, same as
  // handleCheck already does. Trusting a client-supplied phone number
  // would mean anyone who owns SOME entity could ask this function to
  // send a (real, paid-for) verification SMS to an arbitrary number
  // that was never even submitted for review, let alone admin-approved.
  // Requiring phone_admin_approved below is what actually protects
  // Prelude spend: a phone value only reaches that state via
  // mergeRequest() (features/profile-updates), so this call can never
  // fire for a number nobody but the entity's own owner and an admin
  // have already agreed on.
  const { data: entityRow, error: entityError } = await supabaseAdmin
    .from(ENTITY_TABLE[entityType])
    .select("phone, phone_admin_approved")
    .eq("id", entityId)
    .maybeSingle();
  if (entityError || !entityRow?.phone) {
    console.error("[phone-verification] failed to resolve phone for start:", entityError?.message);
    return fail(400, "No phone number on file for this entity");
  }
  if (!entityRow.phone_admin_approved) {
    return fail(403, "This phone number hasn't been approved yet — submit or wait on a profile update request first");
  }

  // Checked before rate limiting, deliberately — a malformed or
  // landline number is a data-quality problem, not a "too many
  // requests" one, so it shouldn't cost the entity one of their daily
  // attempts. More importantly, this is what actually prevents a
  // wasted (paid) Prelude call: Prelude would reject an invalid number
  // itself, but only after the request already reached them.
  const phoneCheck = checkPhoneNumber(entityRow.phone);
  if (!phoneCheck.ok) {
    return fail(400, phoneCheck.error ?? "Invalid phone number");
  }
  const phone = phoneCheck.e164!;

  const rateLimit = await checkRateLimit(supabaseAdmin, entityType, entityId);
  if (!rateLimit.ok) return fail(429, rateLimit.error);

  // Logged before the actual provider call, deliberately — this is
  // what makes the cooldown/daily-cap apply to the attempt itself, not
  // just to successful sends, so a person can't bypass rate limiting by
  // repeatedly triggering (and ignoring) provider failures.
  const { error: logError } = await supabaseAdmin.from("phone_verification_requests").insert({
    entity_type: entityType,
    entity_id: entityId,
  });
  if (logError) {
    console.error("[phone-verification] failed to log rate-limit entry:", logError.message);
    return fail(500, "Couldn't start verification");
  }

  const result = await provider.start(phone);
  if (!result.ok) {
    console.error("[phone-verification] provider start failed:", result.error);
    return fail(502, "Couldn't send the verification code. Please try again.");
  }

  // devCode is only ever populated by the dummy provider (there's no
  // real code to leak once a real provider is active) — see
  // DummyVerificationProvider's own comment for the full reasoning.
  return ok(isDummyProvider && result.devCode ? { devCode: result.devCode } : {});
}

export async function handleCheck(
  supabaseAdmin: SupabaseClient,
  provider: VerificationProvider,
  callerId: string,
  body: CheckRequestBody,
): Promise<HandlerResult> {
  const { entityType, entityId, code } = body;
  if (!entityType || !entityId || !code) {
    return fail(400, "entityType, entityId, and code are required");
  }
  if (!(await isOwner(supabaseAdmin, callerId, entityType, entityId))) {
    return fail(403, "You don't have permission to verify a phone number for this entity");
  }

  // The phone number itself isn't in the check request body — providers
  // that need it (Prelude does, for its target; the dummy provider
  // looks it up from its own stored row) resolve it themselves rather
  // than trusting a client-supplied value that could differ from what
  // start() was actually called with. Re-deriving it from the actual
  // entity row here (not from client input) keeps the check consistent
  // with whatever start() actually sent the code to.
  const { data: entityRow, error: entityError } = await supabaseAdmin
    .from(ENTITY_TABLE[entityType])
    .select("phone")
    .eq("id", entityId)
    .maybeSingle();
  if (entityError || !entityRow?.phone) {
    console.error("[phone-verification] failed to resolve phone for check:", entityError?.message);
    return fail(500, "Couldn't verify code");
  }
  // Normalized the same way handleStart's own phone is — this must be
  // the exact same string Prelude was given in the corresponding
  // start() call, or Prelude has no way to know this check refers to
  // that verification at all.
  const phoneCheck = checkPhoneNumber(entityRow.phone);
  if (!phoneCheck.ok) {
    console.error("[phone-verification] stored phone failed re-validation at check time:", phoneCheck.error);
    return fail(500, "Couldn't verify code");
  }
  const phone = phoneCheck.e164!;

  const result = await provider.check(phone, code);
  if (!result.ok) {
    console.error("[phone-verification] provider check failed:", result.error);
    return fail(500, "Couldn't verify code");
  }
  if (!result.valid) {
    return fail(400, result.error ?? "Incorrect code");
  }

  const { error: updateError } = await supabaseAdmin
    .from(ENTITY_TABLE[entityType])
    .update({ phone_verified_at: new Date().toISOString() })
    .eq("id", entityId);
  if (updateError) {
    console.error("[phone-verification] failed to mark phone verified:", updateError.message);
    return fail(500, "Code was correct, but couldn't save verification status");
  }

  return ok();
}
