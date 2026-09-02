import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  RxRfqItem,
  RxRfqVisibilityRule,
  RxRfqsFormData,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { useNavigation } from "expo-router";

const INITIAL_FORM_STATE: RxRfqsFormData = {
  id: "",
  facilityId: "",
  categories: [],
  termsOfService: "",
  comment: "",
  description: "",
  isActive: true,
  status: "draft",
  items: [],
  incoterms: "",
  submissionDeadline: new Date(),
  visibilityScope: "All",
  visibilityRules: [],
  strictMinShelfLife: false,
  minShelfLifeMonths: 18,
  deliveryDate: new Date(),
  // Was "" — an explicit empty string always overrode the DB column's
  // own default('GHS'), so that default never actually applied. Fixed
  // here, at the actual source of the value.
  currency: "GHS",
};

export default function useAddRxRfqRequest(
  onSubmit?: (data: RxRfqsFormData) => void,
  initialData?: Partial<RxRfqsFormData>,
  isLoading?: boolean,
) {
  const navigation = useNavigation();

  // 1. Store the true initial baseline to accurately compare changes later
  const baselineData = useRef<RxRfqsFormData>({
    ...INITIAL_FORM_STATE,
    ...initialData,
  });

  const [formData, setFormData] = useState<RxRfqsFormData>(
    baselineData.current,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof RxRfqsFormData, string>>
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

      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          { text: "Stay Here", style: "cancel", onPress: () => {} },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, isSubmitting]);

  // Update individual form fields
  const updateField = useCallback(
    <K extends keyof RxRfqsFormData>(field: K, value: RxRfqsFormData[K]) => {
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
  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.facilityId.trim()) {
      newErrors.facilityId = "Facility is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.categories.length === 0) {
      newErrors.categories = "At least one category is required";
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    if (
      formData.visibilityScope === "Restricted" &&
      formData.visibilityRules.length === 0
    ) {
      newErrors.visibilityRules =
        "At least one visibility rule is required when restricted";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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

  // Handle item table additions/deletions
  const addItem = useCallback((item: RxRfqItem) => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  }, []);

  // Handle visibility rule additions/deletions
  const addVisibilityRule = useCallback((rule: RxRfqVisibilityRule) => {
    setFormData((prev) => ({
      ...prev,
      visibilityRules: [...prev.visibilityRules, rule],
    }));
  }, []);

  const removeVisibilityRule = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      visibilityRules: prev.visibilityRules.filter((_, idx) => idx !== index),
    }));
  }, []);

  // Reset form
  const handleReset = useCallback(() => {
    Alert.alert("Reset Form", "Are you sure you want to clear all data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: () => {
          setFormData(INITIAL_FORM_STATE);
          setErrors({});
        },
        style: "destructive",
      },
    ]);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    hasUnsavedChanges,
    updateField,
    addItem,
    removeItem,
    addVisibilityRule,
    removeVisibilityRule,
    handleSubmit,
    handleReset,
    validateForm,
  };
}
