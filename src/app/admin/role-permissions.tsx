import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Switch, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isSuperadminRole } from "@/features/auth/types/auth.types";
import { usePermissionsStore } from "@/features/auth/hooks/use-permissions";

// The 6 tiers get_user_base_role() can resolve to, in the order an
// admin would actually think about them — least to most access.
const TIERS: { key: string; label: string; description: string }[] = [
  { key: "public", label: "Public", description: "Any signed-in user, not yet KYC-verified." },
  { key: "verified_unclassified", label: "Unclassified", description: "KYC-verified, but no profession set yet (or set to \"Other\") — base features only until an admin sets one." },
  { key: "verified_pss", label: "PSS", description: "KYC-verified, profession is Technician or MCA." },
  { key: "verified_pharmacist", label: "Pharmacist", description: "KYC-verified, profession is Pharmacist." },
  { key: "admin", label: "Admin", description: "Platform admin (account_role)." },
  { key: "superadmin", label: "Superadmin", description: "Platform superadmin (account_role)." },
];

export default function RolePermissionsScreen() {
  const { colors } = useTheme();
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));

  const [selectedTier, setSelectedTier] = useState("public");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const catalog = usePermissionsStore((state) => state.catalog);
  const fetchCatalog = usePermissionsStore((state) => state.fetchCatalog);
  const roleDefaults = usePermissionsStore((state) => state.roleDefaults);
  const fetchRoleDefaults = usePermissionsStore((state) => state.fetchRoleDefaults);
  const setRoleDefault = usePermissionsStore((state) => state.setRoleDefault);

  useEffect(() => {
    fetchCatalog();
    fetchRoleDefaults();
  }, [fetchCatalog, fetchRoleDefaults]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, typeof catalog>();
    for (const entry of catalog) {
      if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
      byCategory.get(entry.category)!.push(entry);
    }
    return Array.from(byCategory.entries());
  }, [catalog]);

  if (!isSuperadmin) return <Redirect href="/(tabs)" />;

  const tierGrants = roleDefaults[selectedTier] ?? {};

  const handleToggle = async (permissionKey: string, next: boolean) => {
    setPendingKey(permissionKey);
    const result = await setRoleDefault(selectedTier, permissionKey, next);
    setPendingKey(null);
    if (!result.ok) {
      toast.error("Couldn't update this permission.");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Role & Profession Permissions" subtitle="Edit what each tier gets by default" />

      <StatusFilterTabs
        options={TIERS.map((t) => ({ key: t.key, label: t.label }))}
        selected={selectedTier}
        onSelect={setSelectedTier}
      />

      <Text className="text-xs px-4 pt-2 pb-1" style={{ color: colors.textSecondary }}>
        {TIERS.find((t) => t.key === selectedTier)?.description}
      </Text>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 20 }} showsVerticalScrollIndicator={false}>
        {grouped.map(([category, entries]) => (
          <View key={category} className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              {category}
            </Text>
            <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.border }}>
              {entries.map((entry, i) => (
                <View
                  key={entry.key}
                  className="flex-row items-center justify-between gap-3 px-4 py-3"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderTopWidth: i === 0 ? 0 : 0.5,
                    borderTopColor: colors.border,
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>{entry.key}</Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{entry.description}</Text>
                  </View>
                  {pendingKey === entry.key ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <Switch
                      value={tierGrants[entry.key] ?? false}
                      onValueChange={(next) => handleToggle(entry.key, next)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
