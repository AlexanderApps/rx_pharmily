import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import ModernSwitch from "@/shared/components/switch";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isSuperadminRole } from "@/features/auth/types/auth.types";
import { useAppSettingsStore } from "@/features/app-settings/hooks/use-app-settings";
import { toast } from "@/shared/hooks/use-toast";

export default function AppSettingsScreen() {
  const { colors } = useTheme();
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));
  const showUserTitleInBrackets = useAppSettingsStore((state) => state.showUserTitleInBrackets);
  const fetchAppSettings = useAppSettingsStore((state) => state.fetchAppSettings);
  const updateSetting = useAppSettingsStore((state) => state.updateSetting);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAppSettings();
  }, [fetchAppSettings]);

  // RLS already enforces superadmin-only writes on the underlying
  // table regardless of this check — this is just what keeps a plain
  // admin from seeing a toggle that would only ever fail to save.
  if (!isSuperadmin) {
    return <Redirect href="/admin" />;
  }

  const handleToggle = async (value: boolean) => {
    setIsSaving(true);
    const ok = await updateSetting("show_user_title_in_brackets", value);
    setIsSaving(false);
    if (!ok) toast.error("Couldn't save the setting. Please try again.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="App Settings" subtitle="Global settings that apply across the whole app" />

      <View className="px-4 pt-4">
        <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundSecondary }}>
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Show title before name
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                When on, a user's title shows in brackets before their name everywhere it's
                displayed, e.g. "[Dr.] Ama Owusu".
              </Text>
            </View>
            <ModernSwitch
              value={showUserTitleInBrackets}
              onValueChange={handleToggle}
              disabled={isSaving}
              activeColor={colors.primary}
              size="small"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
