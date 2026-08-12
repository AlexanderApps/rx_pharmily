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
import { FacilityType } from "@/features/profile/types/profile.types";
import LocationPicker from "@/shared/components/location-picker";

const FACILITY_TYPES: FacilityType[] = [
  "Retail Pharmacy",
  "Hospital",
  "Wholesale Distributor",
  "Diagnostic Lab",
  "Clinic",
  "Other",
];

export default function CreateFacilityScreen() {
  const { colors } = useTheme();
  const user = useProfileStore((state) => state.user);
  const submitFacilityCreationRequest = useProfileStore((state) => state.submitFacilityCreationRequest);

  const isVerified = user.kyc.status === "verified";

  const [name, setName] = useState("");
  const [type, setType] = useState<FacilityType>("Retail Pharmacy");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !location.trim() || !region.trim()) {
      Alert.alert("Missing information", "Name, location, and region are required.");
      return;
    }
    setSubmitting(true);
    const result = await submitFacilityCreationRequest({
      name,
      type,
      location,
      region,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      registrationNumber: registrationNumber || undefined,
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
          <Text style={[styles.title, { color: colors.text }]}>Create Facility</Text>
        </View>
        <View style={styles.blockedWrap}>
          <MaterialCommunityIcons name="shield-alert-outline" size={32} color={colors.warning} />
          <Text style={[styles.blockedTitle, { color: colors.text }]}>Verification required</Text>
          <Text style={[styles.blockedText, { color: colors.textSecondary }]}>
            Your account needs to be verified before you can request a new facility. Submit your KYC
            documents from your profile to get started.
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
          <Text style={[styles.title, { color: colors.text }]}>Create Facility</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.noticeBox, { backgroundColor: colors.primary + "12" }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.primary }]}>
              An admin reviews every new facility before it's created. Once approved, you'll be its
              Owner and can submit KYC documents to get it verified.
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            Facility Name <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Adenta Community Pharmacy"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Type</Text>
          <View style={styles.chipRow}>
            {FACILITY_TYPES.map((t) => (
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
              label="Location"
              required
              value={location}
              onChangeText={setLocation}
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
              placeholder="Adenta, Accra"
            />
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Region <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={region}
            onChangeText={setRegion}
            placeholder="Greater Accra"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
          />

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
            placeholder="facility@example.com"
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
