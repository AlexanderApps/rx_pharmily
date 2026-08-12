import React, { useMemo, useState, forwardRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  RxRfqAdditionalCostItem,
  RxRfqAdditionalCostType,
} from "@/features/rxrfqs/types/rxrfqs.types";
import CommentInput from "@/shared/components/comment-input";
import ActiveCheckbox from "@/features/donations/components/temp/active-checkbox";

interface RxRfqAdditionalCostModalProps {
  onClose: () => void;
  onSave: (item: RxRfqAdditionalCostItem) => void;
  initialData?: RxRfqAdditionalCostItem | null;
  isEditing?: boolean;
}

const COST_TYPES: {
  value: RxRfqAdditionalCostType;
  label: string;
  icon: string;
}[] = [
  { value: "delivery", label: "Delivery", icon: "truck-outline" },
  { value: "insurance", label: "Insurance", icon: "shield-outline" },
  { value: "handling", label: "Handling", icon: "hand-coin-outline" },
  { value: "tax", label: "Tax", icon: "receipt-outline" },
  { value: "other", label: "Other", icon: "dots-horizontal-circle-outline" },
];

const RxRfqAdditionalCostModal = forwardRef<
  BottomSheetModal,
  RxRfqAdditionalCostModalProps
>(({ onClose, onSave, initialData, isEditing = false }, ref) => {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ["75%", "90%"], []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Omit<RxRfqAdditionalCostItem, "id">>(
    {
      costType: "delivery",
      description: "",
      amount: 0,
      isRequired: false,
    },
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        costType: initialData.costType,
        description: initialData.description,
        amount: initialData.amount,
        isRequired: initialData.isRequired,
      });
    } else {
      setFormData({
        costType: "delivery",
        description: "",
        amount: 0,
        isRequired: false,
      });
    }
    setErrors({});
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (formData.amount <= 0)
      newErrors.amount = "Amount must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave({
      id: initialData?.id || `cost_${Date.now()}`,
      ...formData,
    });
  };

  const handleBottomSheetChange = (index: number) => {
    if (index === -1) onClose();
  };

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      showHandle
      cornerRadius={20}
      padding={0}
      enablePanDownToClose
      onChange={handleBottomSheetChange}
      backgroundColor={colors.backgroundSecondary}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Cost" : "Add Cost"}
        </Text>
        <TouchableOpacity
          onPress={() =>
            (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
          }
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.contentContainer}>
          {/* Cost type selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Cost Type <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={styles.typeGrid}>
              {COST_TYPES.map((type) => {
                const selected = formData.costType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selected
                          ? colors.text
                          : colors.backgroundElement,
                        borderColor: selected ? colors.text : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        costType: type.value,
                      }))
                    }
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={type.icon as any}
                      size={15}
                      color={
                        selected
                          ? colors.backgroundSecondary
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: selected
                            ? colors.backgroundSecondary
                            : colors.text,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.description
                    ? colors.error
                    : colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.description}
              onChangeText={(description) =>
                setFormData((prev) => ({ ...prev, description }))
              }
              placeholder="e.g. Express delivery to site..."
              placeholderTextColor={colors.textSecondary}
            />
            {errors.description && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.description}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Amount <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.amount ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.amount === 0 ? "" : formData.amount.toString()}
              onChangeText={(value) => {
                const num = parseFloat(value);
                setFormData((prev) => ({
                  ...prev,
                  amount: isNaN(num) ? 0 : num,
                }));
              }}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            {errors.amount && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.amount}
              </Text>
            )}
          </View>

          {/* Required toggle */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Mandatory Charge
            </Text>
            <ActiveCheckbox
              label="Buyer must accept this cost"
              value={formData.isRequired}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, isRequired: value }))
              }
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.text }]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.saveButtonText,
                { color: colors.backgroundSecondary },
              ]}
            >
              {isEditing ? "Save Changes" : "Add Cost"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "700" },
  closeButton: { padding: 4 },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  section: { width: "100%", gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 13, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
});

export default RxRfqAdditionalCostModal;
