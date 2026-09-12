// The only thing that differs between SMS providers (Twilio, Africa's
// Talking, Hubtel, mNotify, ...) as far as this function is concerned:
// "send this text to this phone number." Every other piece of phone
// verification logic — code generation, hashing, expiry, attempt
// limiting, rate limiting — lives in handlers.ts and never touches this
// file. Switching providers later means writing one new class here and
// flipping the SMS_PROVIDER env var; nothing else in this function
// changes.

export interface SmsSendResult {
  ok: boolean;
  error?: string;
}

export interface SmsProvider {
  send(phone: string, message: string): Promise<SmsSendResult>;
}

// Logs instead of actually sending — lets the rest of the verification
// flow (generation, storage, expiry, attempt limiting, the client UI)
// be built and tested end-to-end without a real SMS account configured
// yet. Deliberately does NOT return the code anywhere in its result —
// only ever logs it — so a real provider swap can't accidentally leave
// behind a code leaking back to the client, which would defeat the
// whole point of verifying phone ownership.
class DummySmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<SmsSendResult> {
    console.log(`[sms-provider:dummy] would send to ${phone}: "${message}"`);
    return { ok: true };
  }
}

// Not wired up by default — SMS_PROVIDER must be explicitly set to
// "twilio" to use this, so this file can be committed with a real
// implementation filled in without silently going live before
// credentials are actually configured in this function's secrets.
class TwilioSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<SmsSendResult> {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
    if (!accountSid || !authToken || !fromNumber) {
      return { ok: false, error: "Twilio credentials not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER)" };
    }

    // TODO: fill in once Twilio (or whichever provider is actually
    // chosen) is ready to integrate. Left as a real HTTP call shape
    // rather than a bare throw, so wiring this up later is a matter of
    // uncommenting and testing, not designing from scratch.
    //
    // const response = await fetch(
    //   `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({ To: phone, From: fromNumber, Body: message }),
    //   },
    // );
    // if (!response.ok) {
    //   return { ok: false, error: `Twilio request failed: ${response.status} ${await response.text()}` };
    // }
    // return { ok: true };

    return { ok: false, error: "TwilioSmsProvider is a stub — not yet implemented" };
  }
}

export function getSmsProvider(): { provider: SmsProvider; isDummy: boolean } {
  const providerName = (Deno.env.get("SMS_PROVIDER") ?? "dummy").toLowerCase();
  switch (providerName) {
    case "twilio":
      return { provider: new TwilioSmsProvider(), isDummy: false };
    case "dummy":
      return { provider: new DummySmsProvider(), isDummy: true };
    default:
      console.warn(`[sms-provider] unknown SMS_PROVIDER "${providerName}", falling back to dummy`);
      return { provider: new DummySmsProvider(), isDummy: true };
  }
}
