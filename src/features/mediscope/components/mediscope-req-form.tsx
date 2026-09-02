import React, { useState } from "react";
import {
  View,
  Text,
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
import SubmitButton from "@/shared/components/submit-button";
import FormSectionContainer from "@/shared/components/forms/form-section-container";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import CommentInput from "@/shared/components/comment-input";
import DatePicker from "@/shared/components/date-picker";
import ProductComboBox from "@/shared/components/product-combobox";
import MediscopeImageInput from "@/features/mediscope/components/mediscope-image-input";
import { VisibilityManager } from "@/shared/components/visibility/visibility-manager";
import { VisibilityRule } from "@/shared/types/shared.types";
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

  // Same shape as features/rxrfqs/hooks/use-add-rxrfq-req.ts's
  // addVisibilityRule/removeVisibilityRule, adapted to this form's
  // inline updateField pattern rather than a separate form-state hook.
  const addVisibilityRule = (rule: VisibilityRule) => {
    updateField("visibilityRules", [...formData.visibilityRules, rule]);
  };

  const removeVisibilityRule = (index: number) => {
    updateField(
      "visibilityRules",
      formData.visibilityRules.filter((_, idx) => idx !== index),
    );
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ backgroundColor: colors.background, borderBottomColor: colors.border }}
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
              {isEdit ? "Edit MediScope Request" : "New MediScope Request"}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Ask the network if anyone has it
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
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
              className="flex-row items-center gap-2"
            >
              <MaterialCommunityIcons
                name={hasDeadline ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={hasDeadline ? colors.primary : colors.textSecondary}
              />
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                Set a deadline
              </Text>
            </Pressable>
            {hasDeadline && (
              <View className="mt-2">
                <DatePicker
                  value={formData.submissionDeadline || new Date()}
                  onChange={(date) => updateField("submissionDeadline", date)}
                  format="long"
                />
              </View>
            )}
          </FormSectionContainer>

          <FormSectionContainer title="Visibility">
            <VisibilityManager
              scope={formData.visibilityScope}
              rules={formData.visibilityRules}
              onScopeChange={(scope) => updateField("visibilityScope", scope)}
              onAddRule={addVisibilityRule}
              onRemoveRule={removeVisibilityRule}
            />
          </FormSectionContainer>

          <FormSectionContainer title="Status">
            <View className="flex-row flex-wrap gap-2">
              {(["draft", "published"] as MediscopeStatus[]).map((status) => {
                const active = formData.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => updateField("status", status)}
                    className="px-3.5 py-[9px] rounded-full"
                    style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: active ? "#fff" : colors.textSecondary }}
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
            style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 16 }}
          />

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MediscopeRequestForm;

