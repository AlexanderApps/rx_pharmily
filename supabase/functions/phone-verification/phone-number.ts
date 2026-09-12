// Requires the `libphonenumber-js` npm package to be resolvable via
// Deno's npm: specifier — no separate install step needed for Edge
// Functions specifically (Deno resolves npm: imports directly at
// deploy time), but this is a genuinely different runtime from the
// React Native app, so this file is NOT shared with
// shared/utils/phone-number.ts on the client side. Keep both in sync
// by hand if the validation rules here ever change.
import { parsePhoneNumberFromString } from "npm:libphonenumber-js@1.11.15";

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

// Rejects landlines specifically, per Prelude's own error catalog
// (reason: invalid_phone_line covers exactly this: "The phone number
// is not a valid line number (e.g. landline)"). FIXED_LINE_OR_MOBILE is
// deliberately allowed through, not rejected — for several countries'
// numbering plans (including ranges in Ghana's own), libphonenumber's
// metadata genuinely cannot distinguish mobile from landline from the
// number alone; treating that ambiguous case as landline would
// incorrectly block real mobile numbers, which is worse than
// occasionally letting an actual landline through to Prelude's own
// (more authoritative, carrier-level) check.
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
