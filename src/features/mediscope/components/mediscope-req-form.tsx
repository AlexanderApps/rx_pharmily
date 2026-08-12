import React, { useState } from "react";
import {
  View,
  Text,
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
import SubmitButton from "@/shared/components/submit-button";
import FormSectionContainer from "@/shared/components/forms/form-section-container";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import CommentInput from "@/shared/components/comment-input";
import DatePicker from "@/shared/components/date-picker";
import ProductComboBox from "@/shared/components/product-combobox";
import MediscopeImageInput from "@/features/mediscope/components/mediscope-image-input";
import MediscopeVisibilitySection from "@/features/mediscope/components/mediscope-visibility-section";
import {
  MediscopeFormData,
  MediscopeStatus,
} from "@/features/mediscope/types/mediscope.types";

const INITIAL_FORM_STATE: MediscopeFormData = {
  facility: "",
  product: "",
  isCustomProduct: true,
  comment: "",
  imageUrl: undefined,
  status: "draft",
  isActive: true,
  visibilityScope: "All",
  visibilityRules: [],
  submissionDeadline: undefined,
};

interface MediscopeRequestFormProps {
  onSubmit?: (data: MediscopeFormData) => void | Promise<void>;
  initialData?: Partial<MediscopeFormData>;
  isLoading?: boolean;
  isEdit?: boolean;
}

const MediscopeRequestForm: React.FC<MediscopeRequestFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  isEdit = false,
}) => {
  const { colors } = useTheme();

  const [formData, setFormData] = useState<MediscopeFormData>({
    ...INITIAL_FORM_STATE,
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MediscopeFormData, string>>>({});
  const [hasDeadline, setHasDeadline] = useState(!!initialData?.submissionDeadline);

  const updateField = <K extends keyof MediscopeFormData>(
    field: K,
    value: MediscopeFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.facility.trim()) newErrors.facility = "Facility is required";
    if (!formData.product.trim()) newErrors.product = "Tell us what product you're looking for";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Missing information", "Please fill in all required fields");
      return;
    }
    await onSubmit?.(formData);
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
              {isEdit ? "Edit MediScope Request" : "New MediScope Request"}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Ask the network if anyone has it
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FormSectionContainer title="Facility" required>
            <MyFacilityPicker
              value={formData.facility}
              onChange={(value) => updateField("facility", value)}
              error={errors.facility}
            />
          </FormSectionContainer>

          <FormSectionContainer
            title="What are you looking for?"
            required
            subtitle="A single product — no need to build a full item list"
          >
            <ProductComboBox
              value={formData.product}
              isCustomProduct={formData.isCustomProduct}
              onChange={(value, isCustomProduct) => {
                setFormData((prev) => ({ ...prev, product: value, isCustomProduct }));
                if (errors.product) setErrors((prev) => ({ ...prev, product: undefined }));
              }}
              placeholder="e.g. Enoxaparin 40mg Injection"
              error={errors.product}
            />
          </FormSectionContainer>

          <FormSectionContainer title="Photo" subtitle="Attach a photo if it helps identify the product">
            <MediscopeImageInput
              imageUrl={formData.imageUrl}
              onChange={(uri) => updateField("imageUrl", uri)}
            />
          </FormSectionContainer>

          <FormSectionContainer title="Comment">
            <CommentInput
              value={formData.comment ?? ""}
              onChange={(value) => updateField("comment", value)}
              placeholder="Any extra detail — urgency, quantity, pack size..."
            />
          </FormSectionContainer>

          <FormSectionContainer title="Deadline" subtitle="Optional — close the request automatically after this date">
            <Pressable
              onPress={() => {
                if (hasDeadline) {
                  setHasDeadline(false);
                  updateField("submissionDeadline", undefined);
                } else {
                  setHasDeadline(true);
                  updateField("submissionDeadline", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                }
              }}
              style={styles.deadlineToggleRow}
            >
              <MaterialCommunityIcons
                name={hasDeadline ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={hasDeadline ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.deadlineToggleText, { color: colors.text }]}>
                Set a deadline
              </Text>
            </Pressable>
            {hasDeadline && (
              <View style={{ marginTop: 8 }}>
                <DatePicker
                  value={formData.submissionDeadline || new Date()}
                  onChange={(date) => updateField("submissionDeadline", date)}
                  format="long"
                />
              </View>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Visibility">
            <MediscopeVisibilitySection
              scope={formData.visibilityScope}
              rules={formData.visibilityRules}
              onScopeChange={(scope) => updateField("visibilityScope", scope)}
              onRulesChange={(rules) => updateField("visibilityRules", rules)}
            />
          </FormSectionContainer>

          <FormSectionContainer title="Status">
            <View style={styles.chipRow}>
              {(["draft", "published"] as MediscopeStatus[]).map((status) => {
                const active = formData.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => updateField("status", status)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.primary : colors.backgroundElement },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {status === "draft" ? "Save as Draft" : "Publish Now"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FormSectionContainer>

          <SubmitButton
            label={isEdit ? "Save Changes" : "Create Request"}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
          />

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  errorText: { fontSize: 12, fontWeight: "500", marginTop: 4 },
  deadlineToggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deadlineToggleText: { fontSize: 13, fontWeight: "500" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});

export default MediscopeRequestForm;
