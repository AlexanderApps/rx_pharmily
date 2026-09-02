import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import MultiSelectPicker from "@/shared/components/forms/multi-select-picker";
import StatusDropdown from "@/features/rxrfqs/components/rxrfq-status-dropdown";
import { useTheme } from "@/shared/hooks/use-theme";
import DatePicker from "@/shared/components/date-picker";
import { RxRfqsFormData } from "@/features/rxrfqs/types/rxrfqs.types";
import useAddRxRfqRequest from "@/features/rxrfqs/hooks/use-add-rxrfq-req";
import { Ionicons } from "@expo/vector-icons";
import { RxRfqVisibilityManager } from "@/features/rxrfqs/components/rxrfq-visibility-manager";
import { IncotermsDropdown } from "@/shared/components/forms/incoterm-selector";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
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
  const referenceCurrencies = useReferenceDataStore((state) => state.currencies);
  const currencyOptions = useMemo(
    () => referenceCurrencies.map((c) => ({ id: c.code, label: `${c.code} — ${c.name}` })),
    [referenceCurrencies],
  );
  const referenceRxRfqCategories = useReferenceDataStore((state) => state.rxrfqCategories);
  const categoryOptions = useMemo(
    () => referenceRxRfqCategories.map((c) => ({ id: c.name, label: c.name })),
    [referenceRxRfqCategories],
  );

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
              Add RxRFQ Request
            </ThemedText>
            <ThemedText
              className="text-xs font-normal mt-0.5 opacity-80"
              style={{ color: colors.textSecondary }}
            >
              Create a new request for quote entry
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
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
            <MultiSelectPicker
              title="Select Categories"
              options={categoryOptions}
              value={formData.categories}
              onChange={(categories) => updateField("categories", categories)}
              placeholder="Select categories"
              emptyMessage="No categories set up yet."
              searchable={false}
              error={errors.categories}
            />
          </FormSectionContainer>

          {/* Currency Section */}
          <FormSectionContainer title="Currency">
            <ReferencePicker
              title="Select Currency"
              options={currencyOptions}
              value={formData.currency}
              onChange={(currency) => updateField("currency", currency)}
              placeholder="Select a currency"
              emptyMessage="No currencies set up yet."
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
            <View className="flex-col gap-4 w-full">
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

export default RxRfqsRequestForm;
