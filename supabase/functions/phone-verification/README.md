# phone-verification — attribute verification for phone numbers

Confirms that the phone number already stored on a `profiles`,
`facilities`, or `organizations` row actually belongs to whoever's
requesting verification. This is **not** a sign-in method — it's a
standalone, optional-anytime action reachable from the phone field on
the user/facility/organization profile screens, independent of KYC.

Called directly by a signed-in person from the app (not a database
webhook like `send-push`/`notify-dispatch`), so it authenticates with
their own session JWT rather than a shared secret. See `index.ts`'s own
comment for exactly how that split works against the service-role
client used for the actual privileged writes.

## Why this isn't a "send SMS" abstraction

The very first version of this function assumed every provider was a
plain "send this text message" API. That's true for a raw SMS API, but
**not** true for Prelude (or Twilio Verify, for that matter) — Prelude's
Verify product generates its own OTP code, sends it, and validates it
against its own record. There's no way to hand it a pre-generated code
and have it just deliver the text; `POST /v2/verification` and
`POST /v2/verification/check` are the actual integration points, and
Prelude owns everything in between.

So `verification-provider.ts` models "manage an entire verification"
(`start(phone)` / `check(phone, code)`), not "send a message." Switching
providers again later means writing one new class implementing
`VerificationProvider` — nothing in `handlers.ts` or `index.ts` needs to
change, since ownership checks and rate limiting live there,
deliberately outside any one provider (see `handlers.ts`'s own comment).

## Providers

- **`DummyVerificationProvider`** (default, `VERIFICATION_PROVIDER`
  unset or `"dummy"`) — self-contained: generates its own code, stores
  it (hashed) in `phone_otp_codes`, and validates against that on
  `check()`. This is what lets the whole flow be built and tested
  end-to-end without any real provider account. As a convenience
  specific to this path, `handleStart` includes the code in its
  response — the app auto-fills it and shows a "Dev mode" banner. A real
  provider's code path never reaches this branch; there's no real SMS
  to leak in the dummy case since none is actually sent.
- **`PreludeVerificationProvider`** (`VERIFICATION_PROVIDER=prelude`) —
  a thin wrapper over Prelude's [Verify v2 API](https://docs.prelude.so/verify/v2).
  No local OTP storage on this side at all; Prelude's own
  `/verification/check` response is the actual source of truth for
  whether a code was correct.

## Deploy and configure

```bash
supabase functions deploy phone-verification
supabase db push   # applies both phone-verification migrations
```

Dummy provider (default, no further setup needed):

```bash
supabase secrets set VERIFICATION_PROVIDER=dummy
```

Prelude:

```bash
supabase secrets set VERIFICATION_PROVIDER=prelude
supabase secrets set PRELUDE_API_TOKEN=...
```

Get the API token from the [Prelude dashboard](https://app.prelude.so/).
If `VERIFICATION_PROVIDER=prelude` is set but `PRELUDE_API_TOKEN` isn't,
this function logs a warning and falls back to the dummy provider
rather than failing outright — see `getVerificationProvider` in
`verification-provider.ts`.

## Phone number format

Prelude requires [E.164](https://en.wikipedia.org/wiki/E.164) format
(e.g. `+233241234567`). This function trusts the caller to have already
normalized the number — there's no normalization step here. Prelude's
own API returns a clear `invalid_phone_number` error otherwise, which
is surfaced as a "couldn't send" error rather than silently mishandled,
but it's still worth normalizing on the client (e.g. via
`libphonenumber-js`) before this function is ever called, so people get
that feedback immediately rather than after a round trip.

## Verify

```bash
supabase functions logs phone-verification
```

**Dummy provider**: request a code from the app (Phone field →
"Verify Now" on any of the 3 profile screens) — the app shows a
"Dev mode — no real SMS sent" banner and auto-fills the code input, so
the full round trip (including `phone_verified_at` actually updating)
can be tested by just tapping "Verify." The code is also logged
server-side if you want to confirm it there too.

**Prelude**: with `VERIFICATION_PROVIDER=prelude` and a valid
`PRELUDE_API_TOKEN` set, request a code from the same screen — this
sends a real SMS via Prelude to the phone number on the profile. No
auto-fill or dev banner in this path (there's no code on this side to
show); enter whatever code actually arrives by SMS.

## What's NOT handled yet

- **Phone number format validation/normalization** — see "Phone number
  format" above. Worth adding E.164 normalization client-side before
  relying on this in production with a real provider.
- **Retry/backoff for failed provider calls.** A failed `start()` or
  `check()` is returned to the client as an error (they can just tap
  "resend" or re-enter the code), not automatically retried
  server-side.
- **Prelude's Silent Verification / device-signal features.** This
  function only integrates with Prelude's server-side Verify REST API
  (`/v2/verification`, `/v2/verification/check`) — it does not use
  Prelude's client-side React Native SDK for device signal collection
  or silent (no-OTP) verification. That's a meaningfully bigger
  integration (native module install, signal dispatch from the client,
  a `dispatchId` round trip before verification even starts) that
  wasn't part of what was asked for here. Worth a dedicated pass later
  if silent verification specifically is wanted.
