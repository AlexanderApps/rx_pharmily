import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.confirmWrap}>
          <View style={[styles.logoWrap, { backgroundColor: colors.success + "18" }]}>
            <MaterialCommunityIcons name="email-check-outline" size={30} color={colors.success} />
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>Check your email</Text>
          <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
            We sent a confirmation link to{" "}
            <Text style={{ fontWeight: "700", color: colors.text }}>{confirmationSentTo}</Text>. Tap it, then
            come back and sign in.
          </Text>
          <Pressable
            onPress={() => router.replace("/login")}
            style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 24 }]}
          >
            <Text style={styles.submitButtonText}>Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <LogoMark size={22} />
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Doe"
            placeholderTextColor={colors.textSecondary}
            editable={!submitting}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!submitting}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            editable={!submitting}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <View style={[styles.noticeBox, { backgroundColor: colors.warning + "12" }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              New accounts start unverified. Submit KYC documents from your profile to get verified.
            </Text>
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "12" }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSignUp}
            disabled={submitting}
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.signInRow}>
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  back: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  content: { padding: 20 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 6,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 17 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 10, marginTop: 12 },
  errorText: { fontSize: 12, flex: 1, lineHeight: 17 },
  submitButton: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  signInRow: { alignItems: "center", marginTop: 18 },
  signInText: { fontSize: 13 },
  confirmWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  logoWrap: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  brandName: { fontSize: 20, fontWeight: "800", marginBottom: 10 },
  confirmText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
});
