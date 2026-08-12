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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Report</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.text }]}>What are you reporting?</Text>
          <View style={styles.chipRow}>
            {REPORT_TYPES.map((option) => {
              const active = type === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setType(option.value)}
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

          {type === "user" && (
            <>
              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                Who are you reporting?
              </Text>
              <TextInput
                value={reportedUser}
                onChangeText={setReportedUser}
                placeholder="Name or facility"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
            Subject <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Briefly summarize the issue"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
            Description <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What happened? Steps to reproduce, if it's a bug."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
            multiline
            textAlignVertical="top"
          />

          <SubmitButton
            label="Submit Report"
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
