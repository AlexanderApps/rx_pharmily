# send-push — actual device/browser push delivery

Triggered by a database webhook on every `notifications` INSERT (any
source — any of `notify-dispatch`'s 21 handlers, or a client-side
`addNotification` call still active during that feature's cutover).
Looks up the recipient's registered devices in `push_subscriptions` and
sends via Expo's push API (native) or Web Push (browser).

## 1. Native push setup (iOS/Android)

This project export has no `package.json`/`app.json` to check or edit
directly — these steps happen in your actual project checkout:

```bash
npx expo install expo-notifications expo-device expo-constants
eas init          # if this project isn't already an EAS project
eas build:configure
```

`eas init`/`build:configure` write an EAS project ID into your app
config automatically — `features/notifications/hooks/use-push-registration.ts`
reads it via `Constants.expoConfig?.extra?.eas?.projectId` and will log a
clear warning (not silently fail) if it's missing.

**iOS additionally needs push capability enabled** in your Apple
Developer account and an APNs key/certificate configured — Expo's own
push service handles the APNs relay for you, but the initial Apple-side
setup is unavoidable and specific to your Apple Developer account. See
Expo's own push notifications setup guide for the exact dashboard steps
(this changes often enough on Apple's side that documenting exact
screenshots here would go stale).

**Android needs two separate things, not one** — easy to complete only
the first and assume push is fully set up:

1. **Server-side**: an FCM V1 Google Service Account Key, which
   `eas build:configure` (or `eas credentials`) provisions — this is
   what lets Expo's push service authenticate with Google's FCM API
   when relaying a push to a device on your behalf.
2. **Client-side**: `google-services.json`, a separate file the Android
   app itself needs bundled in to initialize Firebase locally and
   request a push token at all. Get it from the Firebase console for
   the same project (Project settings → General → Your apps → the
   Android app matching your `android.package`), place it in your
   project, and reference it:
   ```json
   { "expo": { "android": { "googleServicesFile": "./google-services.json" } } }
   ```
   Without this second piece specifically, `getExpoPushTokenAsync()`
   fails with `"Default FirebaseApp is not initialized in this
   process"` — a real, common gap even after the server-side credential
   above is already configured; they don't imply each other.

Rebuild the app (`eas build`) after either — neither takes effect in an
existing build; both are read/bundled at build time, not dynamically.

## 2. Web push setup

Generate a VAPID key pair once:

```bash
npx web-push generate-vapid-keys
```

- **Public key** → add to `.env`: `EXPO_PUBLIC_VAPID_PUBLIC_KEY=...`
  (read by `features/notifications/hooks/use-web-push-registration.ts`)
- **Private key** → `supabase secrets set VAPID_PRIVATE_KEY=...` (never
  in `.env`, never client-visible)
- Also set: `supabase secrets set VAPID_CONTACT_EMAIL=you@example.com`
  and `supabase secrets set VAPID_PUBLIC_KEY=...` (the same public key,
  needed server-side too — `web-push`'s API requires both halves when
  signing a push)

`public/sw.js` (the service worker) needs to be served from your site's
root for its scope to cover the whole app — confirm your Expo web build
actually publishes `public/` contents to the build output root; this
varies by bundler config and isn't something verifiable from a source
export alone.

**Worth flagging honestly**: `send-push/index.ts` imports the `web-push`
npm package via Deno's `npm:` specifier
(`import webpush from "npm:web-push@3"`). `web-push` was written for
Node and uses Node's own `crypto` internals — Deno's npm compatibility
layer covers a lot, but hasn't been verified against this specific
package from here. If `supabase functions deploy` or a live test fails
on this import, that's the first thing to check — an alternative is
implementing the Web Push protocol's request-signing directly (VAPID JWT
+ payload encryption) without the `web-push` package, which is more
code but has zero Node-specific dependencies.

## 3. Deploy and configure

```bash
supabase functions deploy send-push
supabase secrets set PUSH_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

Then either:

- **Migration** (recommended): run the setup INSERT in
  `20260908000001_send_push_webhook.sql`'s header comment with your real
  function URL + the `PUSH_WEBHOOK_SECRET` value, then
  `supabase db push`.
- **Dashboard**: Database → Webhooks → new webhook on `notifications`,
  event: Insert, same header pattern as `notify-dispatch`'s dashboard
  setup (`x-webhook-secret`).

## 4. Verify

```bash
supabase functions logs send-push
```

Trigger any real notification (publish an RFQ from a second test
account with a registered device) and look for
`[send-push]` log lines — a clean run shows no warnings; a stale/dead
web subscription logs its own removal rather than failing silently
forever.

## What's NOT handled yet

- **Notification preferences at the push layer.** `send-push` sends to
  every registered device for a recipient, full stop — it doesn't check
  whether they'd prefer push muted for certain categories while still
  wanting in-app/email for others. That's a real, near-term
  enhancement, not an oversight: it needs its own settings UI (e.g. "push"
  vs "in-app" per category, not just the current single on/off), which
  is its own scoped feature.
- **Badge counts on iOS.** `shouldSetBadge: true` is set in the
  notification handler, but nothing currently clears/updates the app
  icon's badge number based on actual unread count — it'll accumulate
  from Expo's default behavior rather than reflecting this app's real
  unread state.
- **Retry/backoff for failed sends.** A failed `fetch` to Expo's push
  API or a transient `web-push` error is logged and dropped, not
  retried. Acceptable for a first version — a lost push is recoverable
  (the in-app notification and Realtime delivery both still happened
  regardless of whether the OS-level push succeeded) — but worth
  revisiting if push reliability becomes a priority later.
