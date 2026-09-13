import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useOwnershipTransferStore } from "@/features/ownership-transfer/hooks/use-ownership-transfer-data";
import { OwnershipTransferRequest } from "@/features/ownership-transfer/types/ownership-transfer.types";
import { getOwnershipTransferDocumentSignedUrl } from "@/lib/ownership-transfer-storage";

function useEntityName(request: OwnershipTransferRequest): string {
  const getFacility = useProfileStore((state) => state.getFacility);
  const getOrganization = useProfileStore((state) => state.getOrganization);
  if (request.entityType === "facility") return getFacility(request.entityId)?.name ?? "Unknown facility";
  return getOrganization(request.entityId)?.name ?? "Unknown organization";
}

type ReviewAction = "approve" | "reject";

export default function AdminOwnershipTransferRequestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const requests = useOwnershipTransferStore((state) => state.requests);
  const fetchPendingRequests = useOwnershipTransferStore((state) => state.fetchPendingRequests);
  const approveRequest = useOwnershipTransferStore((state) => state.approveRequest);
  const rejectRequest = useOwnershipTransferStore((state) => state.rejectRequest);
  const fetchAuditTrail = useOwnershipTransferStore((state) => state.fetchAuditTrail);
  const auditEvents = useOwnershipTransferStore((state) => state.auditEvents);

  useEffect(() => {
    if (!isAdmin) return;
    fetchPendingRequests();
  }, [isAdmin]);

  const [reviewTarget, setReviewTarget] = useState<{ request: OwnershipTransferRequest; action: ReviewAction } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  if (!isAdmin) return <Redirect href="/(tabs)" />;

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    if (!commentText.trim()) {
      toast.error(`A comment is required to ${reviewTarget.action} a request.`);
      return;
    }
    const success =
      reviewTarget.action === "approve"
        ? await approveRequest(reviewTarget.request.id, commentText.trim())
        : await rejectRequest(reviewTarget.request.id, commentText.trim());
    if (success) {
      toast.success(reviewTarget.action === "approve" ? "Ownership transferred." : "Request rejected.");
    } else {
      toast.error(`Couldn't ${reviewTarget.action} the request.`);
    }
    setReviewTarget(null);
    setCommentText("");
  };

  const handleViewDocument = async (path: string) => {
    const url = await getOwnershipTransferDocumentSignedUrl(path);
    if (!url) {
      toast.error("Couldn't open that document.");
      return;
    }
    const { Linking } = require("react-native");
    Linking.openURL(url);
  };

  const toggleAudit = (request: OwnershipTransferRequest) => {
    if (expandedAudit === request.id) {
      setExpandedAudit(null);
      return;
    }
    setExpandedAudit(request.id);
    if (!auditEvents[request.id]) fetchAuditTrail(request.id);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Ownership Transfer Requests" subtitle="Review who's requesting to take over a facility or organization" />

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState icon="account-key-outline" message="No pending ownership requests." />}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onApprove={() => setReviewTarget({ request: item, action: "approve" })}
            onReject={() => setReviewTarget({ request: item, action: "reject" })}
            onViewDocument={handleViewDocument}
            onToggleAudit={() => toggleAudit(item)}
            auditExpanded={expandedAudit === item.id}
            auditEvents={auditEvents[item.id] ?? []}
            onReviewRequester={() =>
              router.push({
                pathname: "/admin/moderation-detail",
                params: { entityType: "user", entityId: item.requestedBy },
              })
            }
          />
        )}
      />

      <Modal visible={!!reviewTarget} transparent animationType="fade" onRequestClose={() => setReviewTarget(null)}>
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className="w-full rounded-2xl p-5 gap-3" style={{ backgroundColor: colors.background }}>
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {reviewTarget?.action === "approve" ? "Approve Ownership Transfer" : "Reject Ownership Request"}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {reviewTarget?.action === "approve"
                ? "This immediately makes the requester the owner and demotes whoever held it before. This can't be undone from here."
                : "This reason is shown to the requester."}
            </Text>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={reviewTarget?.action === "approve" ? "Reason for approving" : "Reason for rejection"}
              placeholderTextColor={colors.textSecondary}
              multiline
              className="border rounded-lg px-3 py-2.5 text-sm min-h-[80px]"
              style={{ borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundElement }}
            />
            <View className="flex-row gap-2 mt-1">
              <Pressable
                onPress={() => {
                  setReviewTarget(null);
                  setCommentText("");
                }}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitReview}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: reviewTarget?.action === "approve" ? colors.primary : colors.error }}
              >
                <Text className="text-sm font-semibold text-white">
                  {reviewTarget?.action === "approve" ? "Approve" : "Reject"}
                </Text>
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
  onViewDocument,
  onToggleAudit,
  auditExpanded,
  auditEvents,
  onReviewRequester,
}: {
  request: OwnershipTransferRequest;
  onApprove: () => void;
  onReject: () => void;
  onViewDocument: (path: string) => void;
  onToggleAudit: () => void;
  auditExpanded: boolean;
  auditEvents: { id: string; eventType: string; actorName?: string; comment?: string; createdAt: Date }[];
  onReviewRequester: () => void;
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
            {request.entityType} · requested by {request.requestedByName ?? "Unknown"} · {format(request.createdAt)}
          </Text>
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
          Reason given
        </Text>
        <Text className="text-sm" style={{ color: colors.text }}>
          {request.reason}
        </Text>
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

      <View className="flex-row items-center gap-3">
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

        {/* Direct link to the requester's own moderation screen —
            deliberately one tap away, not something an admin has to
            remember to go find separately, since a rejected claim that
            looks like fraud is exactly the kind of thing that should be
            just as easy to act on as it was to reject. */}
        <Pressable onPress={onReviewRequester} className="flex-row items-center gap-1">
          <MaterialCommunityIcons name="account-alert-outline" size={14} color={colors.error} />
          <Text className="text-xs font-semibold" style={{ color: colors.error }}>
            Review requester's account
          </Text>
        </Pressable>
      </View>

      {auditExpanded && (
        <View className="gap-1.5 pl-1">
          {auditEvents.map((event) => (
            <View key={event.id} className="flex-row items-start gap-2">
              <View className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: colors.primary }} />
              <Text className="text-[11px] flex-1" style={{ color: colors.textSecondary }}>
                <Text className="font-semibold" style={{ color: colors.text }}>{event.actorName ?? "Unknown"}</Text>
                {" "}
                {event.eventType} · {format(event.createdAt)}
                {event.comment ? ` — "${event.comment}"` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row gap-2 mt-1">
        <Pressable onPress={onReject} className="flex-1 py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.backgroundElement }}>
          <Text className="text-sm font-semibold" style={{ color: colors.error }}>Reject</Text>
        </Pressable>
        <Pressable onPress={onApprove} className="flex-1 py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.primary }}>
          <Text className="text-sm font-semibold text-white">Approve</Text>
        </Pressable>
      </View>
    </View>
  );
}
