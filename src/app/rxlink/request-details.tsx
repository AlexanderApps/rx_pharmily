import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import LoadingImage from "@/shared/components/loading-image";
import ImageViewerModal from "@/shared/components/image-viewer-modal";
import SubmitButton from "@/shared/components/submit-button";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useRxLinkStore } from "@/features/rxlink/hooks/use-rxlink-data";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting response",
  acknowledged: "Being worked on",
  responded: "Responded",
  rejected: "Rejected",
  resolved: "Resolved",
};

export default function RxLinkRequestDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  // Same reasoning as consult-details.tsx — the respond form is gated
  // to match rxlink_responses' own insert policy (is_admin() only), so
  // a non-admin viewing their own request never sees a form they can't
  // actually use.
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const requests = useRxLinkStore((state) => state.requests);
  const isLoading = useRxLinkStore((state) => state.isLoading);
  const fetchRequests = useRxLinkStore((state) => state.fetchRequests);
  const fetchImages = useRxLinkStore((state) => state.fetchImages);
  const fetchResponses = useRxLinkStore((state) => state.fetchResponses);
  const imagesByRequest = useRxLinkStore((state) => state.imagesByRequest);
  const responsesByRequest = useRxLinkStore((state) => state.responsesByRequest);
  const signedUrlByPath = useRxLinkStore((state) => state.signedUrlByPath);
  const closeRequestAsRequester = useRxLinkStore((state) => state.closeRequestAsRequester);
  const closeRequestAsAdmin = useRxLinkStore((state) => state.closeRequestAsAdmin);
  const sendMessage = useRxLinkStore((state) => state.sendMessage);
  const acknowledgeRequest = useRxLinkStore((state) => state.acknowledgeRequest);
  const rejectRequest = useRxLinkStore((state) => state.rejectRequest);

  const [replyMessage, setReplyMessage] = useState("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchRequests();
    fetchImages(id);
    fetchResponses(id);
  }, [id]);

  const request = useMemo(() => requests.find((r) => r.id === id), [requests, id]);
  // Selected directly from the store slice that actually changes when
  // fetchImages/fetchResponses resolve — a useMemo keyed on `requests`
  // (a different, unrelated array) previously meant this never reliably
  // recomputed once the fetch actually completed, so the screen stayed
  // stuck showing no images even after they'd loaded into the store.
  const images = id ? (imagesByRequest[id] ?? []) : [];
  const responses = id ? (responsesByRequest[id] ?? []) : [];

  if (!request) {
    if (isLoading) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>
          No RxLink request found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isOwner = request.createdBy === currentUserId;
  // Terminal states only — 'rejected' and 'resolved' are the only two
  // statuses nothing further ever happens from. A request can still be
  // 'responded' with one side already closed; the conversation and the
  // other side's own close action both stay available until BOTH have
  // closed (which the DB itself then turns into 'resolved').
  const isOpen = request.status !== "rejected" && request.status !== "resolved";
  const isRequesterClosed = !!request.requesterClosedAt;
  const isAdminClosed = !!request.adminClosedAt;

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert("Missing information", "Write a message before sending.");
      return;
    }
    const ok = await sendMessage(request.id, replyMessage);
    if (ok) {
      setReplyMessage("");
      toast.success("Message sent.");
    } else {
      toast.error("Couldn't send the message. Please try again.");
    }
  };

  const handleAcknowledge = async () => {
    setSubmittingAction(true);
    const result = await acknowledgeRequest(request.id);
    setSubmittingAction(false);
    if (result.ok) {
      toast.success("Marked as being worked on.");
    } else {
      toast.error(result.error ?? "Couldn't acknowledge the request.");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("A reason is required.");
      return;
    }
    const confirmed = await confirm({
      title: "Reject this request?",
      message: "The requester will see your reason. This can't be undone.",
      confirmLabel: "Reject",
      destructive: true,
    });
    if (!confirmed) return;
    setSubmittingAction(true);
    const result = await rejectRequest(request.id, rejectReason);
    setSubmittingAction(false);
    if (result.ok) {
      toast.success("Request rejected.");
      setShowRejectForm(false);
      setRejectReason("");
    } else {
      toast.error(result.error ?? "Couldn't reject the request.");
    }
  };

  const handleCloseAsRequester = async () => {
    const confirmed = await confirm({
      title: "Close your side of this request?",
      message: "You can still send a follow-up later if you need to. This just tells the admin you don't expect more from them right now.",
      confirmLabel: "Close My Side",
    });
    if (!confirmed) return;
    setSubmittingAction(true);
    const result = await closeRequestAsRequester(request.id);
    setSubmittingAction(false);
    toast[result.ok ? "success" : "error"](result.ok ? "Closed your side of this request." : result.error ?? "Couldn't close the request.");
  };

  const handleCloseAsAdmin = async () => {
    const confirmed = await confirm({
      title: "Close this request?",
      message: "This tells the requester you're done responding, unless they follow up again.",
      confirmLabel: "Close",
    });
    if (!confirmed) return;
    setSubmittingAction(true);
    const result = await closeRequestAsAdmin(request.id);
    setSubmittingAction(false);
    toast[result.ok ? "success" : "error"](result.ok ? "Closed the request." : result.error ?? "Couldn't close the request.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScreenHeader title={request.code} subtitle={STATUS_LABEL[request.status]} />

        <ScrollView contentContainerClassName="p-4 gap-3.5" keyboardShouldPersistTaps="handled">
          {isAdmin && (
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Requested by <Text style={{ fontWeight: "700", color: colors.text }}>{request.createdByName}</Text>
            </Text>
          )}

          {request.status === "rejected" && request.rejectionReason && (
            <View className="rounded-xl p-3 gap-1" style={{ backgroundColor: colors.error + "12" }}>
              <Text className="text-xs font-bold" style={{ color: colors.error }}>Rejected</Text>
              <Text className="text-xs" style={{ color: colors.error }}>{request.rejectionReason}</Text>
            </View>
          )}

          {request.acknowledgedAt && (
            <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
              Acknowledged by {request.acknowledgedByName ?? "an admin"} {format(request.acknowledgedAt)}
            </Text>
          )}

          {(isRequesterClosed || isAdminClosed) && request.status !== "resolved" && (
            <View className="rounded-xl p-3 gap-0.5" style={{ backgroundColor: colors.backgroundSecondary }}>
              {isRequesterClosed && (
                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                  {isOwner ? "You've" : "The requester has"} closed their side.
                </Text>
              )}
              {isAdminClosed && (
                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                  {isAdmin ? "You've" : "An admin has"} closed their side.
                </Text>
              )}
            </View>
          )}

          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Photos ({images.length})
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {images.map((img) => {
              const url = signedUrlByPath[img.storagePath];
              return (
                <View key={img.id} className="w-[100px] h-[100px]">
                  {url ? (
                    <Pressable onPress={() => setViewerUrl(url)}>
                      <LoadingImage
                        source={{ uri: url }}
                        style={{ width: 100, height: 100, borderRadius: 10 }}
                      />
                    </Pressable>
                  ) : (
                    <View
                      className="w-[100px] h-[100px] rounded-[10px] items-center justify-center"
                      style={{ backgroundColor: colors.backgroundSecondary }}
                    >
                      <MaterialCommunityIcons name="image-off-outline" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View
                    className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                  >
                    <Text className="text-[9px] font-bold text-white capitalize">{img.imageType}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {request.comment && (
            <>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                Additional details
              </Text>
              <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                {request.comment}
              </Text>
            </>
          )}

          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Conversation ({responses.length})
          </Text>

          {responses.length === 0 ? (
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              No messages yet — an admin will follow up soon.
            </Text>
          ) : (
            <View className="gap-2.5">
              {responses.map((response) => (
                <View
                  key={response.id}
                  className="rounded-xl border p-3 gap-1.5"
                  style={{
                    backgroundColor: response.isFromAdmin ? colors.primary + "0d" : colors.backgroundSecondary,
                    borderColor: response.isFromAdmin ? colors.primary + "30" : colors.border,
                  }}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1.5">
                      {response.isFromAdmin && (
                        <MaterialCommunityIcons name="shield-account-outline" size={13} color={colors.primary} />
                      )}
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: response.isFromAdmin ? colors.primary : colors.text }}
                      >
                        {response.isFromAdmin ? `${response.senderName} (admin)` : response.senderName}
                      </Text>
                    </View>
                    <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                      {format(response.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>
                    {response.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {isOpen && (isAdmin || isOwner) && (
            <>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {isAdmin ? "Respond" : "Send a follow-up"}
              </Text>
              <TextInput
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder={isAdmin ? "Where's it available, and any other details..." : "Add more detail, or ask a question..."}
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm min-h-20"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlignVertical: "top",
                }}
                multiline
              />
              <SubmitButton label={isAdmin ? "Send Reply" : "Send Follow-up"} onPress={handleSendReply} icon="send-outline" />
            </>
          )}

          {isAdmin && request.status === "pending" && (
            <Pressable
              onPress={handleAcknowledge}
              disabled={submittingAction}
              className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: colors.info + "18", opacity: submittingAction ? 0.6 : 1 }}
            >
              <MaterialCommunityIcons name="eye-check-outline" size={15} color={colors.info} />
              <Text className="text-xs font-bold" style={{ color: colors.info }}>
                Acknowledge — mark as being worked on
              </Text>
            </Pressable>
          )}

          {isAdmin && isOpen && (
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundElement }}>
              <Pressable
                onPress={() => setShowRejectForm((v) => !v)}
                className="flex-row items-center justify-center gap-1.5 py-2.5"
              >
                <MaterialCommunityIcons name="close-circle-outline" size={15} color={colors.error} />
                <Text className="text-xs font-bold" style={{ color: colors.error }}>Reject Request</Text>
              </Pressable>
              {showRejectForm && (
                <View className="gap-2 px-3 pb-3">
                  <TextInput
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholder="Reason for rejecting"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    className="rounded-lg px-3 py-2.5 text-sm min-h-16"
                    style={{ backgroundColor: colors.background, color: colors.text, textAlignVertical: "top" }}
                  />
                  <SubmitButton label="Confirm Rejection" onPress={handleReject} icon="close-circle-outline" />
                </View>
              )}
            </View>
          )}

          {isAdmin && isOpen && !isAdminClosed && (
            <Pressable
              onPress={handleCloseAsAdmin}
              disabled={submittingAction}
              className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: colors.backgroundSecondary, opacity: submittingAction ? 0.6 : 1 }}
            >
              <MaterialCommunityIcons name="archive-check-outline" size={15} color={colors.textSecondary} />
              <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                Close My Side — done responding
              </Text>
            </Pressable>
          )}

          {isOwner && isOpen && !isRequesterClosed && (
            <Pressable
              onPress={handleCloseAsRequester}
              disabled={submittingAction}
              className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: colors.backgroundSecondary, opacity: submittingAction ? 0.6 : 1 }}
            >
              <MaterialCommunityIcons name="archive-check-outline" size={15} color={colors.textSecondary} />
              <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                Close My Side
              </Text>
            </Pressable>
          )}

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>

      <ImageViewerModal
        visible={!!viewerUrl}
        source={{ uri: viewerUrl ?? "" }}
        onClose={() => setViewerUrl(null)}
      />
    </SafeAreaView>
  );
}
