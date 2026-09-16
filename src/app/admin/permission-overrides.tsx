import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Platform } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore, AdminUserSummary } from "@/features/profile/hooks/use-profile-data";
import { usePermissionsStore } from "@/features/auth/hooks/use-permissions";

// Colors are the only thing not in the roles catalog (key/label/
// description) — purely a UI concern, not worth a DB column for.
// Falls back to a neutral color for any role added later without an
// entry here.
const ROLE_COLORS: Record<string, string> = {
  public: "#64748b",
  pharmacist: "#16a34a",
  pss: "#0d9488",
  auditor: "#0891b2",
  admin: "#2563eb",
  superadmin: "#9333ea",
};
const roleColor = (role: string) => ROLE_COLORS[role] ?? "#64748b";

export default function PermissionOverridesScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const allUsers = useProfileStore((state) => state.allUsers);
  const fetchAllUsers = useProfileStore((state) => state.fetchAllUsers);

  const catalog = usePermissionsStore((state) => state.catalog);
  const fetchCatalog = usePermissionsStore((state) => state.fetchCatalog);
  const rolesCatalog = usePermissionsStore((state) => state.rolesCatalog);
  const fetchRolesCatalog = usePermissionsStore((state) => state.fetchRolesCatalog);
  const targetUserEffective = usePermissionsStore((state) => state.targetUserEffective);
  const targetUserOverrides = usePermissionsStore((state) => state.targetUserOverrides);
  const targetUserRoles = usePermissionsStore((state) => state.targetUserRoles);
  const fetchTargetUser = usePermissionsStore((state) => state.fetchTargetUser);
  const setUserRoles = usePermissionsStore((state) => state.setUserRoles);
  const setOverride = usePermissionsStore((state) => state.setOverride);
  const clearOverride = usePermissionsStore((state) => state.clearOverride);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [reasonModalKey, setReasonModalKey] = useState<string | null>(null);
  const [reasonModalGranted, setReasonModalGranted] = useState(true);
  const [reasonText, setReasonText] = useState("");

  useEffect(() => {
    fetchAllUsers();
    fetchCatalog();
    fetchRolesCatalog();
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  const catalogByCategory = useMemo(() => {
    const groups = new Map<string, typeof catalog>();
    for (const entry of catalog) {
      const list = groups.get(entry.category) ?? [];
      list.push(entry);
      groups.set(entry.category, list);
    }
    return Array.from(groups.entries());
  }, [catalog]);

  const overridesByKey = useMemo(() => {
    const map = new Map<string, (typeof targetUserOverrides)[number]>();
    for (const o of targetUserOverrides) map.set(o.permissionKey, o);
    return map;
  }, [targetUserOverrides]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const openUser = async (user: AdminUserSummary) => {
    setSelectedUser(user);
    setIsLoadingTarget(true);
    await fetchTargetUser(user.id);
    setIsLoadingTarget(false);
  };

  const openReasonModal = (key: string, granted: boolean) => {
    const existing = overridesByKey.get(key);
    setReasonModalKey(key);
    setReasonModalGranted(granted);
    setReasonText(existing?.reason ?? "");
  };

  const confirmOverride = async () => {
    if (!selectedUser || !reasonModalKey) return;
    setPendingKey(reasonModalKey);
    const result = await setOverride(selectedUser.id, reasonModalKey, reasonModalGranted, reasonText);
    setPendingKey(null);
    setReasonModalKey(null);
    if (result.ok) {
      toast.success(`Override saved for ${selectedUser.fullName}.`);
    } else {
      toast.error(result.error ?? "Couldn't save override.");
    }
  };

  const handleClear = async (key: string) => {
    if (!selectedUser) return;
    setPendingKey(key);
    const result = await clearOverride(selectedUser.id, key);
    setPendingKey(null);
    if (result.ok) {
      toast.success("Reset to role default.");
    } else {
      toast.error(result.error ?? "Couldn't reset override.");
    }
  };

  const handleToggleRole = async (role: string) => {
    if (!selectedUser) return;
    setPendingRole(role);
    const next = targetUserRoles.includes(role)
      ? targetUserRoles.filter((r) => r !== role)
      : [...targetUserRoles, role];
    const result = await setUserRoles(selectedUser.id, next);
    setPendingRole(null);
    if (result.ok) {
      // Re-fetch rather than patch allUsers in place — mutating an
      // array's items directly wouldn't be seen as a state change by
      // Zustand/React (no new reference), and this is an infrequent
      // admin action, not a hot path worth an optimistic patch for.
      await fetchAllUsers();
      toast.success(`Roles updated for ${selectedUser.fullName}.`);
    } else {
      toast.error(result.error ?? "Couldn't update roles.");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
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
          Permission Overrides
        </Text>
      </View>

      <View className="flex-1 p-4">
        <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
          Everyone gets the union of permissions granted to every role they hold — use overrides
          below only for a genuine exception for one specific person. Manage what a role grants by
          default on the Role & Feature Permissions screen.
        </Text>

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

        <ScrollView contentContainerClassName="pb-6">
          {results.map((u) => {
            const initials = u.fullName
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const visibleRoles = u.roles.slice(0, 2);
            const extraCount = u.roles.length - visibleRoles.length;
            return (
              <Pressable
                key={u.id}
                onPress={() => openUser(u)}
                className="flex-row items-center gap-2.5 rounded-xl p-3 mb-2.5"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: u.avatarColor || colors.primary }}
                >
                  <Text className="text-white text-xs font-bold">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                    {u.fullName}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {u.email}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 mr-1">
                  {visibleRoles.map((role) => (
                    <View key={role} className="px-2 py-0.5 rounded-full" style={{ backgroundColor: roleColor(role) + "18" }}>
                      <Text className="text-[10px] font-bold" style={{ color: roleColor(role) }}>
                        {rolesCatalog.find((r) => r.key === role)?.label ?? role}
                      </Text>
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <Text className="text-[10px] font-bold" style={{ color: colors.textSecondary }}>
                      +{extraCount}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
            );
          })}
          {results.length === 0 && (
            <Text className="text-center text-[13px] mt-10" style={{ color: colors.textSecondary }}>
              No users match your search.
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Selected user's permission management sheet */}
      <Modal visible={!!selectedUser} animationType="slide" onRequestClose={() => setSelectedUser(null)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View
            className="flex-row items-center gap-3 px-4 py-3 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <Pressable onPress={() => setSelectedUser(null)} className="p-1">
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[15px] font-bold" style={{ color: colors.text }} numberOfLines={1}>
                {selectedUser?.fullName}
              </Text>
            </View>
          </View>

          <View className="px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
            <Text className="text-[11px] font-bold uppercase tracking-[0.5px] mb-2" style={{ color: colors.textSecondary }}>
              Roles
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {rolesCatalog
                .filter((r) => r.key !== "admin" && r.key !== "superadmin")
                .map((r) => {
                  const active = targetUserRoles.includes(r.key);
                  const locked = r.key === "public";
                  return (
                    <Pressable
                      key={r.key}
                      disabled={locked || pendingRole === r.key}
                      onPress={() => handleToggleRole(r.key)}
                      className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full border"
                      style={{
                        backgroundColor: active ? roleColor(r.key) + "18" : colors.backgroundElement,
                        borderColor: active ? roleColor(r.key) + "40" : colors.border,
                        opacity: locked ? 0.6 : 1,
                      }}
                    >
                      {pendingRole === r.key ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <MaterialCommunityIcons
                          name={active ? "check-circle" : "circle-outline"}
                          size={14}
                          color={active ? roleColor(r.key) : colors.textSecondary}
                        />
                      )}
                      <Text className="text-[12px] font-semibold" style={{ color: active ? roleColor(r.key) : colors.textSecondary }}>
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              {(targetUserRoles.includes("admin") || targetUserRoles.includes("superadmin")) && (
                <View className="flex-row items-center gap-2">
                  {targetUserRoles.includes("admin") && (
                    <View className="px-2.5 py-1.5 rounded-full" style={{ backgroundColor: roleColor("admin") + "18" }}>
                      <Text className="text-[12px] font-semibold" style={{ color: roleColor("admin") }}>Admin</Text>
                    </View>
                  )}
                  {targetUserRoles.includes("superadmin") && (
                    <View className="px-2.5 py-1.5 rounded-full" style={{ backgroundColor: roleColor("superadmin") + "18" }}>
                      <Text className="text-[12px] font-semibold" style={{ color: roleColor("superadmin") }}>Superadmin</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <Text className="text-[11px] mt-2" style={{ color: colors.textSecondary }}>
              Admin/Superadmin are managed via account role, not here — shown above only if held.
            </Text>
          </View>

          {isLoadingTarget ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          ) : (
            <ScrollView contentContainerClassName="p-4 pb-10">
              {catalogByCategory.map(([category, entries]) => (
                <View key={category} className="mb-5">
                  <Text
                    className="text-[11px] font-bold uppercase tracking-[0.5px] mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    {category}
                  </Text>
                  <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundSecondary }}>
                    {entries.map((entry, idx) => {
                      const effective = targetUserEffective[entry.key] ?? false;
                      const override = overridesByKey.get(entry.key);
                      const isPending = pendingKey === entry.key;
                      return (
                        <View
                          key={entry.key}
                          className="p-3"
                          style={{
                            borderBottomWidth: idx === entries.length - 1 ? 0 : 0.5,
                            borderBottomColor: colors.border,
                          }}
                        >
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-[13px] font-semibold flex-1 mr-2" style={{ color: colors.text }}>
                              {entry.description}
                            </Text>
                            <View
                              className="px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: (effective ? colors.success : colors.error) + "18" }}
                            >
                              <Text
                                className="text-[10px] font-bold"
                                style={{ color: effective ? colors.success : colors.error }}
                              >
                                {effective ? "Granted" : "Denied"}
                              </Text>
                            </View>
                          </View>
                          {override && (
                            <Text className="text-[11px] mb-1.5" style={{ color: colors.textSecondary }}>
                              Override: {override.granted ? "granted" : "denied"}
                              {override.reason ? ` — ${override.reason}` : ""}
                            </Text>
                          )}
                          {isPending ? (
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                          ) : (
                            <View className="flex-row flex-wrap gap-2">
                              <Pressable
                                onPress={() => openReasonModal(entry.key, true)}
                                className="px-2.5 py-1.5 rounded-lg"
                                style={{ backgroundColor: colors.backgroundElement }}
                              >
                                <Text className="text-[11px] font-semibold" style={{ color: colors.success }}>
                                  Grant
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => openReasonModal(entry.key, false)}
                                className="px-2.5 py-1.5 rounded-lg"
                                style={{ backgroundColor: colors.backgroundElement }}
                              >
                                <Text className="text-[11px] font-semibold" style={{ color: colors.error }}>
                                  Deny
                                </Text>
                              </Pressable>
                              {override && (
                                <Pressable
                                  onPress={() => handleClear(entry.key)}
                                  className="px-2.5 py-1.5 rounded-lg"
                                  style={{ backgroundColor: colors.backgroundElement }}
                                >
                                  <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                                    Reset to default
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Reason prompt — shown before saving any override */}
      <Modal visible={!!reasonModalKey} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View className="rounded-2xl p-[18px] gap-2.5" style={{ backgroundColor: colors.backgroundSecondary }}>
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {reasonModalGranted ? "Grant" : "Deny"} "{reasonModalKey}"
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              A short note for why this exception exists (optional, but recommended — this is the
              only record of why later).
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              className="min-h-16 border rounded-[10px] p-3 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
              multiline
              autoFocus
            />
            <View className="flex-row gap-2.5 mt-1">
              <Pressable
                onPress={() => setReasonModalKey(null)}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmOverride}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: reasonModalGranted ? colors.success : colors.error }}
              >
                <Text className="text-sm font-semibold" style={{ color: "#fff" }}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
