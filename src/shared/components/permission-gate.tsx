import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { usePermissionsStore } from "@/features/auth/hooks/use-permissions";

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  // Shown in the "denied" message — what this feature actually is, so
  // the message reads as "RxRFQ requires..." not a generic "this
  // feature requires...". Defaults to something generic if omitted.
  featureName?: string;
}

export default function PermissionGate({ permission, children, featureName }: PermissionGateProps) {
  const { colors } = useTheme();
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  const hasFetched = usePermissionsStore((state) => state.hasFetched);

  // Before the initial fetch resolves, show nothing rather than a
  // false "you can't do this" that would otherwise flash for a moment
  // on every screen load, even for someone who actually has access —
  // permissions default to an empty object until fetchPermissions
  // completes, which would otherwise look identical to "denied".
  if (!hasFetched) return null;

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  // Explicit background here — this replaces (not wraps) whatever the
  // caller would have rendered, including its own SafeAreaView/
  // background, so this denied state needs its own theme-correct
  // background rather than inheriting one that's no longer there.
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center px-8 gap-3">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons name="shield-lock-outline" size={28} color={colors.textSecondary} />
        </View>
        <Text className="text-base font-bold text-center" style={{ color: colors.text }}>
          Verification required
        </Text>
        <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
          {featureName ?? "This feature"} is available to verified professional accounts. Submit your
          KYC documents to get verified.
        </Text>
        <Pressable
          onPress={() => router.push("/profile/user-profile")}
          className="mt-2 px-5 py-2.5 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.background }}>
            Go to verification
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
