import React, {
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
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

import ProductComboBox from "@/shared/components/product-combobox";
import ItemStatusCheckbox from "@/features/donations/components/temp/item-status-checkbox";
import DatePicker from "@/shared/components/date-picker";
import { DonationItem } from "@/features/donations/types/donation.types";

interface DonatedItemModalProps {
  onClose: () => void;
  onSave: (item: DonationItem) => void;
  initialData?: DonationItem | null;
  isEditing?: boolean;
}

// We use forwardRef so the parent can explicitly send command triggers
const DonatedItemModal = forwardRef<BottomSheetModal, DonatedItemModalProps>(
  ({ onClose, onSave, initialData, isEditing = false }, ref) => {
    const { colors } = useTheme();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const snapPoints = useMemo(() => ["85%", "95%"], []);

    // Local form state manager
    const [formData, setFormData] = useState<Omit<DonationItem, "id">>({
      product: "",
      quantity: 1,
      batch: "",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: true,
      isActive: true,
      isCustomProduct: true,
    });

    // Reset or populate local form fields automatically when modal state alters
    React.useEffect(() => {
      if (initialData) {
        setFormData({
          product: initialData.product,
          quantity: initialData.quantity,
          batch: initialData.batch || "",
          expiryDate: initialData.expiryDate,
          status: initialData.status,
          isActive: initialData.isActive,
          isCustomProduct: initialData.isCustomProduct,
        });
      } else {
        setFormData({
          product: "",
          quantity: 1,
          batch: "",
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: true,
          isActive: true,
          isCustomProduct: true,
        });
      }
      setErrors({});
    }, [initialData]);

    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};
      if (!formData.product.trim()) {
        newErrors.product = "Product is required";
      }
      if (formData.quantity < 1) {
        newErrors.quantity = "Quantity must be at least 1";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
      if (!validateForm()) return;

      const newItem: DonationItem = {
        id: initialData?.id || `item_${Date.now()}`,
        ...formData,
      };
      onSave(newItem);
    };

    const handleBottomSheetChange = (index: number) => {
      if (index === -1) {
        onClose(); // Clean up parent trackers when closed natively
      }
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        showHandle={true}
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 py-4 border-b" style={{ borderBottomColor: colors.border }}>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {isEditing ? "Edit Item" : "Add New Item"}
          </Text>
          <TouchableOpacity
            onPress={() =>
              (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
            }
            className="p-1"
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Form Fields Content - Let BottomSheet handle scrolling naturally */}
        <View className="flex-1">
          <View className="px-5 pt-5 pb-10 gap-5">
            <View className="w-full gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Product <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <ProductComboBox
                value={formData.product}
                isCustomProduct={formData.isCustomProduct}
                onChange={(product, isCustomProduct) =>
                  setFormData((prev) => ({ ...prev, product, isCustomProduct }))
                }
                error={errors.product}
              />
            </View>

            <View className="w-full gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Quantity <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View
                className="flex-row items-center border rounded-lg overflow-hidden"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.quantity ? colors.error : colors.border,
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, prev.quantity - 1),
                    }))
                  }
                  className="px-4 py-3 items-center justify-center"
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                <TextInput
                  className="flex-1 text-center text-base font-semibold py-2"
                  style={{ color: colors.text }}
                  value={formData.quantity.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value, 10);
                    setFormData((prev) => ({
                      ...prev,
                      quantity: isNaN(num) ? 0 : num,
                    }));
                  }}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: prev.quantity + 1,
                    }))
                  }
                  className="px-4 py-3 items-center justify-center"
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.quantity && (
                <Text className="text-xs font-medium mt-0.5" style={{ color: colors.error }}>
                  {errors.quantity}
                </Text>
              )}
            </View>

            <View className="w-full gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Batch (Optional)
              </Text>
              <TextInput
                className="border rounded-lg px-3 py-3 text-[15px]"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                value={formData.batch}
                onChangeText={(batch) =>
                  setFormData((prev) => ({ ...prev, batch }))
                }
                placeholder="Enter batch number..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View className="w-full gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Expiry Date <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <DatePicker
                value={formData.expiryDate}
                onChange={(expiryDate) =>
                  setFormData((prev) => ({ ...prev, expiryDate }))
                }
                format="long"
              />
              {formData.expiryDate.getTime() < Date.now() && (
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={14}
                    color={colors.warning}
                  />
                  <Text className="text-xs font-medium flex-1" style={{ color: colors.warning }}>
                    This date is in the past — the item will show as expired.
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-col w-full gap-4">
              <View className="w-full gap-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Item Status
                </Text>
                <ItemStatusCheckbox
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                  label={formData.status ? "Verified Good" : "Needs Review"}
                />
              </View>
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
                {isEditing ? "Save Changes" : "Add Item"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    );
  },
);

export default DonatedItemModal;

