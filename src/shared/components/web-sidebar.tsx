import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, usePathname } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LogoMark from "@/shared/components/logo-mark";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  // A section is "active" if the current path starts with any of these —
  // e.g. /rfqs/rxrfq-details-screen should still highlight "RxRFQs" in
  // the sidebar, not just an exact match on /rfqs itself.
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

const WebSidebar: React.FC = () => {
  const { colors } = useTheme();
  const pathname = usePathname();
  const user = useProfileStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.profile?.accountRole === "admin");

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
        onPress={() => router.push(item.href as any)}
        className="mx-3 mb-0.5 flex-row items-center gap-3 rounded-lg px-3 py-2.5"
        style={{ backgroundColor: active ? colors.primary + "14" : "transparent" }}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={19}
          color={active ? colors.primary : colors.textSecondary}
        />
        <Text
          className="text-[13.5px]"
          style={{ color: active ? colors.primary : colors.text, fontWeight: active ? "700" : "500" }}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="h-full w-64 shrink-0"
      style={{ backgroundColor: colors.backgroundSecondary, borderRightWidth: 1, borderRightColor: colors.border }}
    >
      {/* Brand */}
      <View className="flex-row items-center gap-2.5 px-5 py-6">
        <LogoMark size={36} />
        <Text className="text-[17px] font-extrabold" style={{ color: colors.text }}>
          RxPharmily
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-1">{PRIMARY_NAV.map(renderItem)}</View>

        <Text
          className="mb-1 ml-6 mt-4 text-[11px] font-bold uppercase tracking-wide"
          style={{ color: colors.textSecondary }}
        >
          Workspace
        </Text>
        <View>{WORKSPACE_NAV.map(renderItem)}</View>

        {isAdmin && (
          <>
            <Text
              className="mb-1 ml-6 mt-4 text-[11px] font-bold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Admin
            </Text>
            {renderItem({
              label: "Admin Hub",
              href: "/admin",
              icon: "shield-crown-outline",
              matchPrefixes: ["/admin"],
            })}
          </>
        )}
      </ScrollView>

      {/* Account summary, pinned at the bottom */}
      <Pressable
        onPress={() => router.push("/(tabs)/account")}
        className="flex-row items-center gap-3 border-t px-4 py-3.5"
        style={{ borderTopColor: colors.border }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: user.avatarColor || colors.primary }}
        >
          <Text className="text-[12px] font-bold text-white">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-semibold" numberOfLines={1} style={{ color: colors.text }}>
            {user.fullName || "My Account"}
          </Text>
          <Text className="text-[11px]" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {user.email}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};

export default WebSidebar;
