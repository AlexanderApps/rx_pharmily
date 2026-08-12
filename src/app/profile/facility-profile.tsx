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
import { FacilityType } from "@/features/profile/types/profile.types";
import KycSection from "@/features/profile/components/kyc-section";

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
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
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
  const requestFacilityOrganizationLink = useProfileStore((state) => state.requestFacilityOrganizationLink);
  const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
  const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);
  const fetchFacilityMembers = useProfileStore((state) => state.fetchFacilityMembers);
  const fetchFacilityMembershipRequests = useProfileStore((state) => state.fetchFacilityMembershipRequests);
  const fetchFacilityOrganizationRequests = useProfileStore((state) => state.fetchFacilityOrganizationRequests);
  const fetchKycDocuments = useProfileStore((state) => state.fetchKycDocuments);

  useEffect(() => {
    fetchFacilities();
    fetchOrganizations();
    fetchFacilityOrganizationRequests();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchFacilityMembers(params.id);
      fetchFacilityMembershipRequests(params.id);
      fetchKycDocuments("facility", params.id);
    }
  }, [params.id]);


  // Derived locally rather than inside the Zustand selector — a selector
  // that returns a freshly-filtered array (or even a fresh `[]` literal)
  // every call makes useSyncExternalStore see a "changed" snapshot on every
  // render, which is an infinite render loop.
  const myFacilities = useMemo(() => {
    const myIds = new Set(
      facilityMemberships.filter((m) => m.userId === user.id).map((m) => m.facilityId),
    );
    return facilities.filter((f) => myIds.has(f.id));
  }, [facilities, facilityMemberships, user.id]);

  const members = useMemo(
    () => (params.id ? facilityMemberships.filter((m) => m.facilityId === params.id) : []),
    [facilityMemberships, params.id],
  );

  const pendingRequests = useMemo(
    () => (params.id ? membershipRequests.filter((r) => r.facilityId === params.id && r.status === "pending") : []),
    [membershipRequests, params.id],
  );

  const facility = useMemo(
    () => facilities.find((f) => f.id === params.id) ?? myFacilities[0],
    [facilities, myFacilities, params.id],
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
  const [region, setRegion] = useState(facility?.region ?? "");
  const [address, setAddress] = useState(facility?.address ?? "");
  const [phone, setPhone] = useState(facility?.phone ?? "");
  const [email, setEmail] = useState(facility?.email ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(facility?.registrationNumber ?? "");

  if (!facility) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>No facility found.</Text>
      </SafeAreaView>
    );
  }

  const isVerified = facility.kyc.status === "verified";
  const isUserVerified = user.kyc.status === "verified";
  const isMember = members.some((m) => m.userId === currentUserId);
  const isOwner = members.some((m) => m.userId === currentUserId && m.role === "Owner");
  const canManageMembers = isOwner || isAdmin;
  const myPendingRequest = membershipRequests.find(
    (r) => r.facilityId === facility.id && r.requestedBy === currentUserId && r.status === "pending",
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {facility.name}
          </Text>
          {isOwner && (
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
            <View style={[styles.avatar, { backgroundColor: colors.success + "18" }]}>
              <MaterialCommunityIcons name="hospital-building" size={30} color={colors.success} />
            </View>
          </View>

          <Field label="Facility Name" editing={editing} value={name} onChange={setName} colors={colors} />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Type</Text>
          {editing ? (
            <View style={styles.chipRow}>
              {FACILITY_TYPES.map((option) => {
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
            <Text style={[styles.value, { color: colors.text, marginTop: 4 }]}>{facility.type}</Text>
          )}

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
          <Field label="Region" editing={editing} value={region} onChange={setRegion} colors={colors} />
          <Field label="Address" editing={editing} value={address} onChange={setAddress} colors={colors} />
          <Field label="Phone" editing={editing} value={phone} onChange={setPhone} colors={colors} keyboardType="phone-pad" />
          <Field label="Email" editing={editing} value={email} onChange={setEmail} colors={colors} keyboardType="email-address" />
          <Field
            label="Registration Number"
            editing={editing}
            value={registrationNumber}
            onChange={setRegistrationNumber}
            colors={colors}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.label, { color: colors.text }]}>Members ({members.length})</Text>
          </View>

          {!isVerified && (
            <View style={[styles.noticeBox, { backgroundColor: colors.warning + "12" }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.warning }]}>
                Verify this facility to unlock shared resources (price templates, facility chat) and let
                verified users request to join.
              </Text>
            </View>
          )}

          {isVerified && !isUserVerified && !isMember && !myPendingRequest && (
            <View style={[styles.noticeBox, { backgroundColor: colors.warning + "12" }]}>
              <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.warning }]}>
                Verify your own account before requesting to join a facility.
              </Text>
            </View>
          )}

          {isVerified && isUserVerified && !isMember && !myPendingRequest && (
            <Pressable
              onPress={handleRequestJoin}
              disabled={requesting}
              style={[styles.addMemberButton, { backgroundColor: colors.primary, opacity: requesting ? 0.6 : 1 }]}
            >
              <Text style={styles.addMemberButtonText}>
                {requesting ? "Requesting..." : "Request to Join"}
              </Text>
            </Pressable>
          )}

          {myPendingRequest && (
            <View style={[styles.noticeBox, { backgroundColor: colors.backgroundElement }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                Your request to join is pending review.
              </Text>
            </View>
          )}

          {canManageMembers && pendingRequests.length > 0 && (
            <View style={{ gap: 8, marginBottom: 12 }}>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                Pending Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map((request) => (
                <View key={request.id} style={[styles.memberRow, { backgroundColor: colors.backgroundElement }]}>
                  <View style={[styles.memberAvatar, { backgroundColor: request.requesterAvatarColor }]}>
                    <Text style={styles.memberAvatarText}>
                      {request.requesterName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                      {request.requesterName}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={1}>
                      {request.requesterEmail}
                    </Text>
                  </View>
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
            {members.map((member) => (
              <View key={member.id} style={[styles.memberRow, { backgroundColor: colors.backgroundElement }]}>
                <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor }]}>
                  <Text style={styles.memberAvatarText}>
                    {member.userName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.text }]} numberOfLines={1}>
                    {member.userName}
                  </Text>
                  <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{member.role}</Text>
                </View>
                {member.role !== "Owner" && canManageMembers && (
                  <Pressable onPress={() => handleRemoveMember(member.id, member.userName)} hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {isVerified && (
            <View style={styles.resourceRow}>
              <Pressable
                onPress={() => router.push({ pathname: "/profile/price-templates", params: { facilityId: facility.id } })}
                style={[styles.resourceButton, { backgroundColor: colors.backgroundElement }]}
              >
                <MaterialCommunityIcons name="file-table-outline" size={16} color={colors.text} />
                <Text style={[styles.resourceButtonText, { color: colors.text }]}>Price Templates</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/chat")}
                style={[styles.resourceButton, { backgroundColor: colors.backgroundElement }]}
              >
                <MaterialCommunityIcons name="chat-outline" size={16} color={colors.text} />
                <Text style={[styles.resourceButtonText, { color: colors.text }]}>Facility Chat</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Public Profile</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary, marginBottom: 10 }]}>
            Shown to anyone who taps this facility's avatar. Contact details are visible by default
            for facilities — turn them off if you'd rather keep them private.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show email publicly</Text>
            <Switch
              value={facility.publicVisibility.showEmail}
              onValueChange={(value) => updateFacilityVisibility(facility.id, { showEmail: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show phone publicly</Text>
            <Switch
              value={facility.publicVisibility.showPhone}
              onValueChange={(value) => updateFacilityVisibility(facility.id, { showPhone: value })}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>Organization</Text>

          {linkedOrganization ? (
            <View style={[styles.facilityRow, { backgroundColor: colors.backgroundElement }]}>
              <MaterialCommunityIcons name="domain" size={16} color={colors.textSecondary} />
              <Text style={[styles.value, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {linkedOrganization.name}
              </Text>
            </View>
          ) : orgLinkPendingRequest ? (
            <View style={[styles.noticeBox, { backgroundColor: colors.backgroundElement }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                Request to join {orgLinkPendingRequest.organizationName} is pending review.
              </Text>
            </View>
          ) : isOwner && isVerified ? (
            <>
              <Pressable
                onPress={() => setShowOrgPicker((v) => !v)}
                style={[styles.addMemberButton, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                  Request to Join an Organization
                </Text>
              </Pressable>
              {showOrgPicker && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  {eligibleOrganizations.length === 0 ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      No verified organizations available yet.
                    </Text>
                  ) : (
                    eligibleOrganizations.map((org) => (
                      <Pressable
                        key={org.id}
                        onPress={() => handleRequestOrgLink(org.id)}
                        disabled={linkingOrgId === org.id}
                        style={[styles.facilityRow, { backgroundColor: colors.backgroundSecondary, opacity: linkingOrgId === org.id ? 0.6 : 1 }]}
                      >
                        <Text style={[styles.value, { color: colors.text, flex: 1 }]}>{org.name}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
                      </Pressable>
                    ))
                  )}
                </View>
              )}
            </>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {isVerified ? "Not linked to an organization." : "Verify this facility to request joining an organization."}
            </Text>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
}: {
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  keyboardType?: "email-address" | "phone-pad";
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {editing ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
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
  addMemberButton: { paddingVertical: 10, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  addMemberButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, padding: 10 },
  facilityRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  pendingReviewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  memberName: { fontSize: 13, fontWeight: "600" },
  memberRole: { fontSize: 11, marginTop: 1 },
  subLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", borderRadius: 14, padding: 18, gap: 12 },
  modalTitle: { fontSize: 15, fontWeight: "700" },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 70, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20 },
  modalButton: { paddingVertical: 6 },
  resourceRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  resourceButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10 },
  resourceButtonText: { fontSize: 12, fontWeight: "600" },
});
