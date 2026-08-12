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
import RxRfqItemsTable from "@/features/rxrfqs/components/rxrfq-items-table";
import { ThemedText } from "@/shared/components/themed-text";
import FormSectionContainer from "@/shared/components/forms/form-section-container";
import { ThemedView } from "@/shared/components/themed-view";
import FormButton from "@/shared/components/forms/form-button";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import CategoriesMultiSelect from "@/shared/components/forms/categories-multiselect";
import StatusDropdown from "@/features/rxrfqs/components/rxrfq-status-dropdown";
import { useTheme } from "@/shared/hooks/use-theme";
import DatePicker from "@/shared/components/date-picker";
import { RxRfqsFormData } from "@/features/rxrfqs/types/rxrfqs.types";
import useAddRxRfqRequest from "@/features/rxrfqs/hooks/use-add-rxrfq-req";
import { Ionicons } from "@expo/vector-icons";
import { RxRfqVisibilityManager } from "@/features/rxrfqs/components/rxrfq-visibility-manager";
import { IncotermsDropdown } from "@/shared/components/forms/incoterm-selector";
import ShelfLifeConfig from "./rxrfq-shelflife";

const RxRfqsRequestForm: React.FC<{
  onSubmit?: (data: RxRfqsFormData) => void;
  initialData?: Partial<RxRfqsFormData>;
  isLoading?: boolean;
}> = ({ onSubmit, initialData, isLoading = false }) => {
  const { colors } = useTheme();
  const {
    formData,
    errors,
    updateField,
    handleSubmit,
    handleReset,
    addVisibilityRule,
    removeVisibilityRule,
    isSubmitting,
  } = useAddRxRfqRequest(onSubmit, initialData, isLoading);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
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
          {/* 1. Left Action Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor:
                  colors.backgroundElement || "rgba(128,128,128,0.08)",
              },
            ]}
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back-sharp" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* 2. Centered Content Container */}
          <ThemedView style={styles.headerTextContainer}>
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
              Add RxRFQ Request
            </ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Create a new request for quote entry
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Facility Section */}
          <FormSectionContainer title="RxRFQ Request Details" required>
            <MyFacilityPicker
              value={formData.facilityId}
              onChange={(value) => updateField("facilityId", value)}
              error={errors.facilityId}
            />
          </FormSectionContainer>

          {/* Submission Deadline Section */}
          <FormSectionContainer title="Submission Deadline" required>
            <DatePicker
              value={formData.submissionDeadline}
              onChange={(date) => updateField("submissionDeadline", date)}
              format="long"
            />
          </FormSectionContainer>

          {/* Delivery Date Section */}
          <FormSectionContainer title="Delivery Date" required>
            <DatePicker
              value={formData.deliveryDate}
              onChange={(date) => updateField("deliveryDate", date)}
              format="long"
            />
          </FormSectionContainer>

          {/* Categories Section */}
          <FormSectionContainer title="Categories">
            <CategoriesMultiSelect
              selectedCategories={formData.categories}
              onChange={(categories) => updateField("categories", categories)}
              error={errors.categories}
            />
          </FormSectionContainer>

          {/* Incoterms Section */}
          <FormSectionContainer title="Delivery Incoterms">
            <IncotermsDropdown
              value={formData.incoterms}
              onChange={(incoterm) => updateField("incoterms", incoterm)}
              error={errors.incoterms}
            />
          </FormSectionContainer>

          {/* Shelflife Section */}
          <FormSectionContainer title="Shelf life">
            <ShelfLifeConfig
              value={{
                minShelfLifeMonths: formData.minShelfLifeMonths,
                strictMinShelfLife: formData.strictMinShelfLife,
              }}
              onChange={function (value) {
                updateField("minShelfLifeMonths", value.minShelfLifeMonths);
                updateField("strictMinShelfLife", value.strictMinShelfLife);
              }}
            />
          </FormSectionContainer>

          {/* Terms of Service Section */}
          <FormSectionContainer title="Terms of Service">
            <TermsOfServiceInput
              value={formData.termsOfService}
              onChange={(value) => updateField("termsOfService", value)}
              placeholder="Enter terms of service (supports RTF, markdown support coming soon)..."
            />
          </FormSectionContainer>

          {/* Comments Section */}
          <FormSectionContainer title="Additional Comments">
            <CommentInput
              value={formData.comment}
              onChange={(value) => updateField("comment", value)}
              placeholder="Add any additional comments..."
            />
          </FormSectionContainer>

          {/* Description Section */}
          <FormSectionContainer title="Description">
            <CommentInput
              value={formData.description}
              onChange={(value) => updateField("description", value)}
              placeholder="Description..."
            />
          </FormSectionContainer>

          {/* Status & Active Section */}
          <FormSectionContainer title="Visibility">
            <View style={styles.statusStack}>
              {/*<StatusDropdown
                value={formData.status}
                onChange={(value) => updateField("status", value)}
                label="RFQ Status"
              />*/}
              {/*<View style={styles.checkboxWrapper}>
                <ActiveCheckbox
                  value={formData.isActive}
                  onChange={(value) => updateField("isActive", value)}
                  label="Active"
                />
              </View>*/}

              {/* 👇 Visibility */}
              <RxRfqVisibilityManager
                scope={formData.visibilityScope}
                rules={formData.visibilityRules}
                onScopeChange={(scope) => updateField("visibilityScope", scope)}
                onAddRule={addVisibilityRule}
                onRemoveRule={removeVisibilityRule}
                error={errors.visibilityRules}
              />
            </View>
          </FormSectionContainer>

          {/* RFQ Items Section */}
          <FormSectionContainer
            title="Requested Items"
            required
            subtitle="Add products you are requesting"
          >
            {/* Direct execution using updateField instead of redundant wrapper definitions */}
            <RxRfqItemsTable
              items={formData.items}
              onChange={(items) => updateField("items", items)}
              error={errors.items}
            />
          </FormSectionContainer>

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
              title="Submit RFQ"
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
    // borderBottomWidth: 2,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Keeps the title perfectly centered
    paddingHorizontal: 16,
    paddingVertical: 14, // Marginally taller for a premium feel
    borderBottomWidth: 0.5, // Injected distinct standard separation lines
    position: "relative", // Establishes anchor boundary for child nodes
    minHeight: 56, // Guarantees reliable structural consistency
  },
  backButton: {
    position: "absolute", // Pulls button out of the structural flex line
    left: 16, // Pin safely to the left layout margin
    zIndex: 10, // Guarantees tap precedence over title blocks
    padding: 8,
    borderRadius: 12, // Softer premium edge curve
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "70%", // Safely prevents long titles from clipping beneath the back button
  },
  headerTitle: {
    fontSize: 17, // Mobile optimal text tracking weight
    fontWeight: "700",
    letterSpacing: -0.2, // Subtle text tracking tightener for high-end look
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
    opacity: 0.8,
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

export default RxRfqsRequestForm;
