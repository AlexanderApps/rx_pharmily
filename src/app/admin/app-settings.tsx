import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
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
  const mediscopeDefaultDeadlineDays = useAppSettingsStore((state) => state.mediscopeDefaultDeadlineDays);
  const fetchAppSettings = useAppSettingsStore((state) => state.fetchAppSettings);
  const updateSetting = useAppSettingsStore((state) => state.updateSetting);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(String(mediscopeDefaultDeadlineDays));

  useEffect(() => {
    fetchAppSettings();
  }, [fetchAppSettings]);

  // Keeps the input in sync once the real value arrives from the fetch
  // above — the store starts at a hardcoded 30 before that resolves.
  useEffect(() => {
    setDeadlineInput(String(mediscopeDefaultDeadlineDays));
  }, [mediscopeDefaultDeadlineDays]);

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

  const handleSaveDeadline = async () => {
    const parsed = Number(deadlineInput);
    if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
      toast.error("Enter a whole number of days greater than 0.");
      return;
    }
    setIsSavingDeadline(true);
    const ok = await updateSetting("mediscope_default_deadline_days", parsed);
    setIsSavingDeadline(false);
    if (ok) toast.success("Saved.");
    else toast.error("Couldn't save the setting. Please try again.");
  };

  const deadlineChanged = deadlineInput !== String(mediscopeDefaultDeadlineDays);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="App Settings" subtitle="Global settings that apply across the whole app" />

      <View className="px-4 pt-4 gap-3">
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

        <View className="rounded-xl overflow-hidden px-4 py-3.5 gap-2.5" style={{ backgroundColor: colors.backgroundSecondary }}>
          <View>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              MediScope default deadline (days)
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              A MediScope request with no submission deadline of its own is treated as expiring
              this many days after it was posted, for feed and marketplace visibility.
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <TextInput
              value={deadlineInput}
              onChangeText={setDeadlineInput}
              keyboardType="number-pad"
              className="rounded-lg border px-3 py-2 text-sm w-20"
              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }}
            />
            <Pressable
              onPress={handleSaveDeadline}
              disabled={isSavingDeadline || !deadlineChanged}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary, opacity: isSavingDeadline || !deadlineChanged ? 0.5 : 1 }}
            >
              <Text className="text-sm font-semibold" style={{ color: "#ffffff" }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
