import React, { useMemo, useState, forwardRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
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
  // The request's own currency — displayed next to Amount so the
  // vendor knows what they're entering, not offered as a choice. Same
  // "respect, don't let them pick" treatment as PriceComboBox gets in
  // rxrfq-res-item-modal.tsx.
  currency?: string;
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
>(({ onClose, onSave, initialData, isEditing = false, currency = "GHS" }, ref) => {
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
      <View className="flex-row justify-between items-center px-5 py-4 border-b" style={{ borderBottomColor: colors.border }}>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          {isEditing ? "Edit Cost" : "Add Cost"}
        </Text>
        <TouchableOpacity
          onPress={() =>
            (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
          }
          className="p-1"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <View className="px-5 pt-5 pb-10 gap-5">
          {/* Cost type selector */}
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              Cost Type <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COST_TYPES.map((type) => {
                const selected = formData.costType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: selected
                        ? colors.text
                        : colors.backgroundElement,
                      borderColor: selected ? colors.text : colors.border,
                    }}
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
                      className="text-[13px] font-medium"
                      style={{
                        color: selected
                          ? colors.backgroundSecondary
                          : colors.text,
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              Description <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              className="border rounded-lg px-3 py-3 text-[15px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: errors.description
                  ? colors.error
                  : colors.border,
                color: colors.text,
              }}
              value={formData.description}
              onChangeText={(description) =>
                setFormData((prev) => ({ ...prev, description }))
              }
              placeholder="e.g. Express delivery to site..."
              placeholderTextColor={colors.textSecondary}
            />
            {errors.description && (
              <Text className="text-xs font-medium mt-0.5" style={{ color: colors.error }}>
                {errors.description}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              Amount ({currency}) <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              className="border rounded-lg px-3 py-3 text-[15px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: errors.amount ? colors.error : colors.border,
                color: colors.text,
              }}
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
              <Text className="text-xs font-medium mt-0.5" style={{ color: colors.error }}>
                {errors.amount}
              </Text>
            )}
          </View>

          {/* Required toggle */}
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
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
            className="rounded-[10px] py-3.5 items-center justify-center mt-2.5"
            style={{ backgroundColor: colors.text }}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: colors.backgroundSecondary }}
            >
              {isEditing ? "Save Changes" : "Add Cost"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
});

export default RxRfqAdditionalCostModal;

