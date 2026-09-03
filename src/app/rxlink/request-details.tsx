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
  responded: "Responded",
  closed: "Closed",
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
  const closeRequest = useRxLinkStore((state) => state.closeRequest);
  const respondToRequest = useRxLinkStore((state) => state.respondToRequest);

  const [replyMessage, setReplyMessage] = useState("");
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

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
  const isOpen = request.status !== "closed";

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert("Missing information", "Write a message before sending.");
      return;
    }
    const ok = await respondToRequest(request.id, replyMessage);
    if (ok) {
      setReplyMessage("");
      toast.success("Reply sent.");
    } else {
      toast.error("Couldn't send the reply. Please try again.");
    }
  };

  const handleClose = async () => {
    const confirmed = await confirm({
      title: "Close this request?",
      message: "You can submit a new one anytime.",
      confirmLabel: "Close Request",
      destructive: true,
    });
    if (!confirmed) return;
    const ok = await closeRequest(request.id);
    toast[ok ? "success" : "error"](ok ? "Request closed." : "Couldn't close the request.");
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
            Responses ({responses.length})
          </Text>

          {responses.length === 0 ? (
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              No response yet — an admin will follow up soon.
            </Text>
          ) : (
            <View className="gap-2.5">
              {responses.map((response) => (
                <View
                  key={response.id}
                  className="rounded-xl border p-3 gap-1.5"
                  style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                      {response.responderName}
                    </Text>
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

          {isOpen && isAdmin && (
            <>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                Respond
              </Text>
              <TextInput
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Where's it available, and any other details..."
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
              <SubmitButton label="Send Reply" onPress={handleSendReply} icon="send-outline" />
            </>
          )}

          {isOpen && isOwner && (
            <Pressable
              onPress={handleClose}
              className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px] mt-1"
              style={{ backgroundColor: colors.error + "18" }}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={15} color={colors.error} />
              <Text className="text-xs font-bold" style={{ color: colors.error }}>
                Close Request
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
