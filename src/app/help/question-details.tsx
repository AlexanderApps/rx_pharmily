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
import EmergencyBanner from "@/features/help/components/emergency-banner";
import { toast } from "@/shared/hooks/use-toast";
import SubmitButton from "@/shared/components/submit-button";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";

export default function QuestionDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Same restriction as consult-details.tsx — matches pharmacist_answers'
  // own insert policy (is_admin(), covering admin and superadmin), and
  // for the same reason: without this the question's own asker would see
  // an "Answer as pharmacist" form they can't actually use.
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

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
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>No question found for id: {id}</Text>
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        
        {/* Navigation Header Element */}
        <ScreenHeader title="Question" />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          
          {/* Metadata Filter Row */}
          <View className="flex-row items-center justify-between">
            <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: colors.secondary + "18" }}>
              <Text className="text-[11px] font-bold" style={{ color: colors.secondary }}>{item.category}</Text>
            </View>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>{format(item.createdAt)}</Text>
          </View>

          {item.medicationName && (
            <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              Regarding: {item.medicationName}
            </Text>
          )}

          {/* User Question Card */}
          <View className="rounded-[14px] border p-3.5 mt-3" style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}>
            <Text className="text-sm leading-5" style={{ color: colors.text }}>{item.question}</Text>
          </View>

          {/* Core Response Section */}
          {item.answer ? (
            <View className="rounded-[14px] border p-3.5 gap-2 mt-3" style={{ backgroundColor: colors.success + "10", borderColor: colors.success + "40" }}>
              <View className="flex-row items-center gap-1.5">
                <MaterialCommunityIcons name="account-check-outline" size={16} color={colors.success} />
                <Text className="text-sm font-bold flex-1" style={{ color: colors.success }}>{item.answer.pharmacistName}</Text>
                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                  {format(item.answer.createdAt)}
                </Text>
              </View>
              <Text className="text-sm leading-5" style={{ color: colors.text }}>{item.answer.message}</Text>
            </View>
          ) : (
            <>
              {/* Pending Awaiting Feedback State */}
              <View className="flex-row items-center gap-2 rounded-xl p-3.5 mt-3" style={{ backgroundColor: colors.warning + "10" }}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.warning} />
                <Text className="text-[13px] font-semibold" style={{ color: colors.warning }}>
                  Awaiting a reply from a pharmacist.
                </Text>
              </View>

              {/* Form Input Reply Area */}
              {isAdmin && (
                <>
                  <Text className="text-sm font-bold mt-4 mb-2" style={{ color: colors.text }}>Answer as pharmacist</Text>
                  <TextInput
                    value={pharmacistName}
                    onChangeText={setPharmacistName}
                    placeholder="Your name, e.g. Ama Boateng, PharmD"
                    placeholderTextColor={colors.textSecondary}
                    className="border rounded-lg px-3 py-2.5 text-sm mb-2.5"
                    style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                  />
                  <TextInput
                    value={answerMessage}
                    onChangeText={setAnswerMessage}
                    placeholder="Write your reply..."
                    placeholderTextColor={colors.textSecondary}
                    className="border rounded-lg px-3 py-2.5 text-sm mb-2.5 min-h-[80px]"
                    style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                    multiline
                    textAlignVertical="top"
                  />
                  <SubmitButton label="Send Reply" onPress={handleSubmitAnswer} icon="send-outline" />
                </>
              )}
            </>
          )}

          {/* Emergency Safety Alert Component */}
          <View className="mt-4">
            <EmergencyBanner variant="inline" />
          </View>

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
