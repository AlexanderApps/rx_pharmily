import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import LocationPicker from "@/shared/components/location-picker";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import AvatarUpload from "@/shared/components/avatar-upload";
import LoadingImage from "@/shared/components/loading-image";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { FacilityType } from "@/features/profile/types/profile.types";
import KycSection from "@/features/profile/components/kyc-section";
import { useFacilityFieldAccess } from "@/features/profile/hooks/use-facility-field-access";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

const FACILITY_TYPES: FacilityType[] = [
  "Retail Pharmacy",
  "Hospital",
  "Wholesale Distributor",
  "Diagnostic Lab",
  "Clinic",
  "Other",
];

export default function FacilityProfileScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const params = useLocalSearchParams<{ id?: string }>();

  const facilities = useProfileStore((state) => state.facilities);
  const facilityMemberships = useProfileStore((state) => state.facilityMemberships);
  const membershipRequests = useProfileStore((state) => state.facilityMembershipRequests);
  const organizations = useProfileStore((state) => state.organizations);
  const facilityOrgRequests = useProfileStore((state) => state.facilityOrganizationRequests);
  const user = useProfileStore((state) => state.user);
  const updateFacilityProfile = useProfileStore((state) => state.updateFacilityProfile);
  const updateFacilityVisibility = useProfileStore((state) => state.updateFacilityVisibility);
  const addKycDocument = useProfileStore((state) => state.addKycDocument);
  const removeKycDocument = useProfileStore((state) => state.removeKycDocument);
  const submitKyc = useProfileStore((state) => state.submitKyc);
  const requestFacilityMembership = useProfileStore((state) => state.requestFacilityMembership);
  const removeFacilityMember = useProfileStore((state) => state.removeFacilityMember);
  const requestFacilityOrganizationLink = useProfileStore(
    (state) => state.requestFacilityOrganizationLink,
  );
  const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
  const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);
  const fetchFacilityMembers = useProfileStore((state) => state.fetchFacilityMembers);
  const fetchFacilityMembershipRequests = useProfileStore(
    (state) => state.fetchFacilityMembershipRequests,
  );
  const fetchFacilityOrganizationRequests = useProfileStore(
    (state) => state.fetchFacilityOrganizationRequests,
  );
  const fetchKycDocuments = useProfileStore((state) => state.fetchKycDocuments);

  const [isLoadingFacility, setIsLoadingFacility] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchFacilities(),
      fetchOrganizations(),
      fetchFacilityOrganizationRequests(),
    ]).finally(() => setIsLoadingFacility(false));
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchFacilityMembers(params.id);
      fetchFacilityMembershipRequests(params.id);
      fetchKycDocuments("facility", params.id);
    }
  }, [params.id]);

  const members = useMemo(
    () => (params.id ? facilityMemberships.filter((m) => m.facilityId === params.id) : []),
    [facilityMemberships, params.id],
  );
  const pendingRequests = useMemo(
    () =>
      params.id
        ? membershipRequests.filter(
            (r) => r.facilityId === params.id && r.status === "pending",
          )
        : [],
    [membershipRequests, params.id],
  );
  const facility = useMemo(
    () => facilities.find((f) => f.id === params.id),
    [facilities, params.id],
  );

  const [editing, setEditing] = useState(false);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [linkingOrgId, setLinkingOrgId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [name, setName] = useState(facility?.name ?? "");
  const [type, setType] = useState<FacilityType>(facility?.type ?? "Retail Pharmacy");
  const [location, setLocation] = useState(facility?.location ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(facility?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(facility?.longitude);
  const [logoUrl, setLogoUrl] = useState(facility?.logoUrl);
  const [region, setRegion] = useState(facility?.region ?? "");
  const referenceRegions = useReferenceDataStore((state) => state.regions);
  const regionOptions = useMemo(
    () => referenceRegions.map((r) => ({ id: r.name, label: r.name })),
    [referenceRegions],
  );
  const [address, setAddress] = useState(facility?.address ?? "");
  const [phone, setPhone] = useState(facility?.phone ?? "");
  const [email, setEmail] = useState(facility?.email ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(
    facility?.registrationNumber ?? "",
  );

  // useState's initial value is only read on the very first render — on a
  // cold refresh, `facility` starts undefined and these fields would
  // otherwise stay stuck on their empty defaults forever, even after
  // `facilities` finishes loading and `facility` resolves correctly.
  useEffect(() => {
    if (!facility || editing) return;
    setName(facility.name);
    setType(facility.type);
    setLocation(facility.location);
    setLatitude(facility.latitude);
    setLongitude(facility.longitude);
    setRegion(facility.region);
    setAddress(facility.address ?? "");
    setPhone(facility.phone ?? "");
    setEmail(facility.email ?? "");
    setRegistrationNumber(facility.registrationNumber ?? "");
    setLogoUrl(facility.logoUrl);
  }, [facility, editing]);

  const { role: viewerRole, canSee } = useFacilityFieldAccess(facility);

  if (!facility) {
    if (isLoadingFacility) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>
          No facility found.
        </Text>
      </SafeAreaView>
    );
  }

  const isVerified = facility.kyc.status === "verified";
  const isUserVerified = user.kyc.status === "verified";
  const isOwner = viewerRole === "owner";
  const isMember = viewerRole === "owner" || viewerRole === "member";
  const canManageMembers = viewerRole === "owner" || viewerRole === "admin";
  const myPendingRequest = membershipRequests.find(
    (r) =>
      r.facilityId === facility.id &&
      r.requestedBy === currentUserId &&
      r.status === "pending",
  );
  const orgLinkPendingRequest = facilityOrgRequests.find(
    (r) => r.facilityId === facility.id && r.status === "pending",
  );
  const linkedOrganization = organizations.find((o) => o.id === facility.organizationId);
  const eligibleOrganizations = organizations.filter((o) => o.kyc.status === "verified");

  const handleRequestOrgLink = async (organizationId: string) => {
    setLinkingOrgId(organizationId);
    const result = await requestFacilityOrganizationLink(facility.id, organizationId);
    setLinkingOrgId(null);
    if (!result.ok) {
      Alert.alert("Couldn't request to join", result.error ?? "Something went wrong.");
      return;
    }
    setShowOrgPicker(false);
  };

  const handleSave = () => {
    updateFacilityProfile(facility.id, {
      name: name.trim(),
      type,
      location: location.trim(),
      region: region.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      latitude,
      longitude,
      logoUrl,
    });
    setEditing(false);
  };

  const handleRequestJoin = async () => {
    setRequesting(true);
    const result = await requestFacilityMembership(facility.id);
    setRequesting(false);
    if (!result.ok) {
      Alert.alert("Couldn't request to join", result.error ?? "Something went wrong.");
    }
  };

  const handleRemoveMember = async (membershipId: string, memberLabel: string) => {
    const ok = await confirm({
      title: "Remove member?",
      message: `${memberLabel} will lose access to this facility's shared resources.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await removeFacilityMember(membershipId);
    toast.success("Member removed.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <ScreenHeader
          title={facility.name}
          centered
          actions={
            isOwner && (
              <Pressable
                onPress={() => (editing ? handleSave() : setEditing(true))}
                className="p-1.5"
              >
                <MaterialCommunityIcons
                  name={editing ? "check" : "pencil-outline"}
                  size={20}
                  color={editing ? colors.primary : colors.text}
                />
              </Pressable>
            )
          }
        />

        <ScrollView
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View className="items-center mb-2">
            {editing ? (
              <AvatarUpload
                imageUri={logoUrl}
                onImageSelected={setLogoUrl}
                fallbackColor={colors.success + "18"}
                fallbackContent={
                  <MaterialCommunityIcons
                    name="hospital-building"
                    size={30}
                    color={colors.success}
                  />
                }
                size={72}
                uploadContext="logos"
              />
            ) : logoUrl ? (
              <LoadingImage
                source={{ uri: logoUrl }}
                style={{ width: 72, height: 72, borderRadius: 20 }}
                borderRadius={36}
              />
            ) : (
              <View
                className="w-[72px] h-[72px] rounded-[20px] items-center justify-center"
                style={{ backgroundColor: colors.success + "18" }}
              >
                <MaterialCommunityIcons
                  name="hospital-building"
                  size={30}
                  color={colors.success}
                />
              </View>
            )}
          </View>

          <Field label="Facility Name" editing={editing} value={name} onChange={setName} colors={colors} />

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Type
          </Text>
          {editing ? (
            <View className="flex-row flex-wrap gap-2 mt-1.5">
              {FACILITY_TYPES.map((option) => {
                const active = type === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setType(option)}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: active
                        ? colors.primary
                        : colors.backgroundElement,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: active ? "#fff" : colors.textSecondary }}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text className="text-sm mt-1" style={{ color: colors.text }}>
              {facility.type}
            </Text>
          )}

          <View className="mt-3.5">
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Location
            </Text>
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
                <Text className="text-sm mt-1" style={{ color: colors.text }}>
                  {location || "-"}
                </Text>
                {latitude !== undefined && longitude !== undefined && (
                  <Text
                    className="text-[11px] mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </Text>
                )}
              </>
            )}
          </View>

          <View className="mt-3.5">
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Region
            </Text>
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
              <Text className="text-sm mt-1" style={{ color: colors.text }}>
                {region || "-"}
              </Text>
            )}
          </View>
          <Field label="Address" editing={editing} value={address} onChange={setAddress} colors={colors} />
          {canSee("phone") && (
            <Field
              label="Phone"
              editing={editing}
              value={phone}
              onChange={setPhone}
              colors={colors}
              keyboardType="phone-pad"
            />
          )}
          {canSee("email") && (
            <Field
              label="Email"
              editing={editing}
              value={email}
              onChange={setEmail}
              colors={colors}
              keyboardType="email-address"
            />
          )}
          {canSee("registrationNumber") && (
            <Field
              label="Registration Number"
              editing={editing}
              value={registrationNumber}
              onChange={setRegistrationNumber}
              colors={colors}
            />
          )}

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          {/* Members */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Members ({members.length})
            </Text>
          </View>

          {!isVerified && (
            <View
              className="flex-row items-start gap-1.5 rounded-[10px] p-2.5 mb-2.5"
              style={{ backgroundColor: colors.warning + "12" }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color={colors.warning}
              />
              <Text
                className="text-xs flex-1 leading-[17px]"
                style={{ color: colors.warning }}
              >
                Verify this facility to unlock shared resources (price templates, facility
                chat) and let verified users request to join.
              </Text>
            </View>
          )}

          {isVerified && !isUserVerified && !isMember && !myPendingRequest && (
            <View
              className="flex-row items-start gap-1.5 rounded-[10px] p-2.5 mb-2.5"
              style={{ backgroundColor: colors.warning + "12" }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color={colors.warning}
              />
              <Text
                className="text-xs flex-1 leading-[17px]"
                style={{ color: colors.warning }}
              >
                Verify your own account before requesting to join a facility.
              </Text>
            </View>
          )}

          {isVerified && isUserVerified && !isMember && !myPendingRequest && (
            <Pressable
              onPress={handleRequestJoin}
              disabled={requesting}
              className="py-2.5 rounded-lg items-center mb-3"
              style={{
                backgroundColor: colors.primary,
                opacity: requesting ? 0.6 : 1,
              }}
            >
              <Text className="text-white text-[13px] font-semibold">
                {requesting ? "Requesting..." : "Request to Join"}
              </Text>
            </Pressable>
          )}

          {myPendingRequest && (
            <View
              className="flex-row items-start gap-1.5 rounded-[10px] p-2.5 mb-2.5"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                className="text-xs flex-1 leading-[17px]"
                style={{ color: colors.textSecondary }}
              >
                Your request to join is pending review.
              </Text>
            </View>
          )}

          {canManageMembers && pendingRequests.length > 0 && (
            <View className="gap-2 mb-3">
              <Text
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Pending Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map((request) => (
                <View
                  key={request.id}
                  className="flex-row items-center gap-2.5 rounded-[10px] p-2.5"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: request.requesterAvatarColor }}
                  >
                    <Text className="text-white text-[11px] font-bold">
                      {request.requesterName
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {request.requesterName}
                    </Text>
                    <Text
                      className="text-[11px]"
                      style={{ color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {request.requesterEmail}
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ backgroundColor: colors.backgroundSecondary }}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={12}
                      color={colors.textSecondary}
                    />
                    <Text
                      className="text-[11px] font-semibold"
                      style={{ color: colors.textSecondary }}
                    >
                      Pending admin review
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className="gap-2">
            {members.map((member) => (
              <View
                key={member.id}
                className="flex-row items-center gap-2.5 rounded-[10px] p-2.5"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  <Text className="text-white text-[11px] font-bold">
                    {member.userName
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {member.userName}
                  </Text>
                  <Text
                    className="text-[11px] mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {member.role}
                  </Text>
                </View>
                {member.role !== "Owner" && canManageMembers && (
                  <Pressable
                    onPress={() => handleRemoveMember(member.id, member.userName)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {isVerified && (
            <View className="flex-row gap-2 mt-3.5">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/profile/price-templates",
                    params: { facilityId: facility.id },
                  })
                }
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <MaterialCommunityIcons
                  name="file-table-outline"
                  size={16}
                  color={colors.text}
                />
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  Price Templates
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/chat")}
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={16}
                  color={colors.text}
                />
                <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                  Facility Chat
                </Text>
              </Pressable>
            </View>
          )}

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          {/* Public Profile */}
          <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>
            Public Profile
          </Text>
          <Text
            className="text-xs leading-[17px] mb-2.5"
            style={{ color: colors.textSecondary }}
          >
            Shown to anyone who taps this facility's avatar. Contact details are visible
            by default for facilities — turn them off if you'd rather keep them private.
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              Show email publicly
            </Text>
            <Switch
              value={facility.publicVisibility.showEmail}
              onValueChange={(value) =>
                updateFacilityVisibility(facility.id, { showEmail: value })
              }
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              Show phone publicly
            </Text>
            <Switch
              value={facility.publicVisibility.showPhone}
              onValueChange={(value) =>
                updateFacilityVisibility(facility.id, { showPhone: value })
              }
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          {/* Organization */}
          <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
            Organization
          </Text>
          {linkedOrganization ? (
            <View
              className="flex-row items-center gap-2 rounded-[10px] p-2.5"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons
                name="domain"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                className="text-sm flex-1"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {linkedOrganization.name}
              </Text>
            </View>
          ) : orgLinkPendingRequest ? (
            <View
              className="flex-row items-start gap-1.5 rounded-[10px] p-2.5"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                className="text-xs flex-1 leading-[17px]"
                style={{ color: colors.textSecondary }}
              >
                Request to join {orgLinkPendingRequest.organizationName} is pending
                review.
              </Text>
            </View>
          ) : isOwner && isVerified ? (
            <>
              <Pressable
                onPress={() => setShowOrgPicker((v) => !v)}
                className="py-2.5 rounded-lg items-center mb-3"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                  Request to Join an Organization
                </Text>
              </Pressable>
              {showOrgPicker && (
                <View className="gap-2 mt-2">
                  {eligibleOrganizations.length === 0 ? (
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      No verified organizations available yet.
                    </Text>
                  ) : (
                    eligibleOrganizations.map((org) => (
                      <Pressable
                        key={org.id}
                        onPress={() => handleRequestOrgLink(org.id)}
                        disabled={linkingOrgId === org.id}
                        className="flex-row items-center gap-2 rounded-[10px] p-2.5"
                        style={{
                          backgroundColor: colors.backgroundSecondary,
                          opacity: linkingOrgId === org.id ? 0.6 : 1,
                        }}
                      >
                        <Text className="text-sm flex-1" style={{ color: colors.text }}>
                          {org.name}
                        </Text>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={16}
                          color={colors.primary}
                        />
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </>
          ) : (
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              {isVerified
                ? "Not linked to an organization."
                : "Verify this facility to request joining an organization."}
            </Text>
          )}

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <KycSection
            entityType="facility"
            entityId={facility.id}
            kyc={facility.kyc}
            documentTypes={["Facility Permit", "Business Registration", "Other"]}
            onAddDocument={(docType, fileName, imageUri) =>
              addKycDocument("facility", facility.id, docType, fileName, imageUri)
            }
            onRemoveDocument={(id) => removeKycDocument("facility", facility.id, id)}
            onSubmit={() => submitKyc("facility", facility.id)}
          />

          <View className="h-6" />
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
}: {
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  keyboardType?: "email-address" | "phone-pad";
}) {
  return (
    <View className="mt-3.5">
      <Text className="text-xs font-semibold" style={{ color: colors.text }}>
        {label}
      </Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
          style={{
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
            color: colors.text,
          }}
        />
      ) : (
        <Text className="text-sm mt-1" style={{ color: colors.text }}>
          {value || "-"}
        </Text>
      )}
    </View>
  );
}