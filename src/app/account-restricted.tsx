import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

export default function AccountRestrictedScreen() {
  const { colors } = useTheme();
  const user = useProfileStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const isBanned = user.isBanned;
  const suspendedUntilLabel = user.suspendedUntil
    ? user.suspendedUntil.toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center px-6 gap-4">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.error + "18" }}
        >
          <MaterialCommunityIcons
            name={isBanned ? "account-cancel-outline" : "account-clock-outline"}
            size={30}
            color={colors.error}
          />
        </View>

        <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>
          {isBanned ? "Account Banned" : "Account Suspended"}
        </Text>

        <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
          {isBanned
            ? "Your account has been permanently banned and you no longer have access to RxPharmily."
            : "Your account has been temporarily suspended."}
        </Text>

        {!isBanned && suspendedUntilLabel && (
          <View
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="calendar-clock" size={15} color={colors.text} />
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Access returns {suspendedUntilLabel}
            </Text>
          </View>
        )}

        {user.moderationReason && (
          <View
            className="w-full rounded-xl p-3.5 gap-1"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              Reason
            </Text>
            <Text className="text-sm" style={{ color: colors.text }}>
              {user.moderationReason}
            </Text>
          </View>
        )}

        <Text className="text-xs text-center leading-[17px] mt-2" style={{ color: colors.textSecondary }}>
          If you believe this was a mistake, please contact support.
        </Text>

        <Pressable
          onPress={() => signOut()}
          className="mt-4 px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Sign Out
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
