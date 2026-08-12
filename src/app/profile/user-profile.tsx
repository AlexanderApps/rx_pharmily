import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LocationPicker from "@/shared/components/location-picker";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { UserRole } from "@/features/profile/types/profile.types";
import KycSection from "@/features/profile/components/kyc-section";

const ROLES: UserRole[] = [
  "Pharmacist",
  "Pharmacy Technician",
  "Facility Admin",
  "Procurement Officer",
  "Other",
];

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const user = useProfileStore((state) => state.user);
  const fetchKycDocuments = useProfileStore((state) => state.fetchKycDocuments);

  useEffect(() => {
    if (user.id) fetchKycDocuments("user", user.id);
  }, [user.id]);

  const facilities = useProfileStore((state) => state.facilities);
  const facilityMemberships = useProfileStore((state) => state.facilityMemberships);
  const myFacilities = useMemo(() => {
    const myIds = new Set(
      facilityMemberships.filter((m) => m.userId === user.id).map((m) => m.facilityId),
    );
    return facilities.filter((f) => myIds.has(f.id));
  }, [facilities, facilityMemberships, user.id]);
  const updateUserProfile = useProfileStore((state) => state.updateUserProfile);
  const updateUserVisibility = useProfileStore((state) => state.updateUserVisibility);
  const addKycDocument = useProfileStore((state) => state.addKycDocument);
  const removeKycDocument = useProfileStore((state) => state.removeKycDocument);
  const submitKyc = useProfileStore((state) => state.submitKyc);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [licenseNumber, setLicenseNumber] = useState(user.licenseNumber ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(user.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user.longitude);

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSave = () => {
    updateUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      licenseNumber: licenseNumber.trim() || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      latitude,
      longitude,
    });
    setEditing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>
          <Pressable onPress={() => (editing ? handleSave() : setEditing(true))} style={styles.back}>
            <MaterialCommunityIcons
              name={editing ? "check" : "pencil-outline"}
              size={20}
              color={editing ? colors.primary : colors.text}
            />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <Field label="Full Name" editing={editing} value={fullName} onChange={setFullName} colors={colors} />
          <Field label="Email" editing={editing} value={email} onChange={setEmail} colors={colors} keyboardType="email-address" />
          <Field label="Phone" editing={editing} value={phone} onChange={setPhone} colors={colors} keyboardType="phone-pad" />

          <View style={{ marginTop: 14 }}>
            <Text style={[styles.label, { color: colors.text }]}>Location</Text>
            {editing ? (
              <LocationPicker
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
              />
            ) : (
              <>
                <Text style={[styles.value, { color: colors.text, marginTop: 4 }]}>{location || "-"}</Text>
                {latitude !== undefined && longitude !== undefined && (
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Text>
                )}
              </>
            )}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Role</Text>
          {editing ? (
            <View style={styles.chipRow}>
              {ROLES.map((option) => {
                const active = role === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setRole(option)}
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
                  >
                    <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.value, { color: colors.text, marginTop: 4 }]}>{user.role}</Text>
          )}

          <Field
            label="License Number"
            editing={editing}
            value={licenseNumber}
            onChange={setLicenseNumber}
            colors={colors}
          />
          <Field
            label="Bio"
            editing={editing}
            value={bio}
            onChange={setBio}
            colors={colors}
            multiline
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>
            My Facilities ({myFacilities.length})
          </Text>
          {myFacilities.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              You're not a member of any facility yet.
            </Text>
          ) : (
            <View style={{ gap: 8, marginBottom: 14 }}>
              {myFacilities.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() =>
                    router.push({ pathname: "/profile/facility-profile", params: { id: f.id } })
                  }
                  style={[styles.facilityRow, { backgroundColor: colors.backgroundElement }]}
                >
                  <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                  <Text style={[styles.value, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Public Profile</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Anyone can see your name, avatar, and role when they tap your avatar. Email and phone
            are hidden unless you turn them on.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show email publicly</Text>
            <Switch
              value={user.publicVisibility.showEmail}
              onValueChange={(value) => updateUserVisibility({ showEmail: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show phone publicly</Text>
            <Switch
              value={user.publicVisibility.showPhone}
              onValueChange={(value) => updateUserVisibility({ showPhone: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <KycSection
            entityType="user"
            entityId={user.id}
            kyc={user.kyc}
            documentTypes={["Government ID", "Pharmacist License", "Other"]}
            onAddDocument={(type, fileName, imageUri) =>
              addKycDocument("user", user.id, type, fileName, imageUri)
            }
            onRemoveDocument={(id) => removeKycDocument("user", user.id, id)}
            onSubmit={() => submitKyc("user", user.id)}
          />

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  editing,
  value,
  onChange,
  colors,
  keyboardType,
  multiline,
}: {
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  keyboardType?: "email-address" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[
            styles.input,
            multiline && styles.textArea,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
          ]}
        />
      ) : (
        <Text style={[styles.value, { color: colors.text, marginTop: 4 }]}>{value || "-"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },
  content: { padding: 16 },
  avatarRow: { alignItems: "center", marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 70 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, marginVertical: 18 },
  helperText: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleLabel: { fontSize: 13, fontWeight: "500" },
  facilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
  },
});
