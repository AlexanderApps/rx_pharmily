import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LogoMark from "@/shared/components/logo-mark";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

export default function AcceptTermsScreen() {
  const { colors } = useTheme();
  const acceptTerms = useProfileStore((state) => state.acceptTerms);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!accepted) {
      setError("You need to agree to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await acceptTerms();
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't record your acceptance. Try again.");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 440 }} className="items-center">
          <LogoMark size={40} />
          <Text className="text-xl font-extrabold text-center mt-4" style={{ color: colors.text }}>
            Our Terms have been updated
          </Text>
          <Text className="text-sm text-center leading-[21px] mt-2" style={{ color: colors.textSecondary }}>
            Before continuing, please review and agree to our Terms of Service and Privacy Policy.
          </Text>

          <Pressable
            onPress={() => setAccepted((v) => !v)}
            className="flex-row items-start gap-2.5 mt-6 w-full rounded-xl p-3.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <View
              className="w-[18px] h-[18px] rounded-[5px] items-center justify-center mt-0.5"
              style={{
                backgroundColor: accepted ? colors.primary : "transparent",
                borderWidth: accepted ? 0 : 1.5,
                borderColor: colors.border,
              }}
            >
              {accepted && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
            </View>
            <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.textSecondary }}>
              I agree to the{" "}
              <Text onPress={() => router.push("/help/eula")} style={{ color: colors.primary, fontWeight: "700" }}>
                Terms of Service
              </Text>
              {" "}and{" "}
              <Text onPress={() => router.push("/help/privacy-policy")} style={{ color: colors.primary, fontWeight: "700" }}>
                Privacy Policy
              </Text>
              .
            </Text>
          </Pressable>

          {error && (
            <View className="flex-row items-start gap-1.5 rounded-lg p-2.5 mt-3 w-full" style={{ backgroundColor: colors.error + "12" }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
              <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.error }}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleContinue}
            disabled={submitting}
            className="rounded-[10px] py-3.5 items-center mt-5 w-full"
            style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-[15px] font-bold">Continue</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
