import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";

// The public half of a VAPID key pair — safe to ship client-side (it's
// how the browser's push service verifies pushes really came from this
// app's server, not a secret in the sense the matching PRIVATE key is).
// Generate the pair once, e.g. via `npx web-push generate-vapid-keys`,
// then:
//   - public key  → EXPO_PUBLIC_VAPID_PUBLIC_KEY in .env (read here)
//   - private key → `supabase secrets set VAPID_PRIVATE_KEY=...` for
//     the Edge Function that actually sends pushes (see send-push/
//     README.md) — never in .env, never client-visible.
const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

// PushManager.subscribe() requires the application server key as a raw
// Uint8Array, not the base64url string form VAPID keys are normally
// generated/shared in — this is the standard conversion every Web Push
// integration needs, not something specific to this app.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerForWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[push] this browser doesn't support web push, skipping");
    return;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn(
      "[push] EXPO_PUBLIC_VAPID_PUBLIC_KEY is not set — generate a VAPID key pair " +
        "(npx web-push generate-vapid-keys) and add the public half to .env. Skipping web push registration.",
    );
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[push] notification permission not granted, skipping web push registration");
      return;
    }

    // Reuses an existing subscription if the browser already created
    // one for this app+origin, rather than creating a duplicate on
    // every app load.
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // required by the spec — every push must show a visible notification, no silent background pushes
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    const userId = await requireUserId();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        platform: "web",
        web_endpoint: json.endpoint,
        web_p256dh: json.keys?.p256dh,
        web_auth: json.keys?.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "web_endpoint" },
    );
    if (error) {
      console.warn("[push] failed to save web push subscription:", error.message);
    } else {
      console.log("[push] registered web push subscription");
    }
  } catch (err) {
    console.warn("[push] web push registration failed:", err instanceof Error ? err.message : err);
  }
}
