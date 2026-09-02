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

export default function SignUpScreen() {
  const { colors } = useTheme();
  const signUp = useAuthStore((state) => state.signUp);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Fill in every field.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await signUp({ fullName, email, password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Couldn't create your account.");
      return;
    }
    if (result.needsEmailConfirmation) {
      setConfirmationSentTo(email.trim());
      return;
    }
    router.replace("/(tabs)");
  };

  if (confirmationSentTo) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: Platform.OS === "web" ? colors.backgroundSecondary : colors.background,
        }}
      >
        <View className="flex-1 items-center justify-center p-8">
          <View
            className="items-center"
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
            <View className="w-16 h-16 rounded-[18px] items-center justify-center mb-4" style={{ backgroundColor: colors.success + "18" }}>
              <MaterialCommunityIcons name="email-check-outline" size={30} color={colors.success} />
            </View>
            <Text className="text-xl font-extrabold mb-2.5" style={{ color: colors.text }}>Check your email</Text>
            <Text className="text-sm text-center leading-[21px]" style={{ color: colors.textSecondary }}>
              We sent a confirmation link to{" "}
              <Text style={{ fontWeight: "700", color: colors.text }}>{confirmationSentTo}</Text>. Tap it, then
              come back and sign in.
            </Text>
            <Pressable
              onPress={() => router.replace("/login")}
              className="rounded-[10px] py-3.5 items-center mt-6"
              style={{ backgroundColor: colors.primary, width: "100%" }}
            >
              <Text className="text-white text-[15px] font-bold">Back to Sign In</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Platform.OS === "web" ? colors.backgroundSecondary : colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 px-4 py-3 border-b-[0.5px]" style={{ borderBottomColor: colors.border, backgroundColor: colors.background }}>
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          )}
          <LogoMark size={22} />
          <Text className="text-[17px] font-bold" style={{ color: colors.text }}>Create Account</Text>
        </View>

        <ScrollView
          contentContainerStyle={
            Platform.OS === "web"
              ? { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 }
              : { padding: 20 }
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
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Doe"
            placeholderTextColor={colors.textSecondary}
            editable={!submitting}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>Email</Text>
          <TextInput
            ref={emailRef}
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
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            editable={!submitting}
            returnKeyType="go"
            onSubmitEditing={handleSignUp}
            className="border rounded-[10px] px-3.5 py-3 text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          <View className="flex-row items-start gap-2 rounded-[10px] p-3 mt-4" style={{ backgroundColor: colors.warning + "12" }}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
            <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.warning }}>
              New accounts start unverified. Submit KYC documents from your profile to get verified.
            </Text>
          </View>

          {error && (
            <View className="flex-row items-start gap-1.5 rounded-lg p-2.5 mt-3" style={{ backgroundColor: colors.error + "12" }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
              <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.error }}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSignUp}
            disabled={submitting}
            className="rounded-[10px] py-3.5 items-center mt-5"
            style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-[15px] font-bold">Create Account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} className="items-center mt-[18px]">
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign in</Text>
            </Text>
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

