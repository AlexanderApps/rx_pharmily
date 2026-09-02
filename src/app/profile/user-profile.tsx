import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import LocationPicker from "@/shared/components/location-picker";
import { useUserFieldAccess } from "@/features/profile/hooks/use-user-field-access";
import AvatarUpload from "@/shared/components/avatar-upload";
import LoadingImage from "@/shared/components/loading-image";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { UserRole } from "@/features/profile/types/profile.types";
import KycSection from "@/features/profile/components/kyc-section";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

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
  const [region, setRegion] = useState(user.region ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(user.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(user.longitude);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const referenceRegions = useReferenceDataStore((state) => state.regions);
  const regionOptions = useMemo(
    () => referenceRegions.map((r) => ({ id: r.name, label: r.name })),
    [referenceRegions],
  );

  const { role: viewerRole, canSee } = useUserFieldAccess(user);

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
      region: region.trim() || undefined,
      latitude,
      longitude,
      avatarUrl,
    });
    setEditing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScreenHeader
          title="My Profile"
          centered
          actions={
            <Pressable onPress={() => (editing ? handleSave() : setEditing(true))} className="p-1.5">
              <MaterialCommunityIcons
                name={editing ? "check" : "pencil-outline"}
                size={20}
                color={editing ? colors.primary : colors.text}
              />
            </Pressable>
          }
        />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-2">
            {editing ? (
              <AvatarUpload
                imageUri={avatarUrl}
                onImageSelected={setAvatarUrl}
                fallbackColor={user.avatarColor}
                fallbackContent={initials}
                size={72}
                uploadContext="avatars"
              />
            ) : avatarUrl ? (
              <LoadingImage source={{ uri: avatarUrl }} style={{ width: 72, height: 72 }} borderRadius={36} />
            ) : (
              <View className="w-[72px] h-[72px] rounded-full items-center justify-center" style={{ backgroundColor: user.avatarColor }}>
                <Text className="text-white text-2xl font-bold">{initials}</Text>
              </View>
            )}
          </View>

          <Field label="Full Name" editing={editing} value={fullName} onChange={setFullName} colors={colors} />
          {canSee("email") && (
            <Field label="Email" editing={editing} value={email} onChange={setEmail} colors={colors} keyboardType="email-address" />
          )}
          {canSee("phone") && (
            <Field label="Phone" editing={editing} value={phone} onChange={setPhone} colors={colors} keyboardType="phone-pad" />
          )}

          <View style={{ marginTop: 14 }}>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>Location</Text>
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
                <Text className="text-sm mt-1" style={{ color: colors.text }}>{location || "-"}</Text>
                {latitude !== undefined && longitude !== undefined && (
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Text>
                )}
              </>
            )}
          </View>

          <View style={{ marginTop: 14 }}>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>Region</Text>
            {editing ? (
              <ReferencePicker
                title="Select Region"
                options={regionOptions}
                value={region}
                onChange={setRegion}
                placeholder="Select a region"
                emptyMessage="No regions set up yet."
                searchable={false}
              />
            ) : (
              <Text className="text-sm mt-1" style={{ color: colors.text }}>{region || "-"}</Text>
            )}
          </View>

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>Role</Text>
          {editing ? (
            <View className="flex-row flex-wrap gap-2 mt-1.5">
              {ROLES.map((option) => {
                const active = role === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setRole(option)}
                    className="px-3 py-2 rounded-full"
                    style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text className="text-sm mt-1" style={{ color: colors.text }}>{user.role}</Text>
          )}

          {canSee("licenseNumber") && (
            <Field
              label="License Number"
              editing={editing}
              value={licenseNumber}
              onChange={setLicenseNumber}
              colors={colors}
            />
          )}
          <Field
            label="Bio"
            editing={editing}
            value={bio}
            onChange={setBio}
            colors={colors}
            multiline
          />

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
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
                  className="flex-row items-center gap-2 rounded-[10px] p-2.5"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                  <Text className="text-sm flex-1" style={{ color: colors.text }} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>Public Profile</Text>
          <Text className="text-xs leading-[17px] mb-2.5" style={{ color: colors.textSecondary }}>
            Anyone can see your name, avatar, and role when they tap your avatar. Email and phone
            are hidden unless you turn them on.
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>Show email publicly</Text>
            <Switch
              value={user.publicVisibility.showEmail}
              onValueChange={(value) => updateUserVisibility({ showEmail: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>Show phone publicly</Text>
            <Switch
              value={user.publicVisibility.showPhone}
              onValueChange={(value) => updateUserVisibility({ showPhone: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

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
      <Text className="text-xs font-semibold" style={{ color: colors.text }}>{label}</Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          multiline={multiline}
          className={`border rounded-lg px-3 py-2.5 text-sm mt-1.5${multiline ? " min-h-[70px]" : ""}`}
          style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
        />
      ) : (
        <Text className="text-sm mt-1" style={{ color: colors.text }}>{value || "-"}</Text>
      )}
    </View>
  );
}
