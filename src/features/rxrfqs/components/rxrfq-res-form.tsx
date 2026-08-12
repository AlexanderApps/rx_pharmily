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
import {
  RxRfqMarketPlaceData,
  RxRfqResponseFormData,
  RxRfqResponseItem,
  RxRfqsFormData,
} from "@/features/rxrfqs/types/rxrfqs.types";
import useAddRxRfqResponse from "@/features/rxrfqs/hooks/use-add-rxrfq-res";
import { Ionicons } from "@expo/vector-icons";
import { RxRfqVisibilityManager } from "@/features/rxrfqs/components/rxrfq-visibility-manager";
import { IncotermsDropdown } from "@/shared/components/forms/incoterm-selector";
import ShelfLifeConfig from "./rxrfq-shelflife";
import RxRfqResponseItemsTable from "@/features/rxrfqs/components/rxrfq-res-items-table";
import RxRfqAdditionalCostsTable from "@/features/rxrfqs/components/rxrfq-additional-cost-table";
import RxRfqResponseSummaryModal from "./rxrfq-res-summary-modal";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

const RxRfqsResponseForm: React.FC<{
  rxRfqRequest: RxRfqMarketPlaceData;
  onSubmit?: (data: RxRfqResponseFormData) => void;
  initialData?: Partial<RxRfqResponseFormData>;
  isLoading?: boolean;
}> = ({ rxRfqRequest, onSubmit, initialData, isLoading = false }) => {
  const { colors } = useTheme();
  const {
    formData,
    errors,
    updateField,
    handleSubmit,
    handleReset,
    // addVisibilityRule,
    // removeVisibilityRule,
    isSubmitting,
  } = useAddRxRfqResponse(onSubmit, initialData, isLoading);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const fetchPriceTemplates = useProfileStore((state) => state.fetchPriceTemplates);
  useEffect(() => {
    fetchPriceTemplates();
  }, []);

  const handleSubmitPress = () => {
    // if (!validateForm()) return;
    // handleSubmit();
    setSummaryVisible(true);
  };

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
              RxRFQ Response
            </ThemedText>
            <ThemedText
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Create a new response for quote entry
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Facility Section */}
          <FormSectionContainer title="RxRFQ Response Details" required>
            <MyFacilityPicker
              value={formData.vendorFacility}
              onChange={(value) => updateField("vendorFacility", value)}
              error={errors.vendorFacility}
            />
          </FormSectionContainer>

          {/* Delivery Date Section */}
          <FormSectionContainer title="Valid Until" required>
            <DatePicker
              value={formData.quoteValidUntil}
              onChange={(date) => updateField("quoteValidUntil", date)}
              format="long"
            />
          </FormSectionContainer>

          {/* Terms of Service Section */}
          <FormSectionContainer title="Terms and Conditions">
            <TermsOfServiceInput
              value={formData.paymentTerms}
              onChange={(value) => updateField("paymentTerms", value)}
              placeholder="Enter terms of service (supports RTF, markdown support coming soon)..."
            />
          </FormSectionContainer>

          {/* Comments Section */}
          <FormSectionContainer title="Additional Comments">
            <CommentInput
              value={formData.vendorComment || ""}
              onChange={(value) => updateField("vendorComment", value)}
              placeholder="Add any additional comments..."
            />
          </FormSectionContainer>

          {/* RFQ Items Section */}
          <FormSectionContainer
            title="Response Items"
            required
            subtitle="Add products you are responding to"
          >
            {/* Direct execution using updateField instead of redundant wrapper definitions */}
            <RxRfqResponseItemsTable
              rfqItems={rxRfqRequest.items}
              error={errors.items}
              items={formData.items}
              currency={rxRfqRequest.currency}
              onChange={(items) => updateField("items", items)}
              facilityId={formData.vendorFacility}
            />
          </FormSectionContainer>

          {/* RFQ Additional Costs Section */}
          <FormSectionContainer
            title="Additional Costs"
            // subtitle="Add products you are responding to"
          >
            {/* Direct execution using updateField instead of redundant wrapper definitions */}
            <RxRfqAdditionalCostsTable
              items={formData.additionalCosts}
              currency={rxRfqRequest.currency}
              onChange={(additionalCosts) =>
                updateField("additionalCosts", additionalCosts)
              }
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
              onPress={handleSubmitPress}
              variant="primary"
              style={styles.submitButton}
              isLoading={isLoading || isSubmitting}
            />
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <RxRfqResponseSummaryModal
        visible={summaryVisible}
        onClose={() => setSummaryVisible(false)}
        onSaveDraft={() => {
          setSummaryVisible(false);
          // saveResponse("draft");
        }}
        onPublish={() => {
          setSummaryVisible(false);
          // saveResponse("published");
          handleSubmit();
        }}
        formData={formData}
        rfqItems={rxRfqRequest.items}
        rfqSubmissionDeadline={rxRfqRequest.submissionDeadline}
      />
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

export default RxRfqsResponseForm;
