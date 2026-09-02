import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TermsOfServiceInput from "@/shared/components/tos-input";
import CommentInput from "@/shared/components/comment-input";
import ActiveCheckbox from "@/features/donations/components/temp/active-checkbox";
import DonatedItemsTable from "@/features/donations/components/temp/donated-items-table";
import { ThemedText } from "@/shared/components/themed-text";
import DonationFormSection from "./donation-form-section";
import { ThemedView } from "@/shared/components/themed-view";
import FormButton from "./form-button";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import CategoriesMultiSelect from "./categories-multiselect";
import StatusDropdown from "./status-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { useUnsavedChangesGuard } from "@/shared/hooks/use-unsaved-changes-guard";
import { VisibilityManager } from "@/shared/components/visibility/visibility-manager";
import { VisibilityRule } from "@/shared/types/shared.types";
import {
  DonationFormData,
  DonationItem,
} from "@/features/donations/types/donation.types";

const INITIAL_FORM_STATE: DonationFormData = {
  facility: "",
  categories: [],
  termsOfService: "",
  comment: "",
  isActive: true,
  status: "opened",
  visibilityScope: "All",
  visibilityRules: [],
  donatedItems: [],
};

const AddDonationForm: React.FC<{
  onSubmit?: (data: DonationFormData) => void;
  initialData?: Partial<DonationFormData>;
  isLoading?: boolean;
}> = ({ onSubmit, initialData, isLoading = false }) => {
  const { colors } = useTheme();

  // 1. Store the true initial baseline to accurately compare changes later
  const baselineData = useRef<DonationFormData>({
    ...INITIAL_FORM_STATE,
    ...initialData,
  });

  const [formData, setFormData] = useState<DonationFormData>(
    baselineData.current,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof DonationFormData, string>>
  >({});

  // 2. State flag to allow unhindered navigation upon successful submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Determine deep change status by stringifying data objects
  const hasUnsavedChanges =
    JSON.stringify(formData) !== JSON.stringify(baselineData.current);

  const { guardedBack } = useUnsavedChangesGuard({ hasUnsavedChanges: hasUnsavedChanges && !isSubmitting });

  // Update individual form fields
  const updateField = useCallback(
    <K extends keyof DonationFormData>(
      field: K,
      value: DonationFormData[K],
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors],
  );

  // Same shape as mediscope-req-form.tsx's own addVisibilityRule/
  // removeVisibilityRule, matching this file's useCallback convention.
  const addVisibilityRule = useCallback(
    (rule: VisibilityRule) => {
      setFormData((prev) => ({
        ...prev,
        visibilityRules: [...prev.visibilityRules, rule],
      }));
    },
    [],
  );

  const removeVisibilityRule = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      visibilityRules: prev.visibilityRules.filter((_, idx) => idx !== index),
    }));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.facility.trim()) {
      newErrors.facility = "Facility is required";
    }

    if (formData.categories.length === 0) {
      newErrors.categories = "At least one category is required";
    }

    if (formData.donatedItems.length === 0) {
      newErrors.donatedItems = "At least one donated item is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (onSubmit) {
      // 4. Temporarily flip the flag so navigation can proceed normally inside onSubmit
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        // Re-enable interceptor if submission encounters an error
        setIsSubmitting(false);
      }
    }
  }, [formData, onSubmit, validateForm]);

  // Handle item table changes
  const handleItemsChange = useCallback(
    (items: DonationItem[]) => {
      updateField("donatedItems", items);
    },
    [updateField],
  );

  // Reset form
  const handleReset = useCallback(async () => {
    const ok = await confirm({
      title: "Reset Form",
      message: "Are you sure you want to clear all data?",
      confirmLabel: "Reset",
      destructive: true,
    });
    if (!ok) return;
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Enhanced Header Section with Back Navigation */}
        <ThemedView
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          }}
        >
          {Platform.OS !== "web" && (
          <TouchableOpacity
            onPress={guardedBack}
            className="p-2 rounded-lg w-10 h-10 items-center justify-center"
            style={{ backgroundColor: colors.backgroundElement }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          )}

          <ThemedView className="items-center flex-1">
            <ThemedText
              className="text-lg font-bold"
              style={{ color: colors.text }}
            >
              Add Donation
            </ThemedText>
            <ThemedText
              className="text-xs mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              Create a new contribution entry
            </ThemedText>
          </ThemedView>

          {/* Visual Anchor Balance Block */}
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Facility Section */}
          <DonationFormSection title="Donation Details" required>
            <MyFacilityPicker
              value={formData.facility}
              onChange={(value) => updateField("facility", value)}
              error={errors.facility}
            />
          </DonationFormSection>

          {/* Categories Section */}
          <DonationFormSection title="Categories">
            <CategoriesMultiSelect
              selectedCategories={formData.categories}
              onChange={(categories) => updateField("categories", categories)}
              error={errors.categories}
            />
          </DonationFormSection>

          {/* Terms of Service Section */}
          <DonationFormSection title="Terms of Service">
            <TermsOfServiceInput
              value={formData.termsOfService}
              onChange={(value) => updateField("termsOfService", value)}
              placeholder="Enter terms of service (supports RTF, markdown support coming soon)..."
            />
          </DonationFormSection>

          {/* Comments Section */}
          <DonationFormSection title="Additional Comments">
            <CommentInput
              value={formData.comment}
              onChange={(value) => updateField("comment", value)}
              placeholder="Add any additional comments..."
            />
          </DonationFormSection>

          {/* Status Section */}
          <DonationFormSection title="Status">
            <View className="flex-col gap-4 w-full">
              {/* Dropdown takes full row width */}
              <StatusDropdown
                value={formData.status}
                onChange={(value) => updateField("status", value)}
                label="Donation Status"
              />

              {/* Checkbox takes full row width beneath it */}
              <View className="mt-1.5 w-full">
                <ActiveCheckbox
                  value={formData.isActive}
                  onChange={(value) => updateField("isActive", value)}
                  label="Active"
                />
              </View>
            </View>
          </DonationFormSection>

          {/* Marketplace Visibility Section */}
          <DonationFormSection title="Visibility">
            <VisibilityManager
              scope={formData.visibilityScope}
              rules={formData.visibilityRules}
              onScopeChange={(scope) => updateField("visibilityScope", scope)}
              onAddRule={addVisibilityRule}
              onRemoveRule={removeVisibilityRule}
            />
          </DonationFormSection>

          {/* Donated Items Section */}
          <DonationFormSection
            title="Donated Items"
            required
            subtitle="Add products being donated with quantities and expiry dates"
          >
            <DonatedItemsTable
              items={formData.donatedItems}
              onChange={handleItemsChange}
              error={errors.donatedItems}
            />
          </DonationFormSection>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-8 mb-4">
            <FormButton
              title="Reset"
              onPress={handleReset}
              variant="secondary"
              style={{ flex: 1 }}
              disabled={isLoading || isSubmitting}
            />
            <FormButton
              title="Submit Donation"
              onPress={handleSubmit}
              variant="primary"
              style={{ flex: 1.2 }}
              isLoading={isLoading || isSubmitting}
            />
          </View>

          {/* Bottom Spacing */}
          <View className="h-5" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddDonationForm;

