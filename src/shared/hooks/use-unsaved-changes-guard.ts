import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useNavigation, router } from "expo-router";
import { confirm } from "@/shared/hooks/use-confirm";

interface UseUnsavedChangesGuardOptions {
  hasUnsavedChanges: boolean;
  title?: string;
  message?: string;
}

const DEFAULT_TITLE = "Discard changes?";
const DEFAULT_MESSAGE = "You have unsaved changes. Are you sure you want to leave?";

/**
 * Guards against losing unsaved form changes, across every way someone
 * can actually leave a screen — not just React Navigation's own
 * beforeRemove event, which has real, documented gaps:
 *   - It doesn't reliably fire for the browser's own back button on
 *     web (https://github.com/react-navigation/react-navigation/issues/9031) —
 *     by the time the browser's popstate event fires, the URL has
 *     already changed, so there's nothing left to prevent at that
 *     point through the normal navigation-interception mechanism.
 *   - It doesn't reliably fire when a screen is the last/only screen
 *     in its own nested stack (a known react-navigation limitation) —
 *     which is exactly what happens on a cold web refresh directly
 *     into a form's URL, something that barely happens on native but
 *     is routine on web.
 *
 * Usage:
 *   const { guardedBack } = useUnsavedChangesGuard({ hasUnsavedChanges });
 *   <Pressable onPress={guardedBack}>...</Pressable>   // instead of router.back()
 *
 * beforeRemove is still wired up as a first line of defense for other
 * in-app navigation (e.g. tapping a different tab/sidebar item), the
 * web-only browser-back/tab-close handling supplements it for the
 * cases above, and guardedBack replaces a raw router.back() call for
 * this screen's own header button, which is the most reliable path of
 * all three since it's a direct check rather than an event listener.
 */
export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  hasUnsavedChangesRef.current = hasUnsavedChanges;

  const promptDiscard = () => confirm({ title, message, confirmLabel: "Discard", cancelLabel: "Stay Here", destructive: true });

  // First line of defense — React Navigation's own in-app navigation
  // interception (tapping a different tab/sidebar item, swipe-back on
  // iOS, hardware back on Android). Known gaps are exactly what the
  // other two guards below cover.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!hasUnsavedChangesRef.current) return;
      e.preventDefault();
      (async () => {
        const ok = await promptDiscard();
        if (ok) navigation.dispatch(e.data.action);
      })();
    });
    return unsubscribe;
  }, [navigation, title, message]);

  // Web only: the browser's own back button and tab close/refresh
  // bypass React Navigation's event system entirely — they go through
  // the browser's native History API first, before React ever sees
  // anything.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // Tab close / refresh / typing a new URL and pressing enter —
    // browsers only allow a generic, unstyleable "Leave site?" prompt
    // here for security reasons (a page can't show its own custom
    // dialog for this specific case), so this is the best available
    // warning for it.
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Browser back button specifically, on web — separate effect because
  // it needs to push an extra history entry the moment changes
  // actually start (not just once on mount, since a form usually
  // starts empty), so the first back-press pops that guard entry
  // instead of actually leaving.
  const guardEntryPushedRef = useRef(false);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (!hasUnsavedChanges || guardEntryPushedRef.current) return;

    window.history.pushState({ unsavedChangesGuard: true }, "", window.location.href);
    guardEntryPushedRef.current = true;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handlePopState = () => {
      if (!hasUnsavedChangesRef.current) return;
      guardEntryPushedRef.current = false;
      (async () => {
        const ok = await promptDiscard();
        if (ok) {
          window.history.back();
        } else {
          // Stay put — re-push the guard entry so the next back-press
          // is caught the same way.
          window.history.pushState({ unsavedChangesGuard: true }, "", window.location.href);
          guardEntryPushedRef.current = true;
        }
      })();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [title, message]);

  const guardedBack = async () => {
    if (!hasUnsavedChangesRef.current) {
      router.back();
      return;
    }
    const ok = await promptDiscard();
    if (ok) router.back();
  };

  return { guardedBack };
}
