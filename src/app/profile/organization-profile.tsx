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
import { useOrganizationFieldAccess } from "@/features/profile/hooks/use-organization-field-access";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { OrganizationType } from "@/features/profile/types/profile.types";
import KycSection from "@/features/profile/components/kyc-section";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";

const ORG_TYPES: OrganizationType[] = [
  "Pharmacy Chain",
  "Healthcare Group",
  "Distributor Network",
  "Other",
];

export default function OrganizationProfileScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const params = useLocalSearchParams<{ id?: string }>();

  const organizations = useProfileStore((state) => state.organizations);
  const facilities = useProfileStore((state) => state.facilities);
  const facilityOrgRequests = useProfileStore((state) => state.facilityOrganizationRequests);
  const updateOrganizationProfile = useProfileStore((state) => state.updateOrganizationProfile);
  const updateOrganizationVisibility = useProfileStore((state) => state.updateOrganizationVisibility);
  const addKycDocument = useProfileStore((state) => state.addKycDocument);
  const removeKycDocument = useProfileStore((state) => state.removeKycDocument);
  const submitKyc = useProfileStore((state) => state.submitKyc);
  const removeFacilityFromOrganization = useProfileStore((state) => state.removeFacilityFromOrganization);
  const fetchKycDocuments = useProfileStore((state) => state.fetchKycDocuments);
  const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);
  const fetchFacilityOrganizationRequests = useProfileStore((state) => state.fetchFacilityOrganizationRequests);

  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true);
  useEffect(() => {
    fetchOrganizations().finally(() => setIsLoadingOrganization(false));
  }, []);

  useEffect(() => {
    if (params.id) fetchKycDocuments("organization", params.id);
    fetchFacilityOrganizationRequests();
  }, [params.id]);


  const organization = useMemo(() => {
    if (params.id) return organizations.find((o) => o.id === params.id);
    // No id in the URL at all (e.g. arriving from a KYC-decision
    // notification, which doesn't carry a specific org id) — showing
    // the org the person administers is the intended fallback here.
    // This must not fire when an id WAS requested but just hasn't
    // loaded yet, or a cold refresh would silently substitute a
    // different organization instead of showing a loading state.
    return organizations.find((o) => o.adminUserId === currentUserId);
  }, [organizations, params.id, currentUserId]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organization?.name ?? "");
  const [type, setType] = useState<OrganizationType>(organization?.type ?? "Pharmacy Chain");
  const [registrationNumber, setRegistrationNumber] = useState(organization?.registrationNumber ?? "");
  const [headquartersLocation, setHeadquartersLocation] = useState(organization?.headquartersLocation ?? "");
  const [region, setRegion] = useState(organization?.region ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(organization?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(organization?.longitude);
  const [logoUrl, setLogoUrl] = useState(organization?.logoUrl);
  const [email, setEmail] = useState(organization?.email ?? "");
  const [phone, setPhone] = useState(organization?.phone ?? "");
  const referenceRegions = useReferenceDataStore((state) => state.regions);
  const regionOptions = useMemo(
    () => referenceRegions.map((r) => ({ id: r.name, label: r.name })),
    [referenceRegions],
  );

  // useState's initial value is only read on the first render — without
  // this, these fields would stay frozen on their empty/stale defaults
  // forever, even after `organizations` finishes loading and
  // `organization` resolves correctly. Skipped while editing so an
  // in-progress edit can't be silently clobbered by an unrelated store
  // update.
  useEffect(() => {
    if (!organization || editing) return;
    setName(organization.name);
    setType(organization.type);
    setRegistrationNumber(organization.registrationNumber ?? "");
    setHeadquartersLocation(organization.headquartersLocation ?? "");
    setRegion(organization.region ?? "");
    setLatitude(organization.latitude);
    setLongitude(organization.longitude);
    setEmail(organization.email ?? "");
    setPhone(organization.phone ?? "");
    setLogoUrl(organization.logoUrl);
  }, [organization, editing]);

  const { role: viewerRole, canSee } = useOrganizationFieldAccess(organization);

  if (!organization) {
    if (isLoadingOrganization) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>No organization found.</Text>
      </SafeAreaView>
    );
  }

  const isVerified = organization.kyc.status === "verified";
  const isOrgAdmin = viewerRole === "owner";
  const canManageRequests = viewerRole === "owner" || viewerRole === "admin";
  const orgFacilities = facilities.filter((f) => organization.facilityIds.includes(f.id));
  const pendingLinkRequests = facilityOrgRequests.filter(
    (r) => r.organizationId === organization.id && r.status === "pending",
  );

  const handleSave = () => {
    updateOrganizationProfile(organization.id, {
      name: name.trim(),
      type,
      registrationNumber: registrationNumber.trim() || undefined,
      headquartersLocation: headquartersLocation.trim() || undefined,
      region: region.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      latitude,
      longitude,
      logoUrl,
    });
    setEditing(false);
  };

  const handleRemoveFacility = async (facilityId: string, facilityName: string) => {
    const ok = await confirm({
      title: "Remove this facility?",
      message: `${facilityName} will no longer belong to ${organization.name}.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await removeFacilityFromOrganization(organization.id, facilityId);
    toast.success("Facility removed.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScreenHeader
          title="Organization Profile"
          centered
          actions={
            isOrgAdmin && (
              <Pressable onPress={() => (editing ? handleSave() : setEditing(true))} className="p-1.5">
                <MaterialCommunityIcons
                  name={editing ? "check" : "pencil-outline"}
                  size={20}
                  color={editing ? colors.primary : colors.text}
                />
              </Pressable>
            )
          }
        />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-2">
            {editing ? (
              <AvatarUpload
                imageUri={logoUrl}
                onImageSelected={setLogoUrl}
                fallbackColor={colors.secondary + "18"}
                fallbackContent={<MaterialCommunityIcons name="domain" size={30} color={colors.secondary} />}
                size={72}
                uploadContext="logos"
              />
            ) : logoUrl ? (
              <LoadingImage source={{ uri: logoUrl }} style={{ width: 72, height: 72, borderRadius: 20 }} borderRadius={36} />
            ) : (
              <View className="w-[72px] h-[72px] rounded-[20px] items-center justify-center" style={{ backgroundColor: colors.secondary + "18" }}>
                <MaterialCommunityIcons name="domain" size={30} color={colors.secondary} />
              </View>
            )}
          </View>

          <Field label="Organization Name" editing={editing} value={name} onChange={setName} colors={colors} />

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>Type</Text>
          {editing ? (
            <View className="flex-row flex-wrap gap-2 mt-1.5">
              {ORG_TYPES.map((option) => {
                const active = type === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setType(option)}
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
            <Text className="text-sm mt-1" style={{ color: colors.text }}>{organization.type}</Text>
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
          <View style={{ marginTop: 14 }}>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>Headquarters Location</Text>
            {editing ? (
              <LocationPicker
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
              />
            ) : (
              <>
                <Text className="text-sm mt-1" style={{ color: colors.text }}>
                  {headquartersLocation || "-"}
                </Text>
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
          {canSee("email") && (
            <Field label="Email" editing={editing} value={email} onChange={setEmail} colors={colors} />
          )}
          {canSee("phone") && (
            <Field label="Phone" editing={editing} value={phone} onChange={setPhone} colors={colors} />
          )}

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Facilities ({orgFacilities.length})
            </Text>
          </View>

          {!isVerified && (
            <View className="flex-row items-start gap-1.5 rounded-[10px] p-2.5 mb-2.5" style={{ backgroundColor: colors.warning + "12" }}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
              <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.warning }}>
                Verify this organization before facilities can request to join it.
              </Text>
            </View>
          )}

          {canManageRequests && pendingLinkRequests.length > 0 && (
            <View style={{ gap: 8, marginBottom: 12 }}>
              <Text className="text-xs font-bold uppercase tracking-[0.3px]" style={{ color: colors.textSecondary }}>
                Pending Requests ({pendingLinkRequests.length})
              </Text>
              {pendingLinkRequests.map((request) => (
                <View key={request.id} className="flex-row items-center gap-2 rounded-[10px] p-2.5" style={{ backgroundColor: colors.backgroundElement }}>
                  <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                  <Text className="text-sm flex-1" style={{ color: colors.text }} numberOfLines={1}>
                    {request.facilityName}
                  </Text>
                  <View className="flex-row items-center gap-1 px-2 py-[5px] rounded-lg" style={{ backgroundColor: colors.backgroundSecondary }}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
                      Pending admin review
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ gap: 8 }}>
            {orgFacilities.map((f) => (
              <View key={f.id} className="flex-row items-center gap-2 rounded-[10px] p-2.5" style={{ backgroundColor: colors.backgroundElement }}>
                <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                <Pressable
                  onPress={() => router.push({ pathname: "/profile/facility-profile", params: { id: f.id } })}
                  style={{ flex: 1 }}
                >
                  <Text className="text-sm" style={{ color: colors.text }} numberOfLines={1}>
                    {f.name}
                  </Text>
                </Pressable>
                <KycStatusBadge status={f.kyc.status} compact />
                {canManageRequests && (
                  <Pressable onPress={() => handleRemoveFacility(f.id, f.name)} hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            ))}
            {orgFacilities.length === 0 && (
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No facilities yet.</Text>
            )}
          </View>

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>Public Profile</Text>
          <Text className="text-xs leading-[17px]" style={{ color: colors.textSecondary, marginBottom: 10 }}>
            Shown to anyone who taps this organization's avatar. Contact details are visible by
            default for organizations — turn them off if you'd rather keep them private.
          </Text>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>Show email publicly</Text>
            <Switch
              value={organization.publicVisibility.showEmail}
              onValueChange={(value) => updateOrganizationVisibility(organization.id, { showEmail: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>Show phone publicly</Text>
            <Switch
              value={organization.publicVisibility.showPhone}
              onValueChange={(value) => updateOrganizationVisibility(organization.id, { showPhone: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View className="h-px my-[18px]" style={{ backgroundColor: colors.border }} />

          <KycSection
            entityType="organization"
            entityId={organization.id}
            kyc={organization.kyc}
            documentTypes={["Business Registration", "Other"]}
            onAddDocument={(docType, fileName, imageUri) =>
              addKycDocument("organization", organization.id, docType, fileName, imageUri)
            }
            onRemoveDocument={(id) => removeKycDocument("organization", organization.id, id)}
            onSubmit={() => submitKyc("organization", organization.id)}
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
}: {
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text className="text-xs font-semibold" style={{ color: colors.text }}>{label}</Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
          style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
        />
      ) : (
        <Text className="text-sm mt-1" style={{ color: colors.text }}>{value || "-"}</Text>
      )}
    </View>
  );
}
