import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import ModernSwitch from "@/shared/components/switch";
import { router } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { ProfileRow, ProfileSection, PROFILE_VALUE_TEXT_CLASS as VALUE_TEXT_CLASS } from "@/shared/components/profile-row";
import LocationPicker from "@/shared/components/location-picker";
import { useUserFieldAccess } from "@/features/profile/hooks/use-user-field-access";
import AvatarUpload from "@/shared/components/avatar-upload";
import LoadingImage from "@/shared/components/loading-image";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { UserRole, UserTitle, UserGender } from "@/features/profile/types/profile.types";
import KycSection from "@/features/profile/components/kyc-section";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import ProfileUpdateRequestModal from "@/features/profile-updates/components/profile-update-request-modal";
import PhoneVerificationSheet from "@/features/profile/components/phone-verification-sheet";

const ROLES: UserRole[] = [
  "Pharmacist",
  "Pharmacy Technician",
  "Facility Admin",
  "Procurement Officer",
  "Other",
];

const TITLES: UserTitle[] = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr. (PharmD)",
  "Dr. (PhD)",
  "Dr. (MD)",
  "Prof.",
  "Other",
];

const GENDERS: UserGender[] = ["Male", "Female", "Other", "Prefer not to say"];

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
  const [title, setTitle] = useState<UserTitle | undefined>(user.title);
  const [gender, setGender] = useState<UserGender | undefined>(user.gender);
  const [isAvailableAsSuperintendent, setIsAvailableAsSuperintendent] = useState(
    user.isAvailableAsSuperintendent,
  );
  const referenceRegions = useReferenceDataStore((state) => state.regions);
  const regionOptions = useMemo(
    () => referenceRegions.map((r) => ({ id: r.name, label: r.name })),
    [referenceRegions],
  );

  const { role: viewerRole, canSee } = useUserFieldAccess(user);

  // Once verified, the locked fields (see LOCKED_FIELDS.user) can no
  // longer be changed directly through this form — a request, reviewed
  // by an admin, is required instead.
  const isVerified = user.kyc.status === "verified";
  const requestModalRef = useRef<BottomSheetModal>(null);
  const phoneVerificationRef = useRef<BottomSheetModal>(null);

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await updateUserProfile({
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
      title,
      gender,
      isAvailableAsSuperintendent,
    });
    setSaving(false);
    if (!ok) {
      toast.error("Couldn't save your profile. Please try again.");
      return;
    }
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

          {isVerified && (
            <Pressable
              onPress={() => requestModalRef.current?.present()}
              className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl mb-1"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons name="file-edit-outline" size={16} color={colors.primary} />
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Request Profile Update
              </Text>
            </Pressable>
          )}

          <ProfileSection title="Personal Details">
            <ProfileRow label="Full Name">
              {editing && !isVerified ? (
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                  style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                />
              ) : (
                <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{fullName || "-"}</Text>
              )}
            </ProfileRow>

            {canSee("email") && (
              <ProfileRow label="Email">
                {editing ? (
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                    style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                  />
                ) : (
                  <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{email || "-"}</Text>
                )}
              </ProfileRow>
            )}
            {canSee("phone") && (
              <ProfileRow label="Phone">
                {editing && !isVerified ? (
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                    style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                  />
                ) : (
                  <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{phone || "-"}</Text>
                )}
                {Boolean(phone) && user.phoneAdminApproved && (
                  user.phoneVerifiedAt ? (
                    <View className="flex-row items-center gap-1 mt-1.5">
                      <MaterialCommunityIcons name="check-decagram" size={13} color={colors.success} />
                      <Text className="text-xs font-semibold" style={{ color: colors.success }}>
                        Verified
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => phoneVerificationRef.current?.present()}
                      className="flex-row items-center gap-1 mt-1.5"
                    >
                      <MaterialCommunityIcons name="phone-alert-outline" size={13} color={colors.primary} />
                      <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                        Not verified — Verify Now
                      </Text>
                    </Pressable>
                  )
                )}
              </ProfileRow>
            )}

            <ProfileRow label="Ghana Post GPS Location">
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
                  <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{location || "-"}</Text>
                  {latitude !== undefined && longitude !== undefined && (
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </Text>
                  )}
                </>
              )}
            </ProfileRow>

            <ProfileRow label="Region">
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
                <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{region || "-"}</Text>
              )}
            </ProfileRow>


            <ProfileRow label="Gender">
              {editing ? (
                <View className="flex-row flex-wrap gap-2 mt-1.5">
                  {GENDERS.map((option) => {
                    const active = gender === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setGender(option)}
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
                <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{user.gender ?? "-"}</Text>
              )}
            </ProfileRow>

            <ProfileRow label="Bio">
              {editing ? (
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[70px]"
                  style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                />
              ) : (
                <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{bio || "-"}</Text>
              )}
            </ProfileRow>
          </ProfileSection>

          {/* Only a verified pharmacist can be marked available as
              superintendent — the DB itself enforces this via a
              trigger, this UI gate just avoids showing a control that
              would only ever fail to save for anyone else. */}
          {user.isPharmacist && (
            <View className="mt-3.5">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                Available as Superintendent
              </Text>
              {editing ? (
                <Pressable
                  onPress={() => setIsAvailableAsSuperintendent((prev) => !prev)}
                  className="flex-row items-center gap-2 mt-1.5"
                >
                  <MaterialCommunityIcons
                    name={isAvailableAsSuperintendent ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={20}
                    color={isAvailableAsSuperintendent ? colors.primary : colors.textSecondary}
                  />
                  <Text className="text-sm" style={{ color: colors.text }}>
                    I'm available to serve as a superintendent pharmacist
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-sm mt-1" style={{ color: colors.text }}>
                  {user.isAvailableAsSuperintendent ? "Available" : "Not available"}
                </Text>
              )}
            </View>
          )}

          <ProfileSection title="Professional Details">
            <ProfileRow label="Role">
              {editing && !isVerified ? (
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
                <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{user.role}</Text>
              )}
            </ProfileRow>

            {/* Always read-only, even in edit mode — profession is
                admin-only, set during KYC review, never through this
                self-service form. The DB itself enforces this with a
                trigger regardless; this is just not offering a control
                that would only ever fail to save. */}
            <ProfileRow label="Profession">
              <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>
                {user.profession ?? "Not yet set (assigned during KYC review)"}
              </Text>
            </ProfileRow>

            <ProfileRow label="Title">
              {editing && !isVerified ? (
                <View className="flex-row flex-wrap gap-2 mt-1.5">
                  {TITLES.map((option) => {
                    const active = title === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setTitle(option)}
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
                <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{user.title ?? "-"}</Text>
              )}
            </ProfileRow>

            {canSee("licenseNumber") && (
              <ProfileRow label="License Number">
                {editing && !isVerified ? (
                  <TextInput
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                    style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                  />
                ) : (
                  <Text className={VALUE_TEXT_CLASS} style={{ color: colors.text }}>{licenseNumber || "-"}</Text>
                )}
              </ProfileRow>
            )}
          </ProfileSection>

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
            My Facilities ({myFacilities.length})
          </Text>
          {myFacilities.length === 0 ? (
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              You're not a member of any facility yet.
            </Text>
          ) : (
            <View className="gap-2 mb-3.5">
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

          <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>Public Profile</Text>
          <Text className="text-xs leading-[17px] mb-2.5" style={{ color: colors.textSecondary }}>
            Anyone can see your name, avatar, and role when they tap your avatar. Email and phone
            are hidden unless you turn them on.
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>Show email publicly</Text>
            <ModernSwitch
              value={user.publicVisibility.showEmail}
              onValueChange={(value) => updateUserVisibility({ showEmail: value })}
              activeColor={colors.primary}
              size="small"
            />
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>Show phone publicly</Text>
            <ModernSwitch
              value={user.publicVisibility.showPhone}
              onValueChange={(value) => updateUserVisibility({ showPhone: value })}
              activeColor={colors.primary}
              size="small"
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

      <ProfileUpdateRequestModal
        ref={requestModalRef}
        entityType="user"
        entityId={user.id}
        currentValues={{
          fullName: user.fullName,
          phone: user.phone ?? null,
          profession: user.profession ?? null,
          title: user.title ?? null,
          licenseNumber: user.licenseNumber ?? null,
          role: user.role,
        }}
        onSubmitted={() => requestModalRef.current?.dismiss()}
      />

      <PhoneVerificationSheet
        ref={phoneVerificationRef}
        entityType="user"
        entityId={user.id}
        phone={phone}
        onVerified={() => phoneVerificationRef.current?.dismiss()}
      />
    </SafeAreaView>
  );
}
