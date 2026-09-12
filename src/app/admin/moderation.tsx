import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";

interface ModerationEntry {
  id: string;
  name: string;
  isBanned: boolean;
  isSuspended: boolean;
}

export default function AdminModerationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const [tab, setTab] = useState<ProfileUpdateEntityType>("user");
  const [query, setQuery] = useState("");

  const allUsers = useProfileStore((state) => state.allUsers);
  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const fetchAllUsers = useProfileStore((state) => state.fetchAllUsers);
  const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
  const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAllUsers();
    fetchFacilities();
    fetchOrganizations();
  }, [isAdmin]);

  const entries: ModerationEntry[] = useMemo(() => {
    if (tab === "user") {
      return allUsers.map((u) => ({ id: u.id, name: u.fullName || u.email, isBanned: u.isBanned, isSuspended: u.isSuspended }));
    }
    if (tab === "facility") {
      return facilities.map((f) => ({ id: f.id, name: f.name, isBanned: f.isBanned, isSuspended: f.isSuspended }));
    }
    return organizations.map((o) => ({ id: o.id, name: o.name, isBanned: o.isBanned, isSuspended: o.isSuspended }));
  }, [tab, allUsers, facilities, organizations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, query]);

  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Account Moderation" subtitle="Ban or suspend users, facilities, and organizations" />

      <StatusFilterTabs
        options={[
          { key: "user", label: "Users" },
          { key: "facility", label: "Facilities" },
          { key: "organization", label: "Organizations" },
        ]}
        selected={tab}
        onSelect={(key) => setTab(key as ProfileUpdateEntityType)}
      />

      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: colors.backgroundElement }}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${tab === "user" ? "users" : tab === "facility" ? "facilities" : "organizations"}`}
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-sm"
            style={{ color: colors.text }}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}
        ListEmptyComponent={<EmptyState icon="account-search-outline" message="No matches — try a different search." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/admin/moderation-detail",
                params: { entityType: tab, entityId: item.id },
              })
            }
            className="flex-row items-center justify-between px-4 py-3.5 rounded-xl"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <Text className="text-sm font-medium flex-1" numberOfLines={1} style={{ color: colors.text }}>
              {item.name}
            </Text>
            {(item.isBanned || item.isSuspended) && (
              <View
                className="flex-row items-center gap-1 px-2 py-1 rounded-lg ml-2"
                style={{ backgroundColor: colors.error + "18" }}
              >
                <MaterialCommunityIcons
                  name={item.isBanned ? "account-cancel-outline" : "account-clock-outline"}
                  size={12}
                  color={colors.error}
                />
                <Text className="text-[10px] font-bold" style={{ color: colors.error }}>
                  {item.isBanned ? "Banned" : "Suspended"}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
