import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal, Platform} from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";
import { toast } from "@/shared/hooks/use-toast";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";

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
  const [requesterMemberships, setRequesterMemberships] = useState<
    { facilityId: string; facilityName: string; role: string }[] | null
  >(null);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const matchesFilter = (status: string) => statusFilter === "all" || status === statusFilter;

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

  const filteredFacilities = useMemo(
    () => facilityCreationRequests.filter((r) => matchesFilter(r.status)),
    [facilityCreationRequests, statusFilter],
  );
  const filteredOrgs = useMemo(
    () => organizationCreationRequests.filter((r) => matchesFilter(r.status)),
    [organizationCreationRequests, statusFilter],
  );
  const filteredMembers = useMemo(
    () => facilityMembershipRequests.filter((r) => matchesFilter(r.status)),
    [facilityMembershipRequests, statusFilter],
  );
  const filteredLinks = useMemo(
    () => facilityOrganizationRequests.filter((r) => matchesFilter(r.status)),
    [facilityOrganizationRequests, statusFilter],
  );

  const memberRequest =
    selected?.tab === "members"
      ? facilityMembershipRequests.find((r) => r.id === selected.id)
      : undefined;
  const linkRequest =
    selected?.tab === "links"
      ? facilityOrganizationRequests.find((r) => r.id === selected.id)
      : undefined;
  const facilityRequest =
    selected?.tab === "facilities"
      ? facilityCreationRequests.find((r) => r.id === selected.id)
      : undefined;
  const orgRequest =
    selected?.tab === "organizations"
      ? organizationCreationRequests.find((r) => r.id === selected.id)
      : undefined;

  const selectedStatus =
    memberRequest?.status ??
    linkRequest?.status ??
    facilityRequest?.status ??
    orgRequest?.status;

  const linkFacility = linkRequest
    ? facilities.find((f) => f.id === linkRequest.facilityId)
    : undefined;
  const linkOrganization = linkRequest
    ? organizations.find((o) => o.id === linkRequest.organizationId)
    : undefined;
  const targetFacility = memberRequest
    ? facilities.find((f) => f.id === memberRequest.facilityId)
    : undefined;

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-3 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <Pressable onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        )}
        <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
          Facility & Org Requests
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b" style={{ borderBottomColor: colors.border }}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className="flex-1 items-center py-3"
          >
            <View className="flex-row items-center gap-1.5">
              <Text
                className="text-xs"
                style={{
                  color: tab === t.key ? colors.primary : colors.textSecondary,
                  fontWeight: tab === t.key ? "700" : "500",
                }}
              >
                {t.label}
              </Text>
              {t.count > 0 && (
                <View
                  className="min-w-4 h-4 rounded-full px-1 items-center justify-center"
                  style={{ backgroundColor: colors.error }}
                >
                  <Text className="text-white text-[10px] font-bold">
                    {t.count > 99 ? "99+" : t.count}
                  </Text>
                </View>
              )}
            </View>
            {tab === t.key && (
              <View
                className="h-0.5 w-[60%] rounded-sm mt-2"
                style={{ backgroundColor: colors.primary }}
              />
            )}
          </Pressable>
        ))}
      </View>

      <StatusFilterTabs
        options={[
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
          { key: "all", label: "All" },
        ]}
        selected={statusFilter}
        onSelect={(key) => setStatusFilter(key as typeof statusFilter)}
      />

      <ScrollView contentContainerClassName="p-4 gap-2.5">
        {tab === "facilities" &&
          (filteredFacilities.length === 0 ? (
            <EmptyState colors={colors} text="No facility requests here." />
          ) : (
            filteredFacilities.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.name}
                subtitle={`${r.type} · ${r.location}, ${r.region}`}
                trailing={
                  r.status !== "pending" ? (
                    <RequestStatusBadge colors={colors} status={r.status} />
                  ) : undefined
                }
                onPress={() => setSelected({ tab: "facilities", id: r.id })}
              />
            ))
          ))}

        {tab === "organizations" &&
          (filteredOrgs.length === 0 ? (
            <EmptyState colors={colors} text="No organization requests here." />
          ) : (
            filteredOrgs.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.name}
                subtitle={`${r.type}${r.headquartersLocation ? ` · ${r.headquartersLocation}` : ""}`}
                trailing={
                  r.status !== "pending" ? (
                    <RequestStatusBadge colors={colors} status={r.status} />
                  ) : undefined
                }
                onPress={() => setSelected({ tab: "organizations", id: r.id })}
              />
            ))
          ))}

        {tab === "members" &&
          (filteredMembers.length === 0 ? (
            <EmptyState colors={colors} text="No membership requests here." />
          ) : (
            filteredMembers.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.requesterName}
                subtitle={r.requesterEmail}
                trailing={
                  <View className="flex-row items-center gap-1.5">
                    {r.status !== "pending" && (
                      <RequestStatusBadge colors={colors} status={r.status} />
                    )}
                    <KycStatusBadge status={r.requesterKycStatus} compact />
                  </View>
                }
                onPress={() => setSelected({ tab: "members", id: r.id })}
              />
            ))
          ))}

        {tab === "links" &&
          (filteredLinks.length === 0 ? (
            <EmptyState colors={colors} text="No facility-to-organization requests here." />
          ) : (
            filteredLinks.map((r) => (
              <RequestCard
                key={r.id}
                colors={colors}
                title={r.facilityName}
                subtitle={`wants to join ${r.organizationName}`}
                trailing={
                  r.status !== "pending" ? (
                    <RequestStatusBadge colors={colors} status={r.status} />
                  ) : undefined
                }
                onPress={() => setSelected({ tab: "links", id: r.id })}
              />
            ))
          ))}

        <View className="h-6" />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={closeDetail}>
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View
            className="w-full rounded-2xl p-5 gap-1"
            style={{ backgroundColor: colors.background, maxWidth: 480, maxHeight: "85%" }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Request Details
              </Text>
              <Pressable onPress={closeDetail} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView className="max-h-[70%]" contentContainerClassName="pb-2">
              {memberRequest && (
                <>
                  <DetailSection colors={colors} label="Requester">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                          {memberRequest.requesterName}
                        </Text>
                        <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>
                          {memberRequest.requesterEmail}
                        </Text>
                      </View>
                      <KycStatusBadge status={memberRequest.requesterKycStatus} compact />
                    </View>
                  </DetailSection>

                  <DetailSection colors={colors} label="Wants to join">
                    <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                      {targetFacility?.name ?? "Unknown facility"}
                    </Text>
                    {targetFacility && (
                      <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>
                        {targetFacility.type} · {targetFacility.location}, {targetFacility.region}
                      </Text>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Already a member of">
                    {loadingMemberships ? (
                      <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                        Loading...
                      </Text>
                    ) : requesterMemberships && requesterMemberships.length > 0 ? (
                      requesterMemberships.map((m) => (
                        <View key={m.facilityId} className="flex-row items-center gap-1.5 mt-1">
                          <MaterialCommunityIcons
                            name="hospital-building"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text className="text-[13px]" style={{ color: colors.text }}>
                            {m.facilityName} · {m.role}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                        Not a member anywhere yet.
                      </Text>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Requested">
                    <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                      {memberRequest.createdAt.toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </DetailSection>
                </>
              )}

              {linkRequest && (
                <>
                  <DetailSection colors={colors} label="Facility">
                    <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                      {linkRequest.facilityName}
                    </Text>
                    {linkFacility && (
                      <View className="flex-row items-center gap-2 mt-1">
                        <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                          {linkFacility.type} · {linkFacility.location}, {linkFacility.region}
                        </Text>
                        <KycStatusBadge status={linkFacility.kyc.status} compact />
                      </View>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Wants to join organization">
                    <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                      {linkRequest.organizationName}
                    </Text>
                    {linkOrganization && (
                      <View className="flex-row items-center gap-2 mt-1">
                        <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                          {linkOrganization.type}
                        </Text>
                        <KycStatusBadge status={linkOrganization.kyc.status} compact />
                      </View>
                    )}
                  </DetailSection>

                  <DetailSection colors={colors} label="Requested">
                    <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                      {linkRequest.createdAt.toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </DetailSection>
                </>
              )}

              {facilityRequest && (
                <>
                  <DetailSection colors={colors} label="Facility name">
                    <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                      {facilityRequest.name}
                    </Text>
                  </DetailSection>

                  <DetailSection colors={colors} label="Type & location">
                    <Text className="text-[13px]" style={{ color: colors.text }}>
                      {facilityRequest.type} · {facilityRequest.location}, {facilityRequest.region}
                    </Text>
                  </DetailSection>

                  {facilityRequest.address && (
                    <DetailSection colors={colors} label="Address">
                      <Text className="text-[13px]" style={{ color: colors.text }}>
                        {facilityRequest.address}
                      </Text>
                    </DetailSection>
                  )}

                  {(facilityRequest.phone || facilityRequest.email) && (
                    <DetailSection colors={colors} label="Contact">
                      {facilityRequest.phone && (
                        <Text className="text-[13px]" style={{ color: colors.text }}>
                          {facilityRequest.phone}
                        </Text>
                      )}
                      {facilityRequest.email && (
                        <Text className="text-[13px]" style={{ color: colors.text }}>
                          {facilityRequest.email}
                        </Text>
                      )}
                    </DetailSection>
                  )}

                  {facilityRequest.registrationNumber && (
                    <DetailSection colors={colors} label="Registration number">
                      <Text className="text-[13px]" style={{ color: colors.text }}>
                        {facilityRequest.registrationNumber}
                      </Text>
                    </DetailSection>
                  )}

                  <DetailSection colors={colors} label="Requested">
                    <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                      {facilityRequest.createdAt.toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </DetailSection>
                </>
              )}

              {orgRequest && (
                <>
                  <DetailSection colors={colors} label="Organization name">
                    <Text className="text-[15px] font-bold" style={{ color: colors.text }}>
                      {orgRequest.name}
                    </Text>
                  </DetailSection>

                  <DetailSection colors={colors} label="Type">
                    <Text className="text-[13px]" style={{ color: colors.text }}>
                      {orgRequest.type}
                    </Text>
                  </DetailSection>

                  {orgRequest.headquartersLocation && (
                    <DetailSection colors={colors} label="Headquarters">
                      <Text className="text-[13px]" style={{ color: colors.text }}>
                        {orgRequest.headquartersLocation}
                      </Text>
                    </DetailSection>
                  )}

                  {(orgRequest.phone || orgRequest.email) && (
                    <DetailSection colors={colors} label="Contact">
                      {orgRequest.phone && (
                        <Text className="text-[13px]" style={{ color: colors.text }}>
                          {orgRequest.phone}
                        </Text>
                      )}
                      {orgRequest.email && (
                        <Text className="text-[13px]" style={{ color: colors.text }}>
                          {orgRequest.email}
                        </Text>
                      )}
                    </DetailSection>
                  )}

                  {orgRequest.registrationNumber && (
                    <DetailSection colors={colors} label="Registration number">
                      <Text className="text-[13px]" style={{ color: colors.text }}>
                        {orgRequest.registrationNumber}
                      </Text>
                    </DetailSection>
                  )}

                  <DetailSection colors={colors} label="Requested">
                    <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                      {orgRequest.createdAt.toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </DetailSection>
                </>
              )}
            </ScrollView>

            {selectedStatus !== "pending" ? (
              <View
                className="flex-row items-center gap-2 p-3 rounded-[10px]"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <RequestStatusBadge colors={colors} status={selectedStatus ?? "pending"} />
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  This request has already been decided.
                </Text>
              </View>
            ) : rejecting ? (
              <View className="gap-2.5">
                <TextInput
                  value={reasonText}
                  onChangeText={setReasonText}
                  placeholder="Reason (shown to the requester)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  className="border rounded-lg p-2.5 text-[13px] min-h-[70px]"
                  style={{
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                    textAlignVertical: "top",
                  }}
                />
                <View className="flex-row gap-2.5 mt-2">
                  <Pressable onPress={() => setRejecting(false)} className="flex-1 items-center py-3">
                    <Text className="font-semibold" style={{ color: colors.textSecondary }}>
                      Back
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleReject}
                    className="flex-1 items-center py-3"
                    disabled={!reasonText.trim()}
                  >
                    <Text
                      className="font-bold"
                      style={{
                        color: colors.error,
                        opacity: reasonText.trim() ? 1 : 0.4,
                      }}
                    >
                      Confirm Decline
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-2.5 mt-2">
                <Pressable
                  onPress={() => setRejecting(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-[10px]"
                  style={{ backgroundColor: colors.error + "18" }}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.error} />
                  <Text className="text-[13px] font-bold" style={{ color: colors.error }}>
                    Reject
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleApprove}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-[10px]"
                  style={{ backgroundColor: colors.success + "18" }}
                >
                  <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                  <Text className="text-[13px] font-bold" style={{ color: colors.success }}>
                    Approve
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RequestStatusBadge({ colors, status }: { colors: any; status: string }) {
  const color =
    status === "approved" ? colors.success : status === "rejected" ? colors.error : colors.warning;
  const label =
    status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending";

  return (
    <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: color + "18" }}>
      <Text className="text-[10px] font-bold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function EmptyState({ colors, text }: { colors: any; text: string }) {
  return (
    <View className="items-center justify-center py-16 gap-2.5">
      <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.textSecondary} />
      <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
        {text}
      </Text>
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
      className="flex-row items-center gap-2.5 rounded-xl p-3.5 active:opacity-70"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      <View className="flex-1">
        <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {trailing}
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

function DetailSection({
  colors,
  label,
  children,
}: {
  colors: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text
        className="text-[10px] font-bold tracking-wide mb-1 uppercase"
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}