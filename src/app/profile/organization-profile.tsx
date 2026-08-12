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
  Alert,
  Switch,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import LocationPicker from "@/shared/components/location-picker";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
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
  const isPlatformAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
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
  const fetchFacilityOrganizationRequests = useProfileStore((state) => state.fetchFacilityOrganizationRequests);

  useEffect(() => {
    if (params.id) fetchKycDocuments("organization", params.id);
    fetchFacilityOrganizationRequests();
  }, [params.id]);


  const organization = useMemo(
    () => organizations.find((o) => o.id === params.id) ?? organizations.find((o) => o.adminUserId === currentUserId),
    [organizations, params.id, currentUserId],
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(organization?.name ?? "");
  const [type, setType] = useState<OrganizationType>(organization?.type ?? "Pharmacy Chain");
  const [registrationNumber, setRegistrationNumber] = useState(organization?.registrationNumber ?? "");
  const [headquartersLocation, setHeadquartersLocation] = useState(organization?.headquartersLocation ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(organization?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(organization?.longitude);
  const [email, setEmail] = useState(organization?.email ?? "");
  const [phone, setPhone] = useState(organization?.phone ?? "");

  if (!organization) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>No organization found.</Text>
      </SafeAreaView>
    );
  }

  const isVerified = organization.kyc.status === "verified";
  const isOrgAdmin = organization.adminUserId === currentUserId;
  const canManageRequests = isOrgAdmin || isPlatformAdmin;
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
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      latitude,
      longitude,
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Organization Profile</Text>
          {isOrgAdmin && (
            <Pressable onPress={() => (editing ? handleSave() : setEditing(true))} style={styles.back}>
              <MaterialCommunityIcons
                name={editing ? "check" : "pencil-outline"}
                size={20}
                color={editing ? colors.primary : colors.text}
              />
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary + "18" }]}>
              <MaterialCommunityIcons name="domain" size={30} color={colors.secondary} />
            </View>
          </View>

          <Field label="Organization Name" editing={editing} value={name} onChange={setName} colors={colors} />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Type</Text>
          {editing ? (
            <View style={styles.chipRow}>
              {ORG_TYPES.map((option) => {
                const active = type === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setType(option)}
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
            <Text style={[styles.value, { color: colors.text, marginTop: 4 }]}>{organization.type}</Text>
          )}

          <Field
            label="Registration Number"
            editing={editing}
            value={registrationNumber}
            onChange={setRegistrationNumber}
            colors={colors}
          />
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.label, { color: colors.text }]}>Headquarters Location</Text>
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
                <Text style={[styles.value, { color: colors.text, marginTop: 4 }]}>
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
          <Field label="Email" editing={editing} value={email} onChange={setEmail} colors={colors} />
          <Field label="Phone" editing={editing} value={phone} onChange={setPhone} colors={colors} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Facilities ({orgFacilities.length})
            </Text>
          </View>

          {!isVerified && (
            <View style={[styles.noticeBox, { backgroundColor: colors.warning + "12" }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.warning }]}>
                Verify this organization before facilities can request to join it.
              </Text>
            </View>
          )}

          {canManageRequests && pendingLinkRequests.length > 0 && (
            <View style={{ gap: 8, marginBottom: 12 }}>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                Pending Requests ({pendingLinkRequests.length})
              </Text>
              {pendingLinkRequests.map((request) => (
                <View key={request.id} style={[styles.facilityRow, { backgroundColor: colors.backgroundElement }]}>
                  <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                  <Text style={[styles.value, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {request.facilityName}
                  </Text>
                  <View style={[styles.pendingReviewPill, { backgroundColor: colors.backgroundSecondary }]}>
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
              <View key={f.id} style={[styles.facilityRow, { backgroundColor: colors.backgroundElement }]}>
                <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                <Pressable
                  onPress={() => router.push({ pathname: "/profile/facility-profile", params: { id: f.id } })}
                  style={{ flex: 1 }}
                >
                  <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
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

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Public Profile</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary, marginBottom: 10 }]}>
            Shown to anyone who taps this organization's avatar. Contact details are visible by
            default for organizations — turn them off if you'd rather keep them private.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show email publicly</Text>
            <Switch
              value={organization.publicVisibility.showEmail}
              onValueChange={(value) => updateOrganizationVisibility(organization.id, { showEmail: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show phone publicly</Text>
            <Switch
              value={organization.publicVisibility.showPhone}
              onValueChange={(value) => updateOrganizationVisibility(organization.id, { showPhone: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={[
            styles.input,
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
  avatar: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, marginVertical: 18 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleLabel: { fontSize: 13, fontWeight: "500" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  noticeBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 10, padding: 10, marginBottom: 10 },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 17 },
  subLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 14, padding: 18, gap: 12 },
  modalTitle: { fontSize: 15, fontWeight: "700" },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 70, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20 },
  modalButton: { paddingVertical: 6 },
  facilityRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10 },
  pendingReviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
});
