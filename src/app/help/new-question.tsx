import React, { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import {
  PharmacistQuestionCategory,
  URGENT_PHARMACIST_CATEGORIES,
} from "@/features/help/types/help.types";
import EmergencyBanner from "@/features/help/components/emergency-banner";
import { toast } from "@/shared/hooks/use-toast";
import SubmitButton from "@/shared/components/submit-button";

const CATEGORIES: PharmacistQuestionCategory[] = [
  "Drug Interaction",
  "Dosage & Administration",
  "Side Effects",
  "Overdose / Emergency",
  "General",
];

export default function NewQuestionScreen() {
  const { colors } = useTheme();
  const addQuestion = useHelpStore((state) => state.addQuestion);

  const [category, setCategory] = useState<PharmacistQuestionCategory>("General");
  const [medicationName, setMedicationName] = useState("");
  const [question, setQuestion] = useState("");

  const isUrgentCategory = URGENT_PHARMACIST_CATEGORIES.includes(category);
  const canSubmit = question.trim().length > 0 && !isUrgentCategory;

  const handleSubmit = async () => {
    if (isUrgentCategory) return; // safety net — submission is disabled for this category anyway
    if (!question.trim()) {
      Alert.alert("Add your question", "Please describe what you'd like to ask.");
      return;
    }
    const id = await addQuestion({
      category,
      medicationName: medicationName.trim() || undefined,
      question: question.trim(),
    });
    if (!id) {
      toast.error("Couldn't submit your question. Please try again.");
      return;
    }
    toast.success("Question submitted.");
    router.replace({ pathname: "/help/question-details", params: { id } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Ask a Question</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.text }]}>What's this about?</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((option) => {
              const active = category === option;
              const urgent = URGENT_PHARMACIST_CATEGORIES.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? urgent
                          ? colors.error
                          : colors.primary
                        : colors.backgroundElement,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isUrgentCategory ? (
            <View style={{ marginTop: 16 }}>
              <EmergencyBanner variant="full" />
            </View>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                Medication name (optional)
              </Text>
              <TextInput
                value={medicationName}
                onChangeText={setMedicationName}
                placeholder="e.g. Amoxicillin"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                Your question <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Describe what you'd like to know..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
                multiline
                textAlignVertical="top"
              />

              <View style={{ marginTop: 16 }}>
                <EmergencyBanner variant="inline" />
              </View>

              <SubmitButton
                label="Submit Question"
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{ marginTop: 16 }}
              />
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
  content: { padding: 16 },
  label: { fontSize: 12, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 110 },
});
