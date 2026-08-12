import React, { useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import FormSectionContainer from "@/shared/components/forms/form-section-container";
import DatePicker from "@/shared/components/date-picker";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import {
  JobFormData,
  JobType,
  JobUrgency,
} from "@/features/rxjobs/types/rxjobs.types";

const JOB_TYPES: JobType[] = [
  "Locum Shift",
  "Full-Time",
  "Part-Time",
  "MSL / Industrial",
  "Hospital Specialist",
];

const INITIAL_FORM_STATE: JobFormData = {
  title: "",
  companyName: "",
  companyLogo: "",
  location: "",
  jobType: "Full-Time",
  salaryRange: "",
  requirements: [],
  description: "",
  urgency: "Standard",
  applicationDeadline: undefined,
};

function initialsFromCompany(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PostJobScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const jobs = useRxJobsStore((state) => state.jobs);
  const addJob = useRxJobsStore((state) => state.addJob);
  const updateJob = useRxJobsStore((state) => state.updateJob);

  const existing = useMemo(
    () => (id ? jobs.find((j) => j.id === id) : undefined),
    [id, jobs],
  );

  const [formData, setFormData] = useState<JobFormData>(
    existing
      ? {
          title: existing.title,
          companyName: existing.companyName,
          companyLogo: existing.companyLogo,
          location: existing.location,
          jobType: existing.jobType,
          salaryRange: existing.salaryRange,
          requirements: existing.requirements,
          description: existing.description,
          urgency: existing.urgency,
          applicationDeadline: existing.applicationDeadline,
        }
      : INITIAL_FORM_STATE,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});
  const [newRequirement, setNewRequirement] = useState("");

  const updateField = <K extends keyof JobFormData>(field: K, value: JobFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed) return;
    updateField("requirements", [...formData.requirements, trimmed]);
    setNewRequirement("");
  };

  const removeRequirement = (index: number) => {
    updateField(
      "requirements",
      formData.requirements.filter((_, i) => i !== index),
    );
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.salaryRange.trim()) newErrors.salaryRange = "Salary range is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (formData.requirements.length === 0)
      newErrors.requirements = "Add at least one requirement";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Missing information", "Please fill in all required fields");
      return;
    }

    const dataToSave: JobFormData = {
      ...formData,
      companyLogo: formData.companyLogo || initialsFromCompany(formData.companyName),
    };

    if (existing) {
      await updateJob(existing.id, dataToSave);
      router.back();
    } else {
      const newId = await addJob(dataToSave);
      if (!newId) return;
      router.replace({ pathname: "/jobs/job-details", params: { id: newId } });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View
          style={[
            styles.headerContainer,
            { backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.backgroundElement }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {existing ? "Edit Job" : "Post a Job"}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {existing ? "Update this listing" : "Reach pharmacy professionals"}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FormSectionContainer title="Role" required>
            <TextInput
              value={formData.title}
              onChangeText={(v) => updateField("title", v)}
              placeholder="e.g. Locum Pharmacist — Weekend Cover"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.title ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
            />
            {errors.title && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Company" required>
            <TextInput
              value={formData.companyName}
              onChangeText={(v) => updateField("companyName", v)}
              placeholder="Company or facility name"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.companyName ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
            />
            {errors.companyName && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.companyName}
              </Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Location" required>
            <TextInput
              value={formData.location}
              onChangeText={(v) => updateField("location", v)}
              placeholder="e.g. Accra, Greater Accra"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.location ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
            />
            {errors.location && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.location}
              </Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Job Type" required>
            <View style={styles.chipRow}>
              {JOB_TYPES.map((type) => {
                const active = formData.jobType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => updateField("jobType", type)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.backgroundElement,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSectionContainer>

          <FormSectionContainer title="Urgency" required>
            <View style={styles.chipRow}>
              {(["Immediate", "Standard"] as JobUrgency[]).map((urgency) => {
                const active = formData.urgency === urgency;
                return (
                  <Pressable
                    key={urgency}
                    onPress={() => updateField("urgency", urgency)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active
                          ? colors.error
                          : colors.backgroundElement,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {urgency}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSectionContainer>

          <FormSectionContainer title="Salary Range" required>
            <TextInput
              value={formData.salaryRange}
              onChangeText={(v) => updateField("salaryRange", v)}
              placeholder="e.g. GHS 6,500 - 8,000 / month"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.salaryRange ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
            />
            {errors.salaryRange && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.salaryRange}
              </Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Application Deadline">
            <DatePicker
              value={formData.applicationDeadline || new Date()}
              onChange={(date) => updateField("applicationDeadline", date)}
              format="long"
            />
          </FormSectionContainer>

          <FormSectionContainer
            title="Requirements"
            required
            subtitle="What should applicants have?"
          >
            {formData.requirements.map((req, index) => (
              <View
                key={index}
                style={[
                  styles.reqItem,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.reqItemText, { color: colors.text }]} numberOfLines={2}>
                  {req}
                </Text>
                <Pressable onPress={() => removeRequirement(index)} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
            <View style={styles.addReqRow}>
              <TextInput
                value={newRequirement}
                onChangeText={setNewRequirement}
                placeholder="Add a requirement..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  styles.addReqInput,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
                onSubmitEditing={addRequirement}
                returnKeyType="done"
              />
              <Pressable
                onPress={addRequirement}
                style={[styles.addReqButton, { backgroundColor: colors.text }]}
              >
                <MaterialCommunityIcons name="plus" size={18} color={colors.backgroundSecondary} />
              </Pressable>
            </View>
            {errors.requirements && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.requirements}
              </Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Description" required>
            <TextInput
              value={formData.description}
              onChangeText={(v) => updateField("description", v)}
              placeholder="Describe the role, responsibilities, and what makes it a great opportunity..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.description ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              multiline
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.description}
              </Text>
            )}
          </FormSectionContainer>

          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {existing ? "Save Changes" : "Post Job"}
            </Text>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: { alignItems: "center", flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 110 },
  errorText: { fontSize: 12, fontWeight: "500", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  reqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  reqItemText: { fontSize: 13, flex: 1 },
  addReqRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  addReqInput: { flex: 1 },
  addReqButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
