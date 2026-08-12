import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";
import { toast } from "@/shared/hooks/use-toast";

type Tab = "facilities" | "organizations" | "members" | "links";
type SelectedRequest = { tab: Tab; id: string } | null;

export default function FacilityOrgRequestsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const facilityCreationRequests = useProfileStore((state) => state.facilityCreationRequests);
  const organizationCreationRequests = useProfileStore((state) => state.organizationCreationRequests);
  const facilityMembershipRequests = useProfileStore((state) => state.facilityMembershipRequests);
  const facilityOrganizationRequests = useProfileStore((state) => state.facilityOrganizationRequests);

  const fetchFacilityCreationRequests = useProfileStore((state) => state.fetchFacilityCreationRequests);
  const fetchOrganizationCreationRequests = useProfileStore((state) => state.fetchOrganizationCreationRequests);
  const fetchFacilityMembershipRequests = useProfileStore((state) => state.fetchFacilityMembershipRequests);
  const fetchFacilityOrganizationRequests = useProfileStore((state) => state.fetchFacilityOrganizationRequests);
  const fetchUserFacilityMemberships = useProfileStore((state) => state.fetchUserFacilityMemberships);

  const approveFacilityCreationRequest = useProfileStore((state) => state.approveFacilityCreationRequest);
  const rejectFacilityCreationRequest = useProfileStore((state) => state.rejectFacilityCreationRequest);
  const approveOrganizationCreationRequest = useProfileStore((state) => state.approveOrganizationCreationRequest);
  const rejectOrganizationCreationRequest = useProfileStore((state) => state.rejectOrganizationCreationRequest);
  const approveFacilityMembershipRequest = useProfileStore((state) => state.approveFacilityMembershipRequest);
  const rejectFacilityMembershipRequest = useProfileStore((state) => state.rejectFacilityMembershipRequest);
  const approveFacilityOrganizationRequest = useProfileStore((state) => state.approveFacilityOrganizationRequest);
  const rejectFacilityOrganizationRequest = useProfileStore((state) => state.rejectFacilityOrganizationRequest);

  useEffect(() => {
    fetchFacilityCreationRequests();
    fetchOrganizationCreationRequests();
    fetchFacilityMembershipRequests();
    fetchFacilityOrganizationRequests();
  }, []);

  const [tab, setTab] = useState<Tab>("facilities");
  const [selected, setSelected] = useState<SelectedRequest>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reasonText, setReasonText] = useState("");

  // "Already a member of" context for the currently-open membership
  // request — fetched on demand when the detail view opens, since it's
  // about a specific other person's memberships, not something worth
  // keeping loaded globally.
  const [requesterMemberships, setRequesterMemberships] = useState<
    { facilityId: string; facilityName: string; role: string }[] | null
  >(null);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  const pendingFacilities = useMemo(
    () => facilityCreationRequests.filter((r) => r.status === "pending"),
    [facilityCreationRequests],
  );
  const pendingOrgs = useMemo(
    () => organizationCreationRequests.filter((r) => r.status === "pending"),
    [organizationCreationRequests],
  );
  const pendingMembers = useMemo(
    () => facilityMembershipRequests.filter((r) => r.status === "pending"),
    [facilityMembershipRequests],
  );
  const pendingLinks = useMemo(
    () => facilityOrganizationRequests.filter((r) => r.status === "pending"),
    [facilityOrganizationRequests],
  );

  const memberRequest = selected?.tab === "members" ? pendingMembers.find((r) => r.id === selected.id) : undefined;
  const linkRequest = selected?.tab === "links" ? pendingLinks.find((r) => r.id === selected.id) : undefined;
  const facilityRequest = selected?.tab === "facilities" ? pendingFacilities.find((r) => r.id === selected.id) : undefined;
  const orgRequest = selected?.tab === "organizations" ? pendingOrgs.find((r) => r.id === selected.id) : undefined;

  const linkFacility = linkRequest ? facilities.find((f) => f.id === linkRequest.facilityId) : undefined;
  const linkOrganization = linkRequest ? organizations.find((o) => o.id === linkRequest.organizationId) : undefined;
  const targetFacility = memberRequest ? facilities.find((f) => f.id === memberRequest.facilityId) : undefined;

  useEffect(() => {
    if (!memberRequest) {
      setRequesterMemberships(null);
      return;
    }
    setLoadingMemberships(true);
    fetchUserFacilityMemberships(memberRequest.requestedBy)
      .then(setRequesterMemberships)
      .finally(() => setLoadingMemberships(false));
  }, [memberRequest?.id]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const closeDetail = () => {
    setSelected(null);
    setRejecting(false);
    setReasonText("");
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (selected.tab === "facilities") await approveFacilityCreationRequest(selected.id);
    if (selected.tab === "organizations") await approveOrganizationCreationRequest(selected.id);
    if (selected.tab === "members") await approveFacilityMembershipRequest(selected.id);
    if (selected.tab === "links") await approveFacilityOrganizationRequest(selected.id);
    toast.success("Request approved.");
    closeDetail();
  };

  const handleReject = async () => {
    if (!selected || !reasonText.trim()) return;
    const reason = reasonText.trim();
    if (selected.tab === "facilities") await rejectFacilityCreationRequest(selected.id, reason);
    if (selected.tab === "organizations") await rejectOrganizationCreationRequest(selected.id, reason);
    if (selected.tab === "members") await rejectFacilityMembershipRequest(selected.id, reason);
    if (selected.tab === "links") await rejectFacilityOrganizationRequest(selected.id, reason);
    toast.success("Request declined.");
    closeDetail();
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "facilities", label: "Facilities", count: pendingFacilities.length },
    { key: "organizations", label: "Orgs", count: pendingOrgs.length },
    { key: "members", label: "Members", count: pendingMembers.length },
    { key: "links", label: "Facility→Org", count: pendingLinks.length },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Facility & Org Requests</Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tabButton}>
            <View style={styles.tabLabelRow}>
              <Text
                style={[
                  styles.tabText,
                  { color: tab === t.key ? colors.primary : colors.textSecondary, fontWeight: tab === t.key ? "700" : "500" },
                ]}
              >
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{t.count > 99 ? "99+" : t.count}</Text>
                </View>
              )}
            </View>
            {tab === t.key && <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />}
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "facilities" &&
          (pendingFacilities.length === 0 ? (
            <EmptyState colors={colors} text="No pending facility requests." />
          ) : (
            pendingFacilities.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.name}
                subtitle={`${r.type} · ${r.location}, ${r.region}`}
                onPress={() => setSelected({ tab: "facilities", id: r.id })}
              />
            ))
          ))}

        {tab === "organizations" &&
          (pendingOrgs.length === 0 ? (
            <EmptyState colors={colors} text="No pending organization requests." />
          ) : (
            pendingOrgs.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.name}
                subtitle={`${r.type}${r.headquartersLocation ? ` · ${r.headquartersLocation}` : ""}`}
                onPress={() => setSelected({ tab: "organizations", id: r.id })}
              />
            ))
          ))}

        {tab === "members" &&
          (pendingMembers.length === 0 ? (
            <EmptyState colors={colors} text="No pending membership requests." />
          ) : (
            pendingMembers.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.requesterName}
                subtitle={r.requesterEmail}
                trailing={<KycStatusBadge status={r.requesterKycStatus} compact />}
                onPress={() => setSelected({ tab: "members", id: r.id })}
              />
            ))
          ))}

        {tab === "links" &&
          (pendingLinks.length === 0 ? (
            <EmptyState colors={colors} text="No pending facility-to-organization requests." />
          ) : (
            pendingLinks.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.facilityName}
                subtitle={`wants to join ${r.organizationName}`}
                onPress={() => setSelected({ tab: "links", id: r.id })}
              />
            ))
          ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.detailOverlay}>
          <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>Request Details</Text>
              <Pressable onPress={closeDetail} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: "70%" }} contentContainerStyle={{ paddingBottom: 8 }}>
              {memberRequest && (
                <>
                  <DetailSection colors={colors} label="Requester">
                    <View style={styles.requesterRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailValue, { color: colors.text }]}>{memberRequest.requesterName}</Text>
                        <Text style={[styles.detailSub, { color: colors.textSecondary }]}>{memberRequest.requesterEmail}</Text>
                      </View>
                      <KycStatusBadge status={memberRequest.requesterKycStatus} compact />
                    </View>
                  </DetailSection>

                  <DetailSection colors={colors} label="Wants to join">
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {targetFacility?.name ?? "Unknown facility"}
                    </Text>
                    {targetFacility && (
                      <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                        {targetFacility.type} · {targetFacility.location}, {targetFacility.region}
                      </Text>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Already a member of">
                    {loadingMemberships ? (
                      <Text style={[styles.detailSub, { color: colors.textSecondary }]}>Loading...</Text>
                    ) : requesterMemberships && requesterMemberships.length > 0 ? (
                      requesterMemberships.map((m) => (
                        <View key={m.facilityId} style={styles.membershipRow}>
                          <MaterialCommunityIcons name="hospital-building" size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailSub, { color: colors.text }]}>
                            {m.facilityName} · {m.role}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.detailSub, { color: colors.textSecondary }]}>Not a member anywhere yet.</Text>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Requested">
                    <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                      {memberRequest.createdAt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </Text>
                  </DetailSection>
                </>
              )}

              {linkRequest && (
                <>
                  <DetailSection colors={colors} label="Facility">
                    <Text style={[styles.detailValue, { color: colors.text }]}>{linkRequest.facilityName}</Text>
                    {linkFacility && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                          {linkFacility.type} · {linkFacility.location}, {linkFacility.region}
                        </Text>
                        <KycStatusBadge status={linkFacility.kyc.status} compact />
                      </View>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Wants to join organization">
                    <Text style={[styles.detailValue, { color: colors.text }]}>{linkRequest.organizationName}</Text>
                    {linkOrganization && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <Text style={[styles.detailSub, { color: colors.textSecondary }]}>{linkOrganization.type}</Text>
                        <KycStatusBadge status={linkOrganization.kyc.status} compact />
                      </View>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Requested">
                    <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                      {linkRequest.createdAt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </Text>
                  </DetailSection>
                </>
              )}

              {facilityRequest && (
                <>
                  <DetailSection colors={colors} label="Facility name">
                    <Text style={[styles.detailValue, { color: colors.text }]}>{facilityRequest.name}</Text>
                  </DetailSection>
                  <DetailSection colors={colors} label="Type & location">
                    <Text style={[styles.detailSub, { color: colors.text }]}>
                      {facilityRequest.type} · {facilityRequest.location}, {facilityRequest.region}
                    </Text>
                  </DetailSection>
                  {facilityRequest.address && (
                    <DetailSection colors={colors} label="Address">
                      <Text style={[styles.detailSub, { color: colors.text }]}>{facilityRequest.address}</Text>
                    </DetailSection>
                  )}
                  {(facilityRequest.phone || facilityRequest.email) && (
                    <DetailSection colors={colors} label="Contact">
                      {facilityRequest.phone && (
                        <Text style={[styles.detailSub, { color: colors.text }]}>{facilityRequest.phone}</Text>
                      )}
                      {facilityRequest.email && (
                        <Text style={[styles.detailSub, { color: colors.text }]}>{facilityRequest.email}</Text>
                      )}
                    </DetailSection>
                  )}
                  {facilityRequest.registrationNumber && (
                    <DetailSection colors={colors} label="Registration number">
                      <Text style={[styles.detailSub, { color: colors.text }]}>{facilityRequest.registrationNumber}</Text>
                    </DetailSection>
                  )}
                  <DetailSection colors={colors} label="Requested">
                    <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                      {facilityRequest.createdAt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </Text>
                  </DetailSection>
                </>
              )}

              {orgRequest && (
                <>
                  <DetailSection colors={colors} label="Organization name">
                    <Text style={[styles.detailValue, { color: colors.text }]}>{orgRequest.name}</Text>
                  </DetailSection>
                  <DetailSection colors={colors} label="Type">
                    <Text style={[styles.detailSub, { color: colors.text }]}>{orgRequest.type}</Text>
                  </DetailSection>
                  {orgRequest.headquartersLocation && (
                    <DetailSection colors={colors} label="Headquarters">
                      <Text style={[styles.detailSub, { color: colors.text }]}>{orgRequest.headquartersLocation}</Text>
                    </DetailSection>
                  )}
                  {(orgRequest.phone || orgRequest.email) && (
                    <DetailSection colors={colors} label="Contact">
                      {orgRequest.phone && (
                        <Text style={[styles.detailSub, { color: colors.text }]}>{orgRequest.phone}</Text>
                      )}
                      {orgRequest.email && (
                        <Text style={[styles.detailSub, { color: colors.text }]}>{orgRequest.email}</Text>
                      )}
                    </DetailSection>
                  )}
                  {orgRequest.registrationNumber && (
                    <DetailSection colors={colors} label="Registration number">
                      <Text style={[styles.detailSub, { color: colors.text }]}>{orgRequest.registrationNumber}</Text>
                    </DetailSection>
                  )}
                  <DetailSection colors={colors} label="Requested">
                    <Text style={[styles.detailSub, { color: colors.textSecondary }]}>
                      {orgRequest.createdAt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </Text>
                  </DetailSection>
                </>
              )}
            </ScrollView>

            {rejecting ? (
              <View style={{ gap: 10 }}>
                <TextInput
                  value={reasonText}
                  onChangeText={setReasonText}
                  placeholder="Reason (shown to the requester)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={[styles.reasonInput, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
                />
                <View style={styles.detailActions}>
                  <Pressable onPress={() => setRejecting(false)} style={styles.detailActionButton}>
                    <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Back</Text>
                  </Pressable>
                  <Pressable onPress={handleReject} style={styles.detailActionButton} disabled={!reasonText.trim()}>
                    <Text style={{ color: colors.error, fontWeight: "700", opacity: reasonText.trim() ? 1 : 0.4 }}>
                      Confirm Decline
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.detailActions}>
                <Pressable
                  onPress={() => setRejecting(true)}
                  style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: 13, fontWeight: "700" }}>Reject</Text>
                </Pressable>
                <Pressable
                  onPress={handleApprove}
                  style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
                >
                  <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: "700" }}>Approve</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState({ colors, text }: { colors: any; text: string }) {
  return (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

function RequestCard({
  colors,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  colors: any;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {trailing}
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

function DetailSection({ colors, label, children }: { colors: any; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailSection}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  back: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  tabRow: { flexDirection: "row", borderBottomWidth: 0.5 },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  tabText: { fontSize: 12 },
  badge: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  tabIndicator: { height: 2, width: "60%", borderRadius: 1, marginTop: 8 },
  content: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardMeta: { fontSize: 12, marginTop: 2 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13 },
  detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 4 },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  detailTitle: { fontSize: 16, fontWeight: "700" },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: "700" },
  detailSub: { fontSize: 13, marginTop: 1 },
  requesterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  membershipRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  reasonInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 70, textAlignVertical: "top" },
  detailActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  detailActionButton: { flex: 1, alignItems: "center", paddingVertical: 12 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
});
