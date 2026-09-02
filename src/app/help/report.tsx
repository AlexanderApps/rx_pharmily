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
import { ReportType } from "@/features/help/types/help.types";
import { toast } from "@/shared/hooks/use-toast";
import SubmitButton from "@/shared/components/submit-button";

const REPORT_TYPES: { value: ReportType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: "bug", label: "App Bug", icon: "bug-outline" },
  { value: "user", label: "A User", icon: "account-alert-outline" },
  { value: "content", label: "Content", icon: "flag-outline" },
  { value: "other", label: "Other", icon: "dots-horizontal" },
];

export default function ReportScreen() {
  const { colors } = useTheme();
  const addReport = useHelpStore((state) => state.addReport);

  const [type, setType] = useState<ReportType>("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reportedUser, setReportedUser] = useState("");

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Missing information", "Please add a subject and a description.");
      return;
    }
    const ok = await addReport({
      type,
      subject: subject.trim(),
      description: description.trim(),
      reportedUser: type === "user" ? reportedUser.trim() || undefined : undefined,
    });
    if (ok) {
      toast.success("Report submitted — our team will take a look.");
      router.back();
    } else {
      toast.error("Couldn't submit your report. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        
        {/* Navigation Header Element */}
        <ScreenHeader title="Report" />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          
          {/* Main Category Selection Chips */}
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>What are you reporting?</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {REPORT_TYPES.map((option) => {
              const active = type === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setType(option.value)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Conditional User Target Reporting Input */}
          {type === "user" && (
            <>
              <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
                Who are you reporting?
              </Text>
              <TextInput
                value={reportedUser}
                onChangeText={setReportedUser}
                placeholder="Name or facility"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
              />
            </>
          )}

          {/* Required Subject Context Field */}
          <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
            Subject <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Briefly summarize the issue"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          {/* Multi-line Description Field */}
          <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
            Description <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What happened? Steps to reproduce, if it's a bug."
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[110px]"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
            multiline
            textAlignVertical="top"
          />

          {/* Core Submission Trigger Button */}
          <SubmitButton
            label="Submit Report"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{ marginTop: 20 }}
          />

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
