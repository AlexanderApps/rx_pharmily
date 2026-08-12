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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>New Consult Request</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.text }]}>Topic</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((option) => {
              const active = category === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  style={[styles.chip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
                >
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
            Subject <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="A short title for your request"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
            Details <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What would you like advice on?"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Preferred format</Text>
          <View style={styles.chipRow}>
            {FORMATS.map((option) => {
              const active = format === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setFormat(option.value)}
                  style={[styles.chip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SubmitButton
            label="Submit Request"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{ marginTop: 20 }}
          />

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
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
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
