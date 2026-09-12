import { create } from "zustand";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type PhoneVerificationEntityType = "user" | "facility" | "organization";

interface ActionResult {
  ok: boolean;
  error?: string;
  // Only ever present when the dummy verification provider is active —
  // see verification-provider.ts's DummyVerificationProvider for the
  // full reasoning. Never populated once a real provider (Prelude) is
  // configured.
  devCode?: string;
}

interface PhoneVerificationState {
  isRequesting: boolean;
  isVerifying: boolean;
  requestCode: (entityType: PhoneVerificationEntityType, entityId: string) => Promise<ActionResult>;
  verifyCode: (entityType: PhoneVerificationEntityType, entityId: string, code: string) => Promise<ActionResult>;
}

// supabase-js treats ANY non-2xx response from an Edge Function as a
// generic error and discards the response body from `data` entirely —
// it does NOT read the function's own JSON payload for a non-2xx
// response the way it does for a 2xx one. Without this, every specific,
// deliberately-crafted error this function returns (rate limited, not
// yet admin-approved, provider failure, ownership denied — see
// handlers.ts's fail() calls) would be invisible, collapsed into the
// same generic "Edge Function returned a non-2xx status code" message
// regardless of which one actually happened. FunctionsHttpError's own
// `.context` is the raw Response object; reading it ourselves is the
// documented, only way to recover the actual error body.
async function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
    } catch (parseError) {
      console.warn("[phone-verification] failed to parse error response body:", parseError);
    }
  }
  return fallback;
}

// supabase.functions.invoke automatically attaches the current
// session's Authorization header — this is exactly what
// phone-verification/index.ts uses to establish caller identity, no
// separate token-passing needed here.
export const usePhoneVerificationStore = create<PhoneVerificationState>((set) => ({
  isRequesting: false,
  isVerifying: false,

  requestCode: async (entityType, entityId) => {
    set({ isRequesting: true });
    const { data, error } = await supabase.functions.invoke("phone-verification", {
      body: { action: "start", entityType, entityId },
    });
    set({ isRequesting: false });

    if (error) {
      const message = await extractErrorMessage(error, "Couldn't send a verification code. Please try again.");
      console.warn("[phone-verification] requestCode failed:", message);
      return { ok: false, error: message };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error ?? "Couldn't send a verification code." };
    }
    return { ok: true, devCode: data?.devCode };
  },

  verifyCode: async (entityType, entityId, code) => {
    set({ isVerifying: true });
    const { data, error } = await supabase.functions.invoke("phone-verification", {
      body: { action: "check", entityType, entityId, code },
    });
    set({ isVerifying: false });

    if (error) {
      const message = await extractErrorMessage(error, "Couldn't verify that code. Please try again.");
      console.warn("[phone-verification] verifyCode failed:", message);
      return { ok: false, error: message };
    }
    if (!data?.ok) {
      return { ok: false, error: data?.error ?? "Incorrect code." };
    }
    return { ok: true };
  },
}));
