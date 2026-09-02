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
import { ConsultCategory, ConsultFormat } from "@/features/help/types/help.types";
import { toast } from "@/shared/hooks/use-toast";
import SubmitButton from "@/shared/components/submit-button";

const CATEGORIES: ConsultCategory[] = [
  "New Facility Setup",
  "Procurement Trends",
  "Career Pivoting",
  "Regulatory Advice",
  "Other",
];

const FORMATS: { value: ConsultFormat; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: "chat", label: "Chat", icon: "chat-outline" },
  { value: "call", label: "Call", icon: "phone-outline" },
  { value: "in_person", label: "In Person", icon: "account-group-outline" },
];

export default function NewConsultScreen() {
  const { colors } = useTheme();
  const addConsultRequest = useHelpStore((state) => state.addConsultRequest);

  const [category, setCategory] = useState<ConsultCategory>("New Facility Setup");
  const [format, setFormat] = useState<ConsultFormat>("chat");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Missing information", "Please add a subject and some detail.");
      return;
    }
    const id = await addConsultRequest({
      category,
      subject: subject.trim(),
      description: description.trim(),
      preferredFormat: format,
    });
    if (!id) {
      toast.error("Couldn't submit your request. Please try again.");
      return;
    }
    toast.success("Consult request submitted.");
    router.replace({ pathname: "/help/consult-details", params: { id } });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        
        {/* Navigation Top Header Bar */}
        <ScreenHeader title="New Consult Request" />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          
          {/* Topic Select Chips Layout */}
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>Topic</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {CATEGORIES.map((option) => {
              const active = category === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                >
                  <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Subject Field Title Row */}
          <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
            Subject <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="A short title for your request"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          {/* Message Area Details Frame */}
          <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
            Details <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What would you like advice on?"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[110px]"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
            multiline
            textAlignVertical="top"
          />

          {/* Delivery Configuration Layout Actions */}
          <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>Preferred format</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {FORMATS.map((option) => {
              const active = format === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setFormat(option.value)}
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

          {/* Action Trigger Buttons */}
          <SubmitButton
            label="Submit Request"
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
