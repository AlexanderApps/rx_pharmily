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
import EmergencyBanner from "@/features/help/components/emergency-banner";
import { toast } from "@/shared/hooks/use-toast";
import SubmitButton from "@/shared/components/submit-button";
import DetailSkeleton from "@/shared/components/detail-skeleton";

export default function QuestionDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const questions = useHelpStore((state) => state.questions);
  const isLoadingQuestions = useHelpStore((state) => state.isLoadingQuestions);
  const fetchQuestions = useHelpStore((state) => state.fetchQuestions);
  const answerQuestion = useHelpStore((state) => state.answerQuestion);

  const [pharmacistName, setPharmacistName] = useState("");
  const [answerMessage, setAnswerMessage] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const item = useMemo(() => questions.find((q) => q.id === id), [questions, id]);

  if (!item) {
    if (isLoadingQuestions) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>No question found for id: {id}</Text>
      </SafeAreaView>
    );
  }

  const handleSubmitAnswer = async () => {
    if (!pharmacistName.trim() || !answerMessage.trim()) {
      Alert.alert("Missing information", "Add a pharmacist name and a reply.");
      return;
    }
    const ok = await answerQuestion(item.id, pharmacistName, answerMessage);
    if (ok) {
      setPharmacistName("");
      setAnswerMessage("");
      toast.success("Reply sent.");
    } else {
      toast.error("Couldn't send the reply. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Question</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: colors.secondary + "18" }]}>
              <Text style={[styles.categoryText, { color: colors.secondary }]}>{item.category}</Text>
            </View>
            <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{format(item.createdAt)}</Text>
          </View>

          {item.medicationName && (
            <Text style={[styles.medication, { color: colors.textSecondary }]}>
              Regarding: {item.medicationName}
            </Text>
          )}

          <View style={[styles.questionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.questionText, { color: colors.text }]}>{item.question}</Text>
          </View>

          {item.answer ? (
            <View style={[styles.answerCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "40" }]}>
              <View style={styles.answerHeader}>
                <MaterialCommunityIcons name="account-check-outline" size={16} color={colors.success} />
                <Text style={[styles.answerAuthor, { color: colors.success }]}>{item.answer.pharmacistName}</Text>
                <Text style={[styles.answerTime, { color: colors.textSecondary }]}>
                  {format(item.answer.createdAt)}
                </Text>
              </View>
              <Text style={[styles.answerText, { color: colors.text }]}>{item.answer.message}</Text>
            </View>
          ) : (
            <>
              <View style={[styles.pendingCard, { backgroundColor: colors.warning + "10" }]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.warning} />
                <Text style={[styles.pendingText, { color: colors.warning }]}>
                  Awaiting a reply from a pharmacist.
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Answer as pharmacist</Text>
              <TextInput
                value={pharmacistName}
                onChangeText={setPharmacistName}
                placeholder="Your name, e.g. Ama Boateng, PharmD"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                value={answerMessage}
                onChangeText={setAnswerMessage}
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
              <SubmitButton label="Send Reply" onPress={handleSubmitAnswer} icon="send-outline" />
            </>
          )}

          <View style={{ marginTop: 16 }}>
            <EmergencyBanner variant="inline" />
          </View>

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
  content: { padding: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: "700" },
  timeAgo: { fontSize: 12 },
  medication: { fontSize: 12, marginTop: 8 },
  questionCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },
  questionText: { fontSize: 14, lineHeight: 20 },
  answerCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginTop: 12 },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  answerAuthor: { fontSize: 13, fontWeight: "700", flex: 1 },
  answerTime: { fontSize: 11 },
  answerText: { fontSize: 14, lineHeight: 20 },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  pendingText: { fontSize: 13, fontWeight: "600" },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 10,
  },
  textArea: { minHeight: 80 },
});
