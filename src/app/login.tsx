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

export default function LoginScreen() {
  const { colors } = useTheme();
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBlock}>
            <LogoMark size={64} style={{ marginBottom: 12 }} />
            <Text style={[styles.brandName, { color: colors.text }]}>RxPharmily</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              Sign in to continue
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
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
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            editable={!submitting}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "12" }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/signup")} style={styles.signUpRow}>
            <Text style={[styles.signUpText, { color: colors.textSecondary }]}>
              Don't have an account? <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign up</Text>
            </Text>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24 },
  brandBlock: { alignItems: "center", marginBottom: 28, marginTop: 12 },
  brandName: { fontSize: 22, fontWeight: "800" },
  brandSubtitle: { fontSize: 13, marginTop: 4 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 6,
  },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 10, marginTop: 14 },
  errorText: { fontSize: 12, flex: 1, lineHeight: 17 },
  submitButton: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  signUpRow: { alignItems: "center", marginTop: 16, marginBottom: 24 },
  signUpText: { fontSize: 13 },
});
