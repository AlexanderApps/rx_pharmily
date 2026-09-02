import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import FormSectionContainer from "@/shared/components/forms/form-section-container";
import DatePicker from "@/shared/components/date-picker";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import {
  JobFormData,
  JobType,
  JobUrgency,
} from "@/features/rxjobs/types/rxjobs.types";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import MultiSelectPicker from "@/shared/components/forms/multi-select-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

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
  categories: [],
  facilityId: undefined,
  organizationId: undefined,
  isCustom: true,
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
  const user = useProfileStore((state) => state.user);
  const organizations = useProfileStore((state) => state.organizations);
  const facilities = useProfileStore((state) => state.facilities);
  const jobCategories = useReferenceDataStore((state) => state.jobCategories);

  // Same scoping spirit as MyFacilityPicker's getMyFacilities() — only
  // organizations this user actually administers, not every
  // organization in the system. Doesn't yet cover a staff member with
  // posting rights but no adminUserId match; a reasonable starting
  // scope given how this app's organization membership model exists
  // today.
  const myOrganizationOptions = useMemo(
    () =>
      organizations.filter((o) => o.adminUserId === user?.id).map((o) => ({ id: o.id, label: o.name })),
    [organizations, user?.id],
  );
  const jobCategoryOptions = useMemo(
    () => jobCategories.map((c) => ({ id: c.name, label: c.name })),
    [jobCategories],
  );

  const existing = useMemo(
    () => (id ? jobs.find((j) => j.id === id) : undefined),
    [id, jobs],
  );

  const [formData, setFormData] = useState<JobFormData>(
    existing
      ? {
          title: existing.title,
          companyName: existing.isCustom ? existing.companyName : "",
          companyLogo: existing.companyLogo,
          location: existing.location,
          jobType: existing.jobType,
          salaryRange: existing.salaryRange,
          requirements: existing.requirements,
          description: existing.description,
          urgency: existing.urgency,
          applicationDeadline: existing.applicationDeadline,
          categories: existing.categories,
          facilityId: existing.facilityId,
          organizationId: existing.organizationId,
          isCustom: existing.isCustom,
        }
      : INITIAL_FORM_STATE,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>(
    {},
  );
  const [newRequirement, setNewRequirement] = useState("");
  const [companyMode, setCompanyMode] = useState<"facility" | "organization" | "custom">(
    existing ? (existing.isCustom ? "custom" : existing.facilityId ? "facility" : "organization") : "custom",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof JobFormData>(
    field: K,
    value: JobFormData[K],
  ) => {
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
    if (formData.isCustom) {
      if (!formData.companyName?.trim()) newErrors.companyName = "Company is required";
    } else if (!formData.facilityId && !formData.organizationId) {
      newErrors.companyName = "Select a facility or organization";
    }
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.salaryRange.trim())
      newErrors.salaryRange = "Salary range is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
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
    if (isSubmitting) return;
    // initialsFromCompany needs a display name regardless of which
    // company mode is active — formData.companyName is only meaningful
    // when isCustom; otherwise derive from whichever entity is linked.
    const companyDisplayName = formData.isCustom
      ? formData.companyName ?? ""
      : formData.facilityId
        ? facilities.find((f) => f.id === formData.facilityId)?.name ?? ""
        : organizations.find((o) => o.id === formData.organizationId)?.name ?? "";
    const dataToSave: JobFormData = {
      ...formData,
      companyLogo: formData.companyLogo || initialsFromCompany(companyDisplayName),
    };
    setIsSubmitting(true);
    if (existing) {
      const success = await updateJob(existing.id, dataToSave);
      setIsSubmitting(false);
      if (!success) {
        toast.error("Couldn't save changes. Try again.");
        return;
      }
      toast.success("Job updated.");
      router.back();
    } else {
      const newId = await addJob(dataToSave);
      setIsSubmitting(false);
      if (!newId) {
        toast.error("Couldn't post the job. Try again.");
        return;
      }
      toast.success("Job posted.");
      router.replace({ pathname: "/jobs/job-details", params: { id: newId } });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          }}
        >
          {Platform.OS !== "web" && (
          <Pressable
            onPress={() => router.back()}
            className="p-2 rounded-lg w-10 h-10 items-center justify-center"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          )}
          <View className="items-center flex-1">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {existing ? "Edit Job" : "Post a Job"}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              {existing ? "Update this listing" : "Reach pharmacy professionals"}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerClassName="py-4 px-4"
          keyboardShouldPersistTaps="handled"
        >
          <FormSectionContainer title="Role" required>
            <TextInput
              value={formData.title}
              onChangeText={(v) => updateField("title", v)}
              placeholder="e.g. Locum Pharmacist — Weekend Cover"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-3 text-[15px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: errors.title ? colors.error : colors.border,
                color: colors.text,
              }}
            />
            {errors.title && (
              <Text className="text-xs font-medium mt-1" style={{ color: colors.error }}>
                {errors.title}
              </Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Company" required>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {(
                [
                  { key: "facility", label: "My Facility" },
                  { key: "organization", label: "My Organization" },
                  { key: "custom", label: "Other / Unregistered" },
                ] as const
              ).map((mode) => {
                const isActive = companyMode === mode.key;
                return (
                  <Pressable
                    key={mode.key}
                    onPress={() => {
                      setCompanyMode(mode.key);
                      setFormData((prev) => ({
                        ...prev,
                        isCustom: mode.key === "custom",
                        facilityId: mode.key === "facility" ? prev.facilityId : undefined,
                        organizationId: mode.key === "organization" ? prev.organizationId : undefined,
                        companyName: mode.key === "custom" ? prev.companyName : undefined,
                      }));
                      if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: undefined }));
                    }}
                    className="px-3 py-2 rounded-full"
                    style={{ backgroundColor: isActive ? colors.primary : colors.backgroundElement }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: isActive ? "#fff" : colors.textSecondary }}
                    >
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {companyMode === "custom" && (
              <TextInput
                value={formData.companyName ?? ""}
                onChangeText={(v) => updateField("companyName", v)}
                placeholder="Company or facility name"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-3 text-[15px]"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.companyName ? colors.error : colors.border,
                  color: colors.text,
                }}
              />
            )}
            {companyMode === "facility" && (
              <MyFacilityPicker
                value={formData.facilityId ?? ""}
                onChange={(facilityId) => updateField("facilityId", facilityId)}
                placeholder="Select your facility"
                error={errors.companyName}
              />
            )}
            {companyMode === "organization" && (
              <ReferencePicker
                title="Select Organization"
                options={myOrganizationOptions}
                value={formData.organizationId ?? ""}
                onChange={(organizationId) => updateField("organizationId", organizationId)}
                placeholder="Select your organization"
                emptyMessage="You don't administer any organization yet."
                error={errors.companyName}
              />
            )}
            {errors.companyName && (
              <Text className="text-xs font-medium mt-1" style={{ color: colors.error }}>
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
              className="border rounded-lg px-3 py-3 text-[15px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: errors.location ? colors.error : colors.border,
                color: colors.text,
              }}
            />
            {errors.location && (
              <Text className="text-xs font-medium mt-1" style={{ color: colors.error }}>
                {errors.location}
              </Text>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Job Type" required>
            <View className="flex-row flex-wrap gap-2">
              {JOB_TYPES.map((type) => {
                const active = formData.jobType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => updateField("jobType", type)}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: active
                        ? colors.primary
                        : colors.backgroundElement,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: active ? "#fff" : colors.textSecondary }}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSectionContainer>

          <FormSectionContainer title="Urgency" required>
            <View className="flex-row flex-wrap gap-2">
              {(["Immediate", "Standard"] as JobUrgency[]).map((urgency) => {
                const active = formData.urgency === urgency;
                return (
                  <Pressable
                    key={urgency}
                    onPress={() => updateField("urgency", urgency)}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: active
                        ? colors.error
                        : colors.backgroundElement,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: active ? "#fff" : colors.textSecondary }}
                    >
                      {urgency}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSectionContainer>

          <FormSectionContainer
            title="Categories"
            subtitle="Helps job seekers filter to a direct match"
          >
            <MultiSelectPicker
              title="Select Categories"
              options={jobCategoryOptions}
              value={formData.categories}
              onChange={(categories) => updateField("categories", categories)}
              placeholder="Select categories"
              emptyMessage="No categories set up yet."
              searchable={false}
            />
          </FormSectionContainer>

          <FormSectionContainer title="Salary Range" required>
            <TextInput
              value={formData.salaryRange}
              onChangeText={(v) => updateField("salaryRange", v)}
              placeholder="e.g. GHS 6,500 - 8,000 / month"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-3 text-[15px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: errors.salaryRange ? colors.error : colors.border,
                color: colors.text,
              }}
            />
            {errors.salaryRange && (
              <Text className="text-xs font-medium mt-1" style={{ color: colors.error }}>
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
                className="flex-row items-center justify-between gap-2 border rounded-lg px-3 py-2.5 mb-2"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                }}
              >
                <Text
                  className="text-[13px] flex-1"
                  style={{ color: colors.text }}
                  numberOfLines={2}
                >
                  {req}
                </Text>
                <Pressable onPress={() => removeRequirement(index)} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            ))}
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={newRequirement}
                onChangeText={setNewRequirement}
                placeholder="Add a requirement..."
                placeholderTextColor={colors.textSecondary}
                className="flex-1 border rounded-lg px-3 py-3 text-[15px]"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                onSubmitEditing={addRequirement}
                returnKeyType="done"
              />
              <Pressable
                onPress={addRequirement}
                className="w-11 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.text }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={colors.backgroundSecondary}
                />
              </Pressable>
            </View>
            {errors.requirements && (
              <Text className="text-xs font-medium mt-1" style={{ color: colors.error }}>
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
              className="border rounded-lg px-3 py-3 text-[15px] min-h-[110px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: errors.description ? colors.error : colors.border,
                color: colors.text,
                textAlignVertical: "top",
              }}
              multiline
            />
            {errors.description && (
              <Text className="text-xs font-medium mt-1" style={{ color: colors.error }}>
                {errors.description}
              </Text>
            )}
          </FormSectionContainer>

          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-[10px] py-3.5 mt-4"
            style={{ backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
            <Text className="text-white text-base font-semibold">
              {isSubmitting
                ? existing
                  ? "Saving..."
                  : "Posting..."
                : existing
                  ? "Save Changes"
                  : "Post Job"}
            </Text>
          </Pressable>

          <View className="h-6" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}