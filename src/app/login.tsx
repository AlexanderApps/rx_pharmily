import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LogoMark from "@/shared/components/logo-mark";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";

export default function LoginScreen() {
  const { colors } = useTheme();
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't sign in.");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Platform.OS === "web" ? colors.backgroundSecondary : colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={
            Platform.OS === "web"
              ? { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 }
              : { padding: 24 }
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={
              Platform.OS === "web"
                ? {
                    width: "100%",
                    maxWidth: 440,
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 32,
                  }
                : undefined
            }
          >
          <View className="items-center mb-7 mt-3">
            <LogoMark size={64} style={{ marginBottom: 12 }} />
            <Text className="text-[22px] font-extrabold" style={{ color: colors.text }}>RxPharmily</Text>
            <Text className="text-[13px] mt-1" style={{ color: colors.textSecondary }}>
              Sign in to continue
            </Text>
          </View>

          <Text className="text-xs font-semibold" style={{ color: colors.text }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!submitting}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>Password</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            editable={!submitting}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          {error && (
            <View className="flex-row items-start gap-1.5 rounded-lg p-2.5 mt-3.5" style={{ backgroundColor: colors.error + "12" }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
              <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.error }}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            className="rounded-[10px] py-3.5 items-center mt-5"
            style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-[15px] font-bold">Sign In</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/signup")} className="items-center mt-4 mb-6">
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Don't have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign up</Text>
            </Text>
          </Pressable>

          <View style={{ height: 24 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

