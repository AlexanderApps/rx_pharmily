import { create } from "zustand";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";

// expo-notifications, expo-device, and expo-constants aren't installed
// in this project export (no package.json here to check against) —
// install them before this file will actually run:
//   npx expo install expo-notifications expo-device expo-constants
//
// Native push additionally needs an EAS project ID (Constants.
// expoConfig?.extra?.eas?.projectId) — set up automatically the first
// time you run `eas init` / `eas build:configure` in a real project
// checkout, which isn't something this environment has access to
// either. Until that's in place, registerForNativePush() below will
// still run without throwing, but will fail to get a real token (Expo's
// getExpoPushTokenAsync requires it) — check the console warning it
// logs if tokens aren't showing up in push_subscriptions.
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

// Controls how a push notification behaves while the app is already
// open and foregrounded — without this, Expo's default is to NOT show
// anything visually in that case (the assumption being your own in-app
// UI, e.g. the Realtime-updated badge, already covers it). Shown here
// so a foregrounded push still surfaces as a system alert/sound too,
// since this app doesn't have a persistent "you have new activity"
// banner outside the notifications screen itself.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type PushRegistrationStore = {
  isRegistering: boolean;
  registerForPush: () => Promise<void>;
};

export const usePushRegistrationStore = create<PushRegistrationStore>((set) => ({
  isRegistering: false,

  registerForPush: async () => {
    if (Platform.OS === "web") {
      // Web push is a genuinely different mechanism (Service Worker +
      // PushManager + VAPID), not something expo-notifications covers —
      // see registerForWebPush in web-push-registration.ts.
      return;
    }

    set({ isRegistering: true });
    try {
      if (!Device.isDevice) {
        // Simulators/emulators can't receive real push at all — Expo's
        // own getExpoPushTokenAsync would just fail here anyway, so
        // this skips it with a clearer message than that error would.
        console.log("[push] skipped: not a physical device (simulator/emulator)");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("[push] permission not granted, skipping registration");
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn(
          "[push] no EAS project ID found (Constants.expoConfig?.extra?.eas?.projectId) — " +
            "run `eas init` / `eas build:configure` first, then rebuild. Skipping token registration.",
        );
        return;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      const userId = await requireUserId();

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          platform: Platform.OS as "ios" | "android",
          expo_push_token: token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "expo_push_token" },
      );
      if (error) {
        console.warn("[push] failed to save push token:", error.message);
      } else {
        console.log(`[push] registered ${Platform.OS} push token`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("FirebaseApp") || message.includes("Firebase Messaging")) {
        // The single most common setup gap on Android specifically —
        // getExpoPushTokenAsync needs a real Firebase project's
        // google-services.json wired into app config
        // (android.googleServicesFile) before it can talk to FCM at
        // all. Worth a specific, actionable message rather than the
        // generic one below, since this is expected during setup, not
        // a bug — see send-push/README.md's native push section.
        console.warn(
          "[push] Android push needs a real Firebase project's google-services.json configured " +
            "at android.googleServicesFile in app config (see " +
            "https://docs.expo.dev/push-notifications/fcm-credentials/), then a rebuild. " +
            `Skipping push registration until that's set up. Raw error: ${message}`,
        );
      } else {
        console.warn("[push] registration failed:", message);
      }
    } finally {
      set({ isRegistering: false });
    }
  },
}));
