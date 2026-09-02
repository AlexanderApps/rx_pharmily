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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import SubmitButton from "@/shared/components/submit-button";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export default function ConsultDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Matches the DB's own restriction — consult_responses' insert policy
  // already requires is_admin() (covering both admin and superadmin,
  // same as every other admin gate in this app). Without this check the
  // request's own creator would see a "Respond as consultant" form they
  // can't actually use — RLS would silently reject the submission
  // rather than the UI never offering it.
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const consultRequests = useHelpStore((state) => state.consultRequests);
  const isLoadingConsultRequests = useHelpStore(
    (state) => state.isLoadingConsultRequests,
  );
  const fetchConsultRequests = useHelpStore((state) => state.fetchConsultRequests);
  const fetchConsultResponses = useHelpStore((state) => state.fetchConsultResponses);
  const getConsultResponses = useHelpStore((state) => state.getConsultResponses);
  const cancelConsultRequest = useHelpStore((state) => state.cancelConsultRequest);
  const respondToConsult = useHelpStore((state) => state.respondToConsult);
  const completeConsultRequest = useHelpStore(
    (state) => state.completeConsultRequest,
  );

  const [consultantName, setConsultantName] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchConsultRequests();
    fetchConsultResponses(id);
  }, [id]);

  const request = useMemo(
    () => consultRequests.find((c) => c.id === id),
    [consultRequests, id],
  );
  const responses = useMemo(
    () => (id ? getConsultResponses(id) : []),
    [id, getConsultResponses, consultRequests],
  );

  if (!request) {
    if (isLoadingConsultRequests) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>
          No consult request found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isOpen = request.status === "pending" || request.status === "accepted";

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: "Cancel this request?",
      message: "You can submit a new one anytime.",
      confirmLabel: "Cancel Request",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!confirmed) return;
    const ok = await cancelConsultRequest(request.id);
    toast[ok ? "success" : "error"](
      ok ? "Request cancelled." : "Couldn't cancel the request.",
    );
  };

  const handleSendReply = async () => {
    if (!consultantName.trim() || !replyMessage.trim()) {
      Alert.alert("Missing information", "Add a consultant name and a message.");
      return;
    }
    const ok = await respondToConsult(request.id, consultantName, replyMessage);
    if (ok) {
      setReplyMessage("");
      toast.success("Reply sent.");
    } else {
      toast.error("Couldn't send the reply. Please try again.");
    }
  };

  const handleComplete = async () => {
    const confirmed = await confirm({
      title: "Mark as completed?",
      message: "This closes out the request.",
      confirmLabel: "Mark Completed",
    });
    if (!confirmed) return;
    const ok = await completeConsultRequest(request.id);
    toast[ok ? "success" : "error"](
      ok ? "Marked as completed." : "Couldn't update the request.",
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <ScreenHeader title={request.subject} subtitle={request.code} />

        <ScrollView
          contentContainerClassName="p-4 gap-3.5"
          keyboardShouldPersistTaps="handled"
        >
          {/* Info card */}
          <View
            className="rounded-[14px] border p-4 gap-2"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Topic
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {request.category}
              </Text>
            </View>
            <View className="flex-row justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Status
              </Text>
              <Text
                className="text-[13px] font-medium capitalize"
                style={{ color: colors.text }}
              >
                {request.status}
              </Text>
            </View>
            <View className="flex-row justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Format
              </Text>
              <Text
                className="text-[13px] font-medium capitalize"
                style={{ color: colors.text }}
              >
                {request.preferredFormat.replace("_", " ")}
              </Text>
            </View>
            {request.consultantName && (
              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Consultant
                </Text>
                <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                  {request.consultantName}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Submitted
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {fmtDate(request.createdAt)}
              </Text>
            </View>
          </View>

          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Details
          </Text>
          <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
            {request.description}
          </Text>

          <Text className="text-sm font-bold" style={{ color: colors.text }}>
            Responses ({responses.length})
          </Text>

          {responses.length === 0 ? (
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              No response yet — a consultant will follow up soon.
            </Text>
          ) : (
            <View className="gap-2.5">
              {responses.map((response) => (
                <View
                  key={response.id}
                  className="rounded-xl border p-3 gap-1.5"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: colors.text }}
                    >
                      {response.consultantName}
                    </Text>
                    <Text
                      className="text-[11px]"
                      style={{ color: colors.textSecondary }}
                    >
                      {format(response.createdAt)}
                    </Text>
                  </View>
                  <Text
                    className="text-[13px] leading-[19px]"
                    style={{ color: colors.textSecondary }}
                  >
                    {response.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {isOpen && isAdmin && (
            <>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                Respond as consultant
              </Text>
              <TextInput
                value={consultantName}
                onChangeText={setConsultantName}
                placeholder="Your name, e.g. Dr. Efua Owusu, PharmD"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
              <TextInput
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Write your reply..."
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
              <SubmitButton
                label="Send Reply"
                onPress={handleSendReply}
                icon="send-outline"
              />
              <View className="flex-row gap-2 mt-1">
                <Pressable
                  onPress={handleComplete}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
                  style={{ backgroundColor: colors.success + "18" }}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={15}
                    color={colors.success}
                  />
                  <Text
                    className="text-xs font-bold"
                    style={{ color: colors.success }}
                  >
                    Mark Completed
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[10px]"
                  style={{ backgroundColor: colors.error + "18" }}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={15}
                    color={colors.error}
                  />
                  <Text className="text-xs font-bold" style={{ color: colors.error }}>
                    Cancel Request
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}