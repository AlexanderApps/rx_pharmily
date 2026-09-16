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

export default function RolePermissionsScreen() {
  const { colors } = useTheme();
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));

  const [selectedRole, setSelectedRole] = useState("public");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const catalog = usePermissionsStore((state) => state.catalog);
  const fetchCatalog = usePermissionsStore((state) => state.fetchCatalog);
  const rolesCatalog = usePermissionsStore((state) => state.rolesCatalog);
  const fetchRolesCatalog = usePermissionsStore((state) => state.fetchRolesCatalog);
  const roleDefaults = usePermissionsStore((state) => state.roleDefaults);
  const fetchRoleDefaults = usePermissionsStore((state) => state.fetchRoleDefaults);
  const setRoleDefault = usePermissionsStore((state) => state.setRoleDefault);
  const roleFeatures = usePermissionsStore((state) => state.roleFeatures);
  const fetchRoleFeatures = usePermissionsStore((state) => state.fetchRoleFeatures);
  const setRoleFeature = usePermissionsStore((state) => state.setRoleFeature);

  useEffect(() => {
    fetchCatalog();
    fetchRolesCatalog();
    fetchRoleDefaults();
    fetchRoleFeatures();
  }, [fetchCatalog, fetchRolesCatalog, fetchRoleDefaults, fetchRoleFeatures]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, typeof catalog>();
    for (const entry of catalog) {
      if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
      byCategory.get(entry.category)!.push(entry);
    }
    return Array.from(byCategory.entries());
  }, [catalog]);

  // Every distinct feature (category) across the whole catalog, for
  // the Features toggle row — derived from the same permissions
  // catalog rather than a separate fetch, since a feature is just a
  // permissions.category value.
  const allFeatures = useMemo(() => Array.from(new Set(catalog.map((entry) => entry.category))).sort(), [catalog]);

  if (!isSuperadmin) return <Redirect href="/(tabs)" />;

  const roleGrants = roleDefaults[selectedRole] ?? {};
  const featureGrants = roleFeatures[selectedRole] ?? {};

  const handleTogglePermission = async (permissionKey: string, next: boolean) => {
    setPendingKey(permissionKey);
    const result = await setRoleDefault(selectedRole, permissionKey, next);
    setPendingKey(null);
    if (!result.ok) {
      toast.error("Couldn't update this permission.");
    }
  };

  const handleToggleFeature = async (feature: string, next: boolean) => {
    setPendingKey(feature);
    const result = await setRoleFeature(selectedRole, feature, next);
    setPendingKey(null);
    if (!result.ok) {
      toast.error("Couldn't update this feature.");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Role & Feature Permissions" subtitle="Edit what each role gets by default" />

      <StatusFilterTabs
        options={rolesCatalog.map((r) => ({ key: r.key, label: r.label }))}
        selected={selectedRole}
        onSelect={setSelectedRole}
      />

      <Text className="text-xs px-4 pt-2 pb-1" style={{ color: colors.textSecondary }}>
        {rolesCatalog.find((r) => r.key === selectedRole)?.description}
      </Text>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
            Features
          </Text>
          <Text className="text-xs -mt-1 mb-1" style={{ color: colors.textSecondary }}>
            Whether this role sees a feature at all — nav, screens. Fine-grained actions within a
            feature are set separately below.
          </Text>
          <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.border }}>
            {allFeatures.map((feature, i) => (
              <View
                key={feature}
                className="flex-row items-center justify-between gap-3 px-4 py-3"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: colors.border,
                }}
              >
                <Text className="text-sm font-semibold flex-1" style={{ color: colors.text }}>{feature}</Text>
                {pendingKey === feature ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Switch
                    value={featureGrants[feature] ?? false}
                    onValueChange={(next) => handleToggleFeature(feature, next)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

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
                      value={roleGrants[entry.key] ?? false}
                      onValueChange={(next) => handleTogglePermission(entry.key, next)}
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
