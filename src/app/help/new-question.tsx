import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
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
    if (isUrgentCategory) return; 
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        
        {/* Navigation Top Header Bar */}
        <ScreenHeader title="Ask a Question" />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          
          {/* Main Category Selection Chips */}
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>What's this about?</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {CATEGORIES.map((option) => {
              const active = category === option;
              const urgent = URGENT_PHARMACIST_CATEGORIES.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  className="px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: active
                      ? urgent
                        ? colors.error
                        : colors.primary
                      : colors.backgroundElement,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Conditional Layout Content Based On Urgency Flag */}
          {isUrgentCategory ? (
            <View className="mt-4">
              <EmergencyBanner variant="full" />
            </View>
          ) : (
            <>
              {/* Optional Medication Name Input */}
              <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
                Medication name (optional)
              </Text>
              <TextInput
                value={medicationName}
                onChangeText={setMedicationName}
                placeholder="e.g. Amoxicillin"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
              />

              {/* Required Core Question Query Field */}
              <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
                Your question <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Describe what you'd like to know..."
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[110px]"
                style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                multiline
                textAlignVertical="top"
              />

              {/* Inline Safeguard Banner */}
              <View className="mt-4">
                <EmergencyBanner variant="inline" />
              </View>

              {/* Submission Control Trigger Component */}
              <SubmitButton
                label="Submit Question"
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{ marginTop: 16 }}
              />
            </>
          )}

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
