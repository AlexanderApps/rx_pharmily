import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput } from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useProfileUpdateStore } from "@/features/profile-updates/hooks/use-profile-update-data";
import {
  LOCKED_FIELDS,
  ProfileUpdateRequest,
} from "@/features/profile-updates/types/profile-update.types";
import { getProfileUpdateDocumentSignedUrl } from "@/lib/profile-update-storage";

function useEntityName(request: ProfileUpdateRequest): string {
  const getUserDisplay = useProfileStore((state) => state.getUserDisplay);
  const getFacility = useProfileStore((state) => state.getFacility);
  const getOrganization = useProfileStore((state) => state.getOrganization);

  if (request.entityType === "user") return getUserDisplay(request.entityId).name;
  if (request.entityType === "facility") return getFacility(request.entityId)?.name ?? "Unknown facility";
  return getOrganization(request.entityId)?.name ?? "Unknown organization";
}

function fieldLabel(entityType: ProfileUpdateRequest["entityType"], key: string): string {
  return LOCKED_FIELDS[entityType].find((f) => f.key === key)?.label ?? key;
}

export default function AdminProfileUpdateRequestsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const requests = useProfileUpdateStore((state) => state.requests);
  const fetchPendingRequests = useProfileUpdateStore((state) => state.fetchPendingRequests);
  const approveRequest = useProfileUpdateStore((state) => state.approveRequest);
  const rejectRequest = useProfileUpdateStore((state) => state.rejectRequest);
  const mergeRequest = useProfileUpdateStore((state) => state.mergeRequest);
  const fetchAuditTrail = useProfileUpdateStore((state) => state.fetchAuditTrail);
  const auditEvents = useProfileUpdateStore((state) => state.auditEvents);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const [rejectTarget, setRejectTarget] = useState<ProfileUpdateRequest | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved">("pending");

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const filtered = useMemo(
    () =>
      requests
        .filter((r) => r.status === statusFilter)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [requests, statusFilter],
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  const handleApprove = async (request: ProfileUpdateRequest) => {
    const ok = await confirm({
      title: "Approve this request?",
      message: "This does not apply the changes yet — you'll still need to merge it afterward.",
      confirmLabel: "Approve",
    });
    if (!ok) return;
    const success = await approveRequest(request.id);
    if (success) toast.success("Request approved.");
    else toast.error("Couldn't approve the request.");
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!reasonText.trim()) {
      toast.error("A reason is required to reject a request.");
      return;
    }
    const success = await rejectRequest(rejectTarget.id, reasonText.trim());
    if (success) toast.success("Request rejected.");
    else toast.error("Couldn't reject the request.");
    setRejectTarget(null);
    setReasonText("");
  };

  const handleMerge = async (request: ProfileUpdateRequest) => {
    const ok = await confirm({
      title: "Merge this request?",
      message: "This applies the requested changes directly to the profile. This can't be undone.",
      confirmLabel: "Merge",
    });
    if (!ok) return;
    const success = await mergeRequest(request.id);
    if (success) toast.success("Changes merged.");
    else toast.error("Couldn't merge the request.");
  };

  const handleViewDocument = async (path: string) => {
    const url = await getProfileUpdateDocumentSignedUrl(path);
    if (!url) {
      toast.error("Couldn't open that document.");
      return;
    }
    // No in-app viewer for arbitrary document types (PDFs included) —
    // the system browser/viewer handles whatever format was uploaded.
    const { Linking } = require("react-native");
    Linking.openURL(url);
  };

  const toggleAudit = (request: ProfileUpdateRequest) => {
    if (expandedAudit === request.id) {
      setExpandedAudit(null);
      return;
    }
    setExpandedAudit(request.id);
    if (!auditEvents[request.id]) fetchAuditTrail(request.id);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Profile Update Requests" centered />

      <StatusFilterTabs
        options={[
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "approved", label: "Awaiting Merge", count: approvedCount },
        ]}
        selected={statusFilter}
        onSelect={(key) => setStatusFilter(key as "pending" | "approved")}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <EmptyState
            icon="account-edit-outline"
            title="Nothing here"
            message={
              statusFilter === "pending"
                ? "No pending profile update requests."
                : "No approved requests waiting to be merged."
            }
          />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onApprove={() => handleApprove(item)}
            onReject={() => setRejectTarget(item)}
            onMerge={() => handleMerge(item)}
            onViewDocument={handleViewDocument}
            onToggleAudit={() => toggleAudit(item)}
            auditExpanded={expandedAudit === item.id}
            auditEvents={auditEvents[item.id] ?? []}
          />
        )}
      />

      <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="w-full rounded-2xl p-5 gap-3" style={{ backgroundColor: colors.background }}>
            <Text className="text-base font-bold" style={{ color: colors.text }}>Reject Request</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              This reason is shown to the requester.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason for rejection"
              placeholderTextColor={colors.textSecondary}
              multiline
              className="border rounded-lg px-3 py-2.5 text-sm min-h-[80px]"
              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }}
            />
            <View className="flex-row gap-2 mt-1">
              <Pressable
                onPress={() => {
                  setRejectTarget(null);
                  setReasonText("");
                }}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleReject} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: colors.error }}>
                <Text className="text-sm font-semibold text-white">Reject</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RequestCard({
  request,
  onApprove,
  onReject,
  onMerge,
  onViewDocument,
  onToggleAudit,
  auditExpanded,
  auditEvents,
}: {
  request: ProfileUpdateRequest;
  onApprove: () => void;
  onReject: () => void;
  onMerge: () => void;
  onViewDocument: (path: string) => void;
  onToggleAudit: () => void;
  auditExpanded: boolean;
  auditEvents: { id: string; eventType: string; actorName: string; comment?: string; createdAt: Date }[];
}) {
  const { colors } = useTheme();
  const entityName = useEntityName(request);

  return (
    <View className="rounded-2xl border p-3.5 gap-3" style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
            {entityName}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            {request.entityType} · {format(request.createdAt)}
          </Text>
        </View>
      </View>

      <View className="gap-1.5">
        {Object.entries(request.changes).map(([key, newValue]) => (
          <View key={key} className="flex-row items-start gap-2">
            <Text className="text-xs font-semibold w-24" style={{ color: colors.textSecondary }}>
              {fieldLabel(request.entityType, key)}
            </Text>
            <View className="flex-1">
              <Text className="text-xs" style={{ color: colors.error, textDecorationLine: "line-through" }}>
                {request.previousValues[key] || "(empty)"}
              </Text>
              <Text className="text-xs font-medium" style={{ color: colors.success }}>
                {newValue || "(empty)"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {request.supportingDocuments.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {request.supportingDocuments.map((doc) => (
            <Pressable
              key={doc.uri}
              onPress={() => onViewDocument(doc.uri)}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <MaterialCommunityIcons name="file-document-outline" size={13} color={colors.primary} />
              <Text className="text-xs font-medium" style={{ color: colors.primary }} numberOfLines={1}>
                {doc.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={onToggleAudit} className="flex-row items-center gap-1">
        <MaterialCommunityIcons
          name={auditExpanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textSecondary}
        />
        <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
          Audit trail
        </Text>
      </Pressable>
      {auditExpanded && (
        <View className="gap-1.5 pl-1">
          {auditEvents.map((event) => (
            <View key={event.id} className="flex-row items-start gap-2">
              <View className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: colors.primary }} />
              <Text className="text-[11px] flex-1" style={{ color: colors.textSecondary }}>
                <Text className="font-semibold" style={{ color: colors.text }}>{event.actorName}</Text>
                {" "}
                {event.eventType} · {format(event.createdAt)}
                {event.comment ? ` — "${event.comment}"` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      {request.status === "pending" && (
        <View className="flex-row gap-2 mt-1">
          <Pressable onPress={onReject} className="flex-1 py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.backgroundElement }}>
            <Text className="text-sm font-semibold" style={{ color: colors.error }}>Reject</Text>
          </Pressable>
          <Pressable onPress={onApprove} className="flex-1 py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.primary }}>
            <Text className="text-sm font-semibold text-white">Approve</Text>
          </Pressable>
        </View>
      )}
      {request.status === "approved" && (
        <Pressable onPress={onMerge} className="py-2.5 rounded-xl items-center mt-1" style={{ backgroundColor: colors.success }}>
          <Text className="text-sm font-semibold text-white">Merge Changes</Text>
        </Pressable>
      )}
    </View>
  );
}
