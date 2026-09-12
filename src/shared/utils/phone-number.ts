import { parsePhoneNumberFromString } from "libphonenumber-js";

export interface PhoneCheckResult {
  ok: boolean;
  // Normalized E.164 form, only present when ok is true.
  e164?: string;
  error?: string;
}

// Ghana-focused app — numbers without an explicit country code are
// assumed local. A number that already includes a country code (e.g.
// "+1..." for a diaspora user) is parsed as given, not forced into GH.
const DEFAULT_COUNTRY = "GH";

// Rejects landlines specifically — mirrors the same rule enforced
// server-side (supabase/functions/phone-verification/phone-number.ts)
// so a person gets this feedback immediately when entering a number,
// rather than only after submitting a profile update request that an
// admin later approves, only for verification to then fail. Kept in
// sync by hand with that file's own reasoning on FIXED_LINE_OR_MOBILE
// being allowed through rather than rejected.
export function checkPhoneNumber(raw: string): PhoneCheckResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Phone number is required" };

  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_COUNTRY);
  if (!parsed || !parsed.isValid()) {
    return { ok: false, error: "That doesn't look like a valid phone number" };
  }

  const type = parsed.getType();
  if (type === "FIXED_LINE") {
    return { ok: false, error: "Landline numbers can't receive SMS/WhatsApp codes — enter a mobile number" };
  }

  return { ok: true, e164: parsed.number };
}
