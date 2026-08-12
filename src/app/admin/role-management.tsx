import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { AccountRole, isSuperadminRole } from "@/features/auth/types/auth.types";
import { useProfileStore, AdminUserSummary } from "@/features/profile/hooks/use-profile-data";

const MAX_SUPERADMINS = 5;

const ROLE_META: Record<AccountRole, { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
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

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const superadminCount = useMemo(() => getSuperadminCount(), [allUsers]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Role Management</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.capBox, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialCommunityIcons name="shield-crown-outline" size={16} color={colors.primary} />
          <Text style={[styles.capText, { color: colors.text }]}>
            {superadminCount} of {MAX_SUPERADMINS} superadmins in use
          </Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
          <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email"
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {results.map((u) => {
            const meta = ROLE_META[u.accountRole];
            const isSelf = u.id === currentUserId;
            const isPending = pendingUserId === u.id;
            const atSuperadminCap = superadminCount >= MAX_SUPERADMINS && u.accountRole !== "superadmin";

            const initials = u.fullName
              .split(" ")
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <View key={u.id} style={[styles.userCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.userRow}>
                  <View style={[styles.avatar, { backgroundColor: u.avatarColor || colors.primary }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {u.fullName} {isSelf && <Text style={{ color: colors.textSecondary }}>(you)</Text>}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                      {u.email}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: meta.color + "18" }]}>
                    <MaterialCommunityIcons name={meta.icon} size={12} color={meta.color} />
                    <Text style={[styles.roleBadgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                {isPending ? (
                  <View style={styles.actionsRow}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    {u.accountRole !== "user" && (
                      <Pressable
                        onPress={() => handleChangeRole(u, "user")}
                        style={[styles.actionButton, { backgroundColor: colors.backgroundElement }]}
                      >
                        <Text style={[styles.actionText, { color: colors.textSecondary }]}>Set as User</Text>
                      </Pressable>
                    )}
                    {u.accountRole !== "admin" && (
                      <Pressable
                        onPress={() => handleChangeRole(u, "admin")}
                        style={[styles.actionButton, { backgroundColor: colors.backgroundElement }]}
                      >
                        <Text style={[styles.actionText, { color: colors.textSecondary }]}>Set as Admin</Text>
                      </Pressable>
                    )}
                    {u.accountRole !== "superadmin" && (
                      <Pressable
                        onPress={() => handleChangeRole(u, "superadmin")}
                        disabled={atSuperadminCap}
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.backgroundElement, opacity: atSuperadminCap ? 0.4 : 1 },
                        ]}
                      >
                        <Text style={[styles.actionText, { color: colors.textSecondary }]}>
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
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users match your search.</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  back: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  content: { flex: 1, padding: 16 },
  capBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12, marginBottom: 12 },
  capText: { fontSize: 13, fontWeight: "600" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, height: 40, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 14 },
  userCard: { borderRadius: 12, padding: 12, marginBottom: 10 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  userName: { fontSize: 14, fontWeight: "600" },
  userEmail: { fontSize: 12, marginTop: 1 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  actionButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  actionText: { fontSize: 11, fontWeight: "600" },
  emptyText: { textAlign: "center", fontSize: 13, marginTop: 40 },
});
