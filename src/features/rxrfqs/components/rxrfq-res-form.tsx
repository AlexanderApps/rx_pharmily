import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
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
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Enhanced Header Section with Back Navigation */}
        <ThemedView
          className="flex-row items-center justify-center px-4 py-3.5 border-b-[0.5px] relative min-h-14"
          style={{
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          }}
        >
          {/* 1. Left Action Button */}
          {Platform.OS !== "web" && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 z-10 p-2 rounded-xl w-10 h-10 items-center justify-center"
            style={{
              backgroundColor:
                colors.backgroundElement || "rgba(128,128,128,0.08)",
            }}
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back-sharp" size={22} color={colors.text} />
          </TouchableOpacity>
          )}

          {/* 2. Centered Content Container */}
          <ThemedView className="items-center justify-center max-w-[70%]">
            <ThemedText className="text-[17px] font-bold -tracking-[0.2px]" style={{ color: colors.text }}>
              RxRFQ Response
            </ThemedText>
            <ThemedText
              className="text-xs font-normal mt-0.5 opacity-80"
              style={{ color: colors.textSecondary }}
            >
              Create a new response for quote entry
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
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
          <View className="flex-row gap-3 mt-8 mb-4">
            <FormButton
              title="Reset"
              onPress={handleReset}
              variant="secondary"
              style={{ flex: 1 }}
              disabled={isLoading || isSubmitting}
            />
            <FormButton
              title="Submit RFQ"
              onPress={handleSubmitPress}
              variant="primary"
              style={{ flex: 1.2 }}
              isLoading={isLoading || isSubmitting}
            />
          </View>

          {/* Bottom Spacing */}
          <View className="h-5" />
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

export default RxRfqsResponseForm;
