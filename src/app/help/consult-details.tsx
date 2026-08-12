import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import SubmitButton from "@/shared/components/submit-button";
import DetailSkeleton from "@/shared/components/detail-skeleton";

const fmtDate = (d?: Date) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "-";

export default function ConsultDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const consultRequests = useHelpStore((state) => state.consultRequests);
  const isLoadingConsultRequests = useHelpStore((state) => state.isLoadingConsultRequests);
  const fetchConsultRequests = useHelpStore((state) => state.fetchConsultRequests);
  const fetchConsultResponses = useHelpStore((state) => state.fetchConsultResponses);
  const getConsultResponses = useHelpStore((state) => state.getConsultResponses);
  const cancelConsultRequest = useHelpStore((state) => state.cancelConsultRequest);
  const respondToConsult = useHelpStore((state) => state.respondToConsult);
  const completeConsultRequest = useHelpStore((state) => state.completeConsultRequest);

  const [consultantName, setConsultantName] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchConsultRequests();
    fetchConsultResponses(id);
  }, [id]);

  const request = useMemo(() => consultRequests.find((c) => c.id === id), [consultRequests, id]);
  const responses = useMemo(() => (id ? getConsultResponses(id) : []), [id, getConsultResponses, consultRequests]);

  if (!request) {
    if (isLoadingConsultRequests) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>No consult request found for id: {id}</Text>
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
    toast[ok ? "success" : "error"](ok ? "Request cancelled." : "Couldn't cancel the request.");
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
    toast[ok ? "success" : "error"](ok ? "Marked as completed." : "Couldn't update the request.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {request.subject}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{request.code}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Topic</Text>
              <Text style={[styles.value, { color: colors.text }]}>{request.category}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
              <Text style={[styles.value, { color: colors.text, textTransform: "capitalize" }]}>
                {request.status}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Format</Text>
              <Text style={[styles.value, { color: colors.text, textTransform: "capitalize" }]}>
                {request.preferredFormat.replace("_", " ")}
              </Text>
            </View>
            {request.consultantName && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Consultant</Text>
                <Text style={[styles.value, { color: colors.text }]}>{request.consultantName}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Submitted</Text>
              <Text style={[styles.value, { color: colors.text }]}>{fmtDate(request.createdAt)}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{request.description}</Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Responses ({responses.length})</Text>
          {responses.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              No response yet — a consultant will follow up soon.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {responses.map((response) => (
                <View
                  key={response.id}
                  style={[styles.responseCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <View style={styles.responseHeader}>
                    <Text style={[styles.responseAuthor, { color: colors.text }]}>{response.consultantName}</Text>
                    <Text style={[styles.responseTime, { color: colors.textSecondary }]}>
                      {format(response.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.responseMessage, { color: colors.textSecondary }]}>{response.message}</Text>
                </View>
              ))}
            </View>
          )}

          {isOpen && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Respond as consultant</Text>
              <TextInput
                value={consultantName}
                onChangeText={setConsultantName}
                placeholder="Your name, e.g. Dr. Efua Owusu, PharmD"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Write your reply..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
                multiline
                textAlignVertical="top"
              />
              <SubmitButton label="Send Reply" onPress={handleSendReply} icon="send-outline" />

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleComplete}
                  style={[styles.secondaryButton, { backgroundColor: colors.success + "18" }]}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={15} color={colors.success} />
                  <Text style={[styles.secondaryButtonText, { color: colors.success }]}>Mark Completed</Text>
                </Pressable>
                <Pressable
                  onPress={handleCancel}
                  style={[styles.secondaryButton, { backgroundColor: colors.error + "18" }]}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={15} color={colors.error} />
                  <Text style={[styles.secondaryButtonText, { color: colors.error }]}>Cancel Request</Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { fontSize: 12 },
  value: { fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 20 },
  responseCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  responseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  responseAuthor: { fontSize: 13, fontWeight: "600" },
  responseTime: { fontSize: 11 },
  responseMessage: { fontSize: 13, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: { minHeight: 80 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  secondaryButtonText: { fontSize: 12, fontWeight: "700" },
});
