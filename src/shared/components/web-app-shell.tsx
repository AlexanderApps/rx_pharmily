import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import WebSidebar from "@/shared/components/web-sidebar";
import WebTopBar from "@/shared/components/web-top-bar";
import GlobalSearchModal from "@/shared/components/global-search-modal";
import { useGlobalSearchStore } from "@/shared/hooks/use-global-search";

interface WebAppShellProps {
  children: React.ReactNode;
  // Login/signup have no signed-in user to populate the sidebar's account
  // section or the admin-gated nav with, and showing workspace navigation
  // before authentication doesn't make sense anyway — the root layout
  // sets this to false for those routes.
  showChrome?: boolean;
}

// This app was designed screen-by-screen for a phone, and the earlier
// approach here just centered that phone-shaped output in a fixed-width
// column on desktop — better than raw edge-to-edge stretching, but still
// visibly "a mobile app in a browser," not something that reads as a real
// web tool. For a pharmacy/hospital audience using this on a desktop
// workstation, that matters: this replaces the phone-frame with an actual
// web layout — persistent sidebar navigation (NativeTabs, used for the
// native bottom tab bar, doesn't meaningfully render on web at all) plus
// a top bar, with the routed screen's content filling the remaining width
// instead of being squeezed into a narrow column.
//
// Native is completely untouched: on iOS/Android this renders children
// directly with no sidebar, no extra chrome, nothing — exactly what
// existed before this component was introduced.
const WebAppShell: React.FC<WebAppShellProps> = ({ children, showChrome = true }) => {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const { colors } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined" || !showChrome) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useGlobalSearchStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showChrome]);

  if (!showChrome) {
    return (
      <View className="flex-1 items-center" style={{ backgroundColor: colors.backgroundSecondary, minHeight: "100vh" as any }}>
        <View className="w-full flex-1" style={{ maxWidth: 480, backgroundColor: colors.background }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row" style={{ backgroundColor: colors.background, minHeight: "100vh" as any }}>
      <WebSidebar />
      <View className="flex-1">
        <WebTopBar />
        {/* Deliberately no ScrollView or padding here — every individual
            screen already brings its own SafeAreaView, its own internal
            scroll container, and its own full-bleed header, all built
            assuming they own the whole viewport. Wrapping that in a
            second scroll container risks the exact nested-scroll conflict
            this session already hit (and fixed) once with FlatList inside
            ScrollView. The chrome here is additive; individual screens
            getting real web-appropriate padding/layout is deliberately
            left for the per-screen .web.tsx work described as "gradual
            merge where necessary," not forced on every screen at once. */}
        <View className="flex-1">{children}</View>
      </View>
      <GlobalSearchModal />
    </View>
  );
};

export default WebAppShell;
