// // Requires these packages (run in your actual project, not this sandbox):
// //   npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
// //
// // Also requires two env vars, read via Expo's built-in EXPO_PUBLIC_ support
// // (no extra config needed — any .env var prefixed EXPO_PUBLIC_ is inlined
// // at build time). Create a .env file at the project root (and make sure
// // it's gitignored — this holds your anon key) with:
// //   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
// //   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// // Restart the dev server after adding or changing these — Expo only reads
// // env vars at startup, not on hot reload.

// import "react-native-url-polyfill/auto";
// import { AppState, Platform } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error(
//     "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and " +
//       "EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file, then restart the " +
//       "dev server (Expo only reads .env at startup).",
//   );
// }

// // Expo Router's web build renders once on the server (Node.js — no
// // window, no localStorage, no real user session to speak of) before
// // hydrating in the actual browser. AsyncStorage's web implementation
// // reads window.localStorage under the hood, so touching it unconditionally
// // at module load crashed that server render outright ("window is not
// // defined") before the app ever reached the client. There's nothing
// // meaningful to persist during a server render anyway, so this only wires
// // up AsyncStorage once there's a real window to read from — leaving
// // `storage` undefined otherwise, which GoTrueClient handles by falling
// // back to an in-memory session for that render pass.
// const isBrowserOrNative = Platform.OS !== "web" || typeof window !== "undefined";

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     // AsyncStorage persists the session across app restarts — without
//     // this, every cold start would require signing in again.
//     storage: isBrowserOrNative ? AsyncStorage : undefined,
//     autoRefreshToken: true,
//     persistSession: true,
//     // detectSessionInUrl handles OAuth redirects via URL params, which is
//     // a web-only concept — there's no browser URL bar in a native app.
//     detectSessionInUrl: false,
//   },
// });

// // Same SSR concern as above — AppState isn't meaningful (and may not be
// // safely usable) outside a real running app, so this only registers the
// // listener once there's an actual browser/native runtime behind it.
// if (isBrowserOrNative) {
//   // Supabase's own recommendation for React Native: pause token auto-
//   // refresh while the app is backgrounded, and resume it when it comes
//   // back to the foreground, rather than letting it run (and burn battery/
//   // requests) the whole time the app isn't actually in use.
//   AppState.addEventListener("change", (state) => {
//     if (state === "active") {
//       supabase.auth.startAutoRefresh();
//     } else {
//       supabase.auth.stopAutoRefresh();
//     }
//   });
// }

// Requires these packages (run in your actual project, not this sandbox):
//   npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
//
// Also requires two env vars, read via Expo's built-in EXPO_PUBLIC_ support
// (no extra config needed — any .env var prefixed EXPO_PUBLIC_ is inlined
// at build time). Create a .env file at the project root (and make sure
// it's gitignored — this holds your anon key) with:
//   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// Restart the dev server after adding or changing these — Expo only reads
// env vars at startup, not on hot reload.

import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file, then restart the " +
      "dev server (Expo only reads .env at startup).",
  );
}

// Expo Router's web build renders once on the server (Node.js — no
// window, no localStorage, no real user session to speak of) before
// hydrating in the actual browser. AsyncStorage's web implementation
// reads window.localStorage under the hood, so touching it unconditionally
// at module load crashed that server render outright ("window is not
// defined") before the app ever reached the client. There's nothing
// meaningful to persist during a server render anyway, so this only wires
// up AsyncStorage once there's a real window to read from — leaving
// `storage` undefined otherwise, which GoTrueClient handles by falling
// back to an in-memory session for that render pass.
const isBrowserOrNative = Platform.OS !== "web" || typeof window !== "undefined";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage persists the session across app restarts — without
    // this, every cold start would require signing in again.
    storage: isBrowserOrNative ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl handles OAuth redirects via URL params, which is
    // a web-only concept — there's no browser URL bar in a native app.
    detectSessionInUrl: false,
  },
  global: {
    fetch: typeof fetch !== 'undefined' ? fetch : undefined,
  },
  // Use 'as any' to prevent strict type validation from failing during compilation
  realtime: {
    WebSocket: typeof WebSocket !== 'undefined' ? WebSocket : undefined,
  } as any
});

// Same SSR concern as above — AppState isn't meaningful (and may not be
// safely usable) outside a real running app, so this only registers the
// listener once there's an actual browser/native runtime behind it.
if (isBrowserOrNative) {
  // Supabase's own recommendation for React Native: pause token auto-
  // refresh while the app is backgrounded, and resume it when it comes
  // back to the foreground, rather than letting it run (and burn battery/
  // requests) the whole time the app isn't actually in use.
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
