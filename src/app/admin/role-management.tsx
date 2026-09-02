import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator, Platform} from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { AccountRole, isSuperadminRole } from "@/features/auth/types/auth.types";
import { useProfileStore, AdminUserSummary } from "@/features/profile/hooks/use-profile-data";

const MAX_SUPERADMINS = 5;

const ROLE_META: Record<
  AccountRole,
  { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  superadmin: { label: "Superadmin", color: "#9333ea", icon: "shield-crown" },
  admin: { label: "Admin", color: "#2563eb", icon: "shield-account" },
  user: { label: "User", color: "#64748b", icon: "account-outline" },
};

export default function RoleManagementScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));

  const allUsers = useProfileStore((state) => state.allUsers);
  const fetchAllUsers = useProfileStore((state) => state.fetchAllUsers);
  const changeUserRole = useProfileStore((state) => state.changeUserRole);
  const getSuperadminCount = useProfileStore((state) => state.getSuperadminCount);

  const [search, setSearch] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<AccountRole | "all">("all");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const superadminCount = useMemo(() => getSuperadminCount(), [allUsers]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byRole =
      roleFilter === "all" ? allUsers : allUsers.filter((u) => u.accountRole === roleFilter);
    if (!q) return byRole;
    return byRole.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, search, roleFilter]);

  if (!isSuperadmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const handleChangeRole = async (target: AdminUserSummary, newRole: AccountRole) => {
    const meta = ROLE_META[newRole];
    const isDemotingSelf = target.id === currentUserId && newRole !== "superadmin";
    const ok = await confirm({
      title: `Change role to ${meta.label}?`,
      message: isDemotingSelf
        ? `You're changing your own role. If you're the last superadmin, this will be blocked.`
        : `${target.fullName} will become "${meta.label}".`,
      confirmLabel: "Confirm",
      destructive: newRole === "user",
    });
    if (!ok) return;

    setPendingUserId(target.id);
    const result = await changeUserRole(target.id, newRole);
    if (result.ok && target.id === currentUserId) {
      await useAuthStore.getState().refreshProfile();
    }
    setPendingUserId(null);

    if (result.ok) {
      toast.success(`Role updated to ${meta.label}.`);
    } else {
      Alert.alert("Couldn't change role", result.error ?? "Something went wrong.");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-3 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <Pressable onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        )}
        <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
          Role Management
        </Text>
      </View>

      <View className="flex-1 p-4">
        {/* Cap indicator */}
        <View
          className="flex-row items-center gap-2 rounded-[10px] p-3 mb-3"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons name="shield-crown-outline" size={16} color={colors.primary} />
          <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
            {superadminCount} of {MAX_SUPERADMINS} superadmins in use
          </Text>
        </View>

        {/* Search */}
        <View
          className="flex-row items-center gap-2 rounded-[10px] px-3 h-10 mb-3.5"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email"
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-sm"
            style={{ color: colors.text }}
          />
        </View>

        <StatusFilterTabs
          options={[
            { key: "all", label: "All", count: allUsers.length },
            {
              key: "user",
              label: "User",
              count: allUsers.filter((u) => u.accountRole === "user").length,
            },
            {
              key: "admin",
              label: "Admin",
              count: allUsers.filter((u) => u.accountRole === "admin").length,
            },
            {
              key: "superadmin",
              label: "Superadmin",
              count: allUsers.filter((u) => u.accountRole === "superadmin").length,
            },
          ]}
          selected={roleFilter}
          onSelect={(key) => setRoleFilter(key as AccountRole | "all")}
        />

        <ScrollView contentContainerClassName="pb-6">
          {results.map((u) => {
            const meta = ROLE_META[u.accountRole];
            const isSelf = u.id === currentUserId;
            const isPending = pendingUserId === u.id;
            const atSuperadminCap =
              superadminCount >= MAX_SUPERADMINS && u.accountRole !== "superadmin";
            const initials = u.fullName
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <View
                key={u.id}
                className="rounded-xl p-3 mb-2.5"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <View className="flex-row items-center gap-2.5">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: u.avatarColor || colors.primary }}
                  >
                    <Text className="text-white text-xs font-bold">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {u.fullName}{" "}
                      {isSelf && (
                        <Text style={{ color: colors.textSecondary }}>(you)</Text>
                      )}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{ color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {u.email}
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center gap-1 rounded-full px-2 py-1"
                    style={{ backgroundColor: meta.color + "18" }}
                  >
                    <MaterialCommunityIcons name={meta.icon} size={12} color={meta.color} />
                    <Text className="text-[11px] font-bold" style={{ color: meta.color }}>
                      {meta.label}
                    </Text>
                  </View>
                </View>

                {isPending ? (
                  <View className="flex-row flex-wrap gap-2 mt-2.5">
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-2 mt-2.5">
                    {u.accountRole !== "user" && (
                      <Pressable
                        onPress={() => handleChangeRole(u, "user")}
                        className="px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: colors.backgroundElement }}
                      >
                        <Text
                          className="text-[11px] font-semibold"
                          style={{ color: colors.textSecondary }}
                        >
                          Set as User
                        </Text>
                      </Pressable>
                    )}
                    {u.accountRole !== "admin" && (
                      <Pressable
                        onPress={() => handleChangeRole(u, "admin")}
                        className="px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: colors.backgroundElement }}
                      >
                        <Text
                          className="text-[11px] font-semibold"
                          style={{ color: colors.textSecondary }}
                        >
                          Set as Admin
                        </Text>
                      </Pressable>
                    )}
                    {u.accountRole !== "superadmin" && (
                      <Pressable
                        onPress={() => handleChangeRole(u, "superadmin")}
                        disabled={atSuperadminCap}
                        className="px-2.5 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: colors.backgroundElement,
                          opacity: atSuperadminCap ? 0.4 : 1,
                        }}
                      >
                        <Text
                          className="text-[11px] font-semibold"
                          style={{ color: colors.textSecondary }}
                        >
                          {atSuperadminCap ? "Cap reached" : "Set as Superadmin"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {results.length === 0 && (
            <Text
              className="text-center text-[13px] mt-10"
              style={{ color: colors.textSecondary }}
            >
              No users match your search.
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}