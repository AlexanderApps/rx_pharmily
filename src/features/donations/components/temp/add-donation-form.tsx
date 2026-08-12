import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
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
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
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
  donatedItems: [],
};

const AddDonationForm: React.FC<{
  onSubmit?: (data: DonationFormData) => void;
  initialData?: Partial<DonationFormData>;
  isLoading?: boolean;
}> = ({ onSubmit, initialData, isLoading = false }) => {
  const navigation = useNavigation();
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

  // Intercept native navigation actions
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Allow exit if no changes exist or if the form is currently submitting
      if (!hasUnsavedChanges || isSubmitting) {
        return;
      }

      e.preventDefault();

      (async () => {
        const ok = await confirm({
          title: "Discard changes?",
          message: "You have unsaved changes. Are you sure you want to leave?",
          confirmLabel: "Discard",
          cancelLabel: "Stay Here",
          destructive: true,
        });
        if (ok) navigation.dispatch(e.data.action);
      })();
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, isSubmitting]);

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Enhanced Header Section with Back Navigation */}
        <ThemedView
          style={[
            styles.headerContainer,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: colors.backgroundElement },
            ]}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <ThemedView style={styles.headerTextContainer}>
            <ThemedText
              style={[styles.headerTitle, { color: colors.text }]}
            >
              Add Donation
            </ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Create a new contribution entry
            </ThemedText>
          </ThemedView>

          {/* Visual Anchor Balance Block */}
          <View style={{ width: 40 }} />
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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

          {/* Status & Active Section */}
          <DonationFormSection title="Status & Visibility">
            <View style={styles.statusStack}>
              {/* Dropdown takes full row width */}
              <StatusDropdown
                value={formData.status}
                onChange={(value) => updateField("status", value)}
                label="Donation Status"
              />

              {/* Checkbox takes full row width beneath it */}
              <View style={styles.checkboxWrapper}>
                <ActiveCheckbox
                  value={formData.isActive}
                  onChange={(value) => updateField("isActive", value)}
                  label="Active"
                />
              </View>
            </View>
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
          <View style={styles.buttonContainer}>
            <FormButton
              title="Reset"
              onPress={handleReset}
              variant="secondary"
              style={styles.resetButton}
              disabled={isLoading || isSubmitting}
            />
            <FormButton
              title="Submit Donation"
              onPress={handleSubmit}
              variant="primary"
              style={styles.submitButton}
              isLoading={isLoading || isSubmitting}
            />
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
  },
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
  headerTextContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerContent: {
    gap: 8,
  },
  headerLine: {
    height: 3,
    borderRadius: 1.5,
    width: 40,
  },
  statusStack: {
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  // Added layout alignment adjustments specifically for the active toggle container
  checkboxWrapper: {
    marginTop: 6, // Pushes checkbox down slightly to account for the dropdown's top label space
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  resetButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1.2,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AddDonationForm;
