import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { useTheme } from "@/shared/hooks/use-theme";

// NativeTabs (used on iOS/Android — see app-tabs.tsx) renders a real native
// tab bar and pre-rasterizes its icons into bitmaps via expo-font's native
// image renderer, which doesn't exist on web and crashes the dev server.
// There's no meaningful "native tab bar" equivalent on web anyway — a
// persistent top nav is the standard pattern for desktop business software,
// so that's what this renders instead of trying to imitate a mobile bar.

const TAB_META: Record<
  string,
  { label: string; icon: (color: string, focused: boolean) => React.ReactNode }
> = {
  index: {
    label: "Home",
    icon: (color, focused) => (
      <Octicons name={focused ? "home-fill" : "home"} size={18} color={color} />
    ),
  },
  services: {
    label: "Apps",
    icon: (color, focused) => (
      <Ionicons name={focused ? "apps" : "apps-outline"} size={18} color={color} />
    ),
  },
  account: {
    label: "Account",
    icon: (color, focused) => (
      <Ionicons name={focused ? "person" : "person-outline"} size={18} color={color} />
    ),
  },
};

function WebTopNav({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.inner}>
        <Text style={[styles.brand, { color: colors.primary }]}>RxPharmily</Text>

        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const meta = TAB_META[route.name];
            if (!meta) return null;

            const focused = state.index === index;
            const color = focused ? colors.primary : colors.textSecondary;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabItem,
                  focused && { backgroundColor: colors.primary + "14" },
                ]}
              >
                {meta.icon(color, focused)}
                <Text style={[styles.tabLabel, { color, fontWeight: focused ? "700" : "500" }]}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spacer} />
      </View>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <WebTopNav {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1 },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 1100,
    width: "100%",
    marginHorizontal: "auto" as any,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 32,
  },
  brand: { fontSize: 18, fontWeight: "800" },
  tabs: { flexDirection: "row", gap: 6 },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabLabel: { fontSize: 14 },
  spacer: { flex: 1 },
});
