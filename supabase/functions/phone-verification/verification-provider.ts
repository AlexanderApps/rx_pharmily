import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { OtpCodeRow, PhoneVerificationEntityType } from "./types.ts";

// The abstraction this function is built around changed shape once
// Prelude entered the picture. The original design (see git history /
// the old sms-provider.ts) assumed every provider was a plain "send
// this text message" API — true for raw SMS APIs, but not true for
// Prelude (or Twilio Verify, for that matter): Prelude's Verify product
// generates its own OTP code, sends it, AND validates it against its
// own record — there's no way to hand it a pre-generated code and have
// it just deliver the text. So this interface now models "manage an
// entire verification," not "send a message" — each provider owns
// start() (generate + send, or delegate that fully to a managed
// provider) and check() (validate, against whichever system actually
// holds the code) as one unit.
//
// This is *why* the app's own OTP logic (rate limiting, attempt
// counting, ownership checks) stays in handlers.ts, deliberately
// outside any single provider: those concerns protect this app's own
// endpoint from abuse regardless of which provider is actually
// generating/validating the code, so they shouldn't have to be
// reimplemented inside every provider that gets added later.

export interface StartVerificationResult {
  ok: boolean;
  error?: string;
  // Only ever populated by the dummy provider — see its own comment.
  devCode?: string;
}

export interface CheckVerificationResult {
  ok: boolean;
  // Distinct from `ok`: `ok: false` means the check request itself
  // failed (network/provider error); `ok: true, valid: false` means
  // the request succeeded and the code was simply wrong.
  valid: boolean;
  error?: string;
}

export interface VerificationProvider {
  start(phone: string): Promise<StartVerificationResult>;
  check(phone: string, code: string): Promise<CheckVerificationResult>;
}

// Self-contained: generates and stores its own code in phone_otp_codes,
// exactly like the app's own logic did before Prelude entered the
// picture — this is what lets local/dev testing work without any real
// provider account, same as before. Needs its own Supabase client since
// (unlike a real provider) it has to persist state between start() and
// check() itself.
export class DummyVerificationProvider implements VerificationProvider {
  constructor(
    private supabaseAdmin: SupabaseClient,
    private entityType: PhoneVerificationEntityType,
    private entityId: string,
  ) {}

  async start(phone: string): Promise<StartVerificationResult> {
    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await this.supabaseAdmin.from("phone_otp_codes").insert({
      entity_type: this.entityType,
      entity_id: this.entityId,
      phone,
      code_hash: codeHash,
      max_attempts: 5,
      expires_at: expiresAt,
    });
    if (error) return { ok: false, error: error.message };

    console.log(`[verification-provider:dummy] would send to ${phone}: "Your verification code is ${code}."`);
    // The one deliberate exception to never returning the code — see
    // handlers.ts's own comment on why this is safe here specifically.
    return { ok: true, devCode: code };
  }

  async check(phone: string, code: string): Promise<CheckVerificationResult> {
    const { data: candidate, error: fetchError } = await this.supabaseAdmin
      .from("phone_otp_codes")
      .select("*")
      .eq("entity_type", this.entityType)
      .eq("entity_id", this.entityId)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fetchError) return { ok: false, valid: false, error: fetchError.message };
    const otpRow = candidate as OtpCodeRow | null;
    if (!otpRow) return { ok: true, valid: false, error: "No active verification code — request a new one" };
    if (otpRow.attempts >= otpRow.max_attempts) {
      return { ok: true, valid: false, error: "Too many incorrect attempts — request a new code" };
    }

    const providedHash = await hashCode(code.trim());
    if (providedHash !== otpRow.code_hash) {
      await this.supabaseAdmin
        .from("phone_otp_codes")
        .update({ attempts: otpRow.attempts + 1 })
        .eq("id", otpRow.id);
      const remaining = otpRow.max_attempts - (otpRow.attempts + 1);
      return {
        ok: true,
        valid: false,
        error: remaining > 0 ? `Incorrect code — ${remaining} attempt(s) left` : "Incorrect code — request a new one",
      };
    }

    await this.supabaseAdmin
      .from("phone_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);
    return { ok: true, valid: true };
  }
}

// https://docs.prelude.so/verify/v2 — Prelude owns the entire OTP
// lifecycle: it generates the code, sends it, and validates it against
// its own record. This class is a thin wrapper over their v2 REST API,
// not a reimplementation of anything — there is deliberately no local
// OTP storage here, since Prelude's /verification/check endpoint is the
// actual source of truth for "was this code correct."
export class PreludeVerificationProvider implements VerificationProvider {
  private readonly baseUrl = "https://api.prelude.dev/v2";

  constructor(private apiToken: string) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  async start(phone: string): Promise<StartVerificationResult> {
    // Prelude requires E.164 (e.g. +233241234567) — this function
    // trusts the caller to have already normalized it (see this app's
    // own README note on phone number format validation being an
    // existing, separate gap); Prelude's own API returns a clear
    // invalid_phone_number error otherwise, surfaced below rather than
    // silently mishandled.
    const response = await fetch(`${this.baseUrl}/verification`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ target: { type: "phone_number", value: phone } }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: `Prelude verification create failed: ${response.status} ${body}` };
    }
    return { ok: true };
  }

  async check(phone: string, code: string): Promise<CheckVerificationResult> {
    const response = await fetch(`${this.baseUrl}/verification/check`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ target: { type: "phone_number", value: phone }, code }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false, valid: false, error: `Prelude verification check failed: ${response.status} ${body}` };
    }
    const data = await response.json();
    // Per Prelude's own CheckVerificationResponse schema: status is one
    // of success | failure | expired_or_not_found | transaction_missing
    // | transaction_mismatch. Only "success" means the code was
    // actually correct — everything else is a valid HTTP response
    // reporting an invalid/expired code, not a request failure.
    if (data.status === "success") return { ok: true, valid: true };
    return { ok: true, valid: false, error: preludeStatusToMessage(data.status) };
  }
}

function preludeStatusToMessage(status: string): string {
  switch (status) {
    case "expired_or_not_found":
      return "That code has expired — request a new one";
    case "failure":
      return "Incorrect code";
    default:
      return "Couldn't verify that code";
  }
}

function generateCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const code = bytes[0] % 1_000_000;
  return code.toString().padStart(6, "0");
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getVerificationProvider(
  supabaseAdmin: SupabaseClient,
  entityType: PhoneVerificationEntityType,
  entityId: string,
): { provider: VerificationProvider; isDummy: boolean } {
  const providerName = (Deno.env.get("VERIFICATION_PROVIDER") ?? "dummy").toLowerCase();
  switch (providerName) {
    case "prelude": {
      const apiToken = Deno.env.get("PRELUDE_API_TOKEN");
      if (!apiToken) {
        console.warn("[verification-provider] PRELUDE_API_TOKEN not set, falling back to dummy");
        return { provider: new DummyVerificationProvider(supabaseAdmin, entityType, entityId), isDummy: true };
      }
      return { provider: new PreludeVerificationProvider(apiToken), isDummy: false };
    }
    case "dummy":
      return { provider: new DummyVerificationProvider(supabaseAdmin, entityType, entityId), isDummy: true };
    default:
      console.warn(`[verification-provider] unknown VERIFICATION_PROVIDER "${providerName}", falling back to dummy`);
      return { provider: new DummyVerificationProvider(supabaseAdmin, entityType, entityId), isDummy: true };
  }
}
