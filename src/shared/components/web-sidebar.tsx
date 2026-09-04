import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, usePathname } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LogoMark from "@/shared/components/logo-mark";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { noSelectStyle } from "@/shared/constants/text-selection";
import { useBreakpoint } from "@/shared/hooks/use-breakpoint";
import { useMobileSidebarStore } from "@/shared/hooks/use-mobile-sidebar";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  matchPrefixes: string[];
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/(tabs)", icon: "home-outline", matchPrefixes: ["/(tabs)/index", "/(tabs)"] },
  { label: "Community", href: "/posts", icon: "account-group-outline", matchPrefixes: ["/posts"] },
];

const WORKSPACE_NAV: NavItem[] = [
  { label: "RxRFQs", href: "/rfqs", icon: "file-document-outline", matchPrefixes: ["/rfqs"] },
  { label: "Donations", href: "/donations", icon: "heart-outline", matchPrefixes: ["/donations"] },
  { label: "MediScope", href: "/mediscope", icon: "heart-search", matchPrefixes: ["/mediscope"] },
  { label: "RxLink", href: "/rxlink", icon: "pill", matchPrefixes: ["/rxlink"] },
  { label: "RxJobs", href: "/jobs", icon: "office-building-outline", matchPrefixes: ["/jobs"] },
  { label: "RxAds", href: "/ads", icon: "bullhorn-outline", matchPrefixes: ["/ads"] },
  { label: "RxChat", href: "/chat", icon: "chat-outline", matchPrefixes: ["/chat"] },
  { label: "Formulary", href: "/formulary", icon: "clipboard-plus-outline", matchPrefixes: ["/formulary"] },
  { label: "RxVitals", href: "/vitals", icon: "heart-pulse", matchPrefixes: ["/vitals"] },
  { label: "RxHelp", href: "/help", icon: "lifebuoy", matchPrefixes: ["/help"] },
];

function isActive(pathname: string, item: NavItem): boolean {
  return item.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

const SIDEBAR_COLLAPSED_KEY = "rxpharmily:sidebar-collapsed";

// This component only ever renders on web (see web-app-shell.tsx) — never
// native — so window.localStorage (synchronous) is used directly rather
// than AsyncStorage (the cross-platform, Promise-based mechanism used
// elsewhere in this app for e.g. the Supabase session). AsyncStorage's
// async read would mean the sidebar always renders expanded for at least
// one frame before snapping to whatever was actually stored, which is
// exactly the flash this exists to avoid — the same class of "first
// render disagrees with the real value" issue chased down earlier this
// session with the chat screens' safe-area timing, and the same
// SSR-hazard shape already solved once in lib/supabase.ts (Expo Router's
// web build renders once on the server, where window doesn't exist yet).
function readPersistedCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    // Some browsers throw on localStorage access in certain contexts
    // (private browsing, disabled storage) — falling back to expanded
    // is the safer default over letting this throw and break the whole
    // sidebar.
    return false;
  }
}

function persistCollapsed(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "true" : "false");
  } catch {
    // Same defensive swallow as above — a failed write shouldn't break
    // the toggle itself, it just won't persist for next time.
  }
}

const WebSidebar: React.FC = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const user = useProfileStore((state) => state.user);
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const [desktopCollapsed, setDesktopCollapsedState] = useState(readPersistedCollapsed);
  const breakpoint = useBreakpoint();
  const isCompact = breakpoint === "compact";
  const mobileOpen = useMobileSidebarStore((state) => state.isOpen);
  const closeMobileSidebar = useMobileSidebarStore((state) => state.close);
  // The desktop "collapsed to icons only" preference doesn't apply to
  // the mobile overlay drawer — that's a space-saving feature for a
  // sidebar competing with content side by side, which isn't the
  // situation on compact (the drawer overlays, it doesn't share space).
  // Every render decision below reads this derived value, not the raw
  // persisted one.
  const collapsed = isCompact ? false : desktopCollapsed;

  // Wraps setCollapsed so every call site that toggles the sidebar
  // persists automatically, rather than relying on a useEffect keyed off
  // `collapsed` (which would also needlessly re-fire on mount, since
  // readPersistedCollapsed already reflects whatever's stored).
  const setCollapsed = (value: boolean) => {
    setDesktopCollapsedState(value);
    persistCollapsed(value);
  };

  const initials = (user.fullName || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderItem = (item: NavItem) => {
    const active = isActive(pathname, item);

    return (
      <Pressable
        key={item.href}
        onPress={() => {
          router.navigate(item.href as any);
          if (isCompact) closeMobileSidebar();
        }}
        className={`
          group mx-2 mb-0.5 flex-row items-center rounded-xl
          ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}
          hover:opacity-90 active:opacity-80
        `}
        style={{
          backgroundColor: active ? colors.primary + "18" : "transparent",
        }}
        // @ts-expect-error web-only hover styles via NativeWind
        dataSet={{ tooltip: collapsed ? item.label : undefined }}
      >
        {({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => (
          <>
            <View
              className="items-center justify-center rounded-lg"
              style={{
                width: 32,
                height: 32,
                backgroundColor:
                  active
                    ? colors.primary + "22"
                    : hovered || pressed
                      ? colors.backgroundElement
                      : "transparent",
              }}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={active ? colors.primary : colors.textSecondary}
              />
            </View>

            {!collapsed && (
              <Text
                className="flex-1 text-[13.5px]"
                style={{
                  color: active ? colors.primary : colors.text,
                  fontWeight: active ? "700" : "500",
                  ...noSelectStyle,
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            )}

            {/* Active indicator bar */}
            {active && !collapsed && (
              <View
                className="absolute left-0 h-5 w-[3px] rounded-r-full"
                style={{ backgroundColor: colors.primary }}
              />
            )}
          </>
        )}
      </Pressable>
    );
  };

  // Compact + closed: the sidebar takes zero space, exactly as if it
  // weren't rendered at all — WebAppShell's flex row collapses around
  // it with no gap left behind.
  if (isCompact && !mobileOpen) {
    return null;
  }

  return (
    <>
      {/* Compact + open: a backdrop behind the drawer, dismissible by
          tapping anywhere outside it — same "tap outside to close"
          convention as every Modal-based sheet elsewhere in this app. */}
      {isCompact && (
        <Pressable
          onPress={closeMobileSidebar}
          style={
            {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 40,
            } as any
          }
        />
      )}
      <View
        className="h-full shrink-0 transition-all"
        style={{
          width: collapsed ? 72 : 256,
          backgroundColor: colors.backgroundSecondary,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          ...(isCompact
            ? ({ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 41 } as any)
            : null),
        }}
      >
      {/* Brand + collapse toggle */}
      <View
        className={`flex-row items-center py-5 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}
      >
        <View className={`flex-row items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <LogoMark size={collapsed ? 32 : 36} />
          {!collapsed && (
            <Text className="text-[17px] font-extrabold tracking-tight" style={{ color: colors.text, ...noSelectStyle }}>
              RxPharmily
            </Text>
          )}
        </View>

        {!collapsed && (
          <Pressable
            onPress={() => setCollapsed(true)}
            className="h-8 w-8 items-center justify-center rounded-lg hover:opacity-80 active:opacity-70"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="chevron-left" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Expand button when collapsed */}
      {collapsed && (
        <Pressable
          onPress={() => setCollapsed(false)}
          className="mx-auto mb-3 h-8 w-8 items-center justify-center rounded-lg hover:opacity-80 active:opacity-70"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
        </Pressable>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-1">{PRIMARY_NAV.map(renderItem)}</View>

        {!collapsed && (
          <Text
            className="mb-1.5 ml-5 mt-5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: colors.textSecondary, ...noSelectStyle }}
          >
            Workspace
          </Text>
        )}
        {collapsed && <View className="mx-4 my-3 h-px" style={{ backgroundColor: colors.border }} />}

        <View>{WORKSPACE_NAV.map(renderItem)}</View>

        {isAdmin && (
          <>
            {!collapsed ? (
              <Text
                className="mb-1.5 ml-5 mt-5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: colors.textSecondary, ...noSelectStyle }}
              >
                Admin
              </Text>
            ) : (
              <View className="mx-4 my-3 h-px" style={{ backgroundColor: colors.border }} />
            )}
            {renderItem({
              label: "Admin Hub",
              href: "/admin",
              icon: "shield-crown-outline",
              matchPrefixes: ["/admin"],
            })}
          </>
        )}
      </ScrollView>

      {/* Account summary */}
      <Pressable
        onPress={() => router.navigate("/(tabs)/account")}
        className={`
          flex-row items-center border-t
          ${collapsed ? "justify-center px-2 py-3.5" : "gap-3 px-3.5 py-3.5"}
          hover:opacity-90 active:opacity-80
        `}
        style={{ borderTopColor: colors.border }}
      >
        {({ hovered }: { hovered?: boolean }) => (
          <>
            <View
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{
                backgroundColor: user.avatarColor || colors.primary,
                opacity: hovered ? 0.9 : 1,
              }}
            >
              <Text className="text-[12px] font-bold text-white" style={noSelectStyle}>{initials}</Text>
            </View>

            {!collapsed && (
              <>
                <View className="flex-1">
                  <Text
                    className="text-[13px] font-semibold"
                    numberOfLines={1}
                    style={{ color: colors.text }}
                  >
                    {user.fullName || "My Account"}
                  </Text>
                  <Text
                    className="text-[11px]"
                    numberOfLines={1}
                    style={{ color: colors.textSecondary }}
                  >
                    {user.email}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={colors.textSecondary}
                />
              </>
            )}
          </>
        )}
      </Pressable>
      </View>
    </>
  );
};

export default WebSidebar;