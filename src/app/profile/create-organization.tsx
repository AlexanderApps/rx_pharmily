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
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { OrganizationType } from "@/features/profile/types/profile.types";
import LocationPicker from "@/shared/components/location-picker";

const ORG_TYPES: OrganizationType[] = ["Pharmacy Chain", "Healthcare Group", "Distributor Network", "Other"];

export default function CreateOrganizationScreen() {
  const { colors } = useTheme();
  const user = useProfileStore((state) => state.user);
  const submitOrganizationCreationRequest = useProfileStore((state) => state.submitOrganizationCreationRequest);

  const isVerified = user.kyc.status === "verified";

  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType>("Pharmacy Chain");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [headquartersLocation, setHeadquartersLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing information", "Give the organization a name.");
      return;
    }
    setSubmitting(true);
    const result = await submitOrganizationCreationRequest({
      name,
      type,
      registrationNumber: registrationNumber || undefined,
      headquartersLocation: headquartersLocation || undefined,
      email: email || undefined,
      phone: phone || undefined,
      latitude,
      longitude,
    });
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert("Couldn't submit request", result.error ?? "Something went wrong.");
      return;
    }
    toast.success("Request submitted — an admin will review it.");
    router.back();
  };

  if (!isVerified) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Create Organization</Text>
        </View>
        <View style={styles.blockedWrap}>
          <MaterialCommunityIcons name="shield-alert-outline" size={32} color={colors.warning} />
          <Text style={[styles.blockedTitle, { color: colors.text }]}>Verification required</Text>
          <Text style={[styles.blockedText, { color: colors.textSecondary }]}>
            Your account needs to be verified before you can request a new organization. Submit your
            KYC documents from your profile to get started.
          </Text>
          <Pressable
            onPress={() => router.push("/profile/user-profile")}
            style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: 20 }]}
          >
            <Text style={styles.submitButtonText}>Go to My Profile</Text>
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
          <Text style={[styles.title, { color: colors.text }]}>Create Organization</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.noticeBox, { backgroundColor: colors.primary + "12" }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.primary }]}>
              An admin reviews every new organization before it's created. Once approved, you'll
              administer it and can submit KYC documents to get it verified.
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            Organization Name <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Adenta Pharmacy Group"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Type</Text>
          <View style={styles.chipRow}>
            {ORG_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: type === t ? colors.primary : colors.backgroundElement },
                ]}
              >
                <Text style={{ color: type === t ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 14 }}>
            <LocationPicker
              label="Headquarters Location"
              value={headquartersLocation}
              onChangeText={setHeadquartersLocation}
              latitude={latitude}
              longitude={longitude}
              onLocationCaptured={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              onLocationCleared={() => {
                setLatitude(undefined);
                setLongitude(undefined);
              }}
              placeholder="Accra, Ghana"
            />
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="024xxxxxxx"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="org@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Registration Number</Text>
          <TextInput
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="Business registration number"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1, marginTop: 24 }]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit for Review</Text>}
          </Pressable>

          <View style={{ height: 24 }} />
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
  noticeBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 12, marginBottom: 18 },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  submitButton: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  blockedWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  blockedTitle: { fontSize: 17, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  blockedText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
