import React from "react";
import { Tabs } from "expo-router";

// NativeTabs (used on iOS/Android — see app-tabs.tsx) renders a real native
// tab bar and pre-rasterizes its icons into bitmaps via expo-font's native
// image renderer, which doesn't exist on web and crashes the dev server —
// that's why web needs its own separate file at all.
//
// This used to render its own top nav bar here (WebTopNav, with the same
// Home/Apps/Account items as the tabs themselves) before WebAppShell's
// sidebar existed. Now that the sidebar is the actual web navigation, that
// bar was pure duplication — same destinations, rendered twice, stacked on
// top of each other. The Tabs navigator below still needs to exist so
// index/services/account remain real, reachable routes (the sidebar links
// to them), it just renders no visible bar of its own anymore.
export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
