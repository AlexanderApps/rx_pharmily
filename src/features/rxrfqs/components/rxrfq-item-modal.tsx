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
  KeyboardAvoidingView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

import ProductPicker from "@/shared/components/product-picker";
import ItemStatusCheckbox from "@/features/donations/components/temp/item-status-checkbox";
import { RxRfqItem } from "@/features/rxrfqs/types/rxrfqs.types";
import CommentInput from "@/shared/components/bs/comment-input";
import ActiveCheckbox from "@/features/donations/components/temp/active-checkbox";

interface RxRfQItemModalProps {
  onClose: () => void;
  onSave: (item: RxRfqItem) => void;
  initialData?: RxRfqItem | null;
  isEditing?: boolean;
}

// We use forwardRef so the parent can explicitly send command triggers
const RxRfQItemModal = forwardRef<BottomSheetModal, RxRfQItemModalProps>(
  ({ onClose, onSave, initialData, isEditing = false }, ref) => {
    const { colors } = useTheme();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const snapPoints = useMemo(() => ["90%", "95%"], []);
    const referenceUnits = useReferenceDataStore((state) => state.units);
    const unitOptions = useMemo(
      () =>
        referenceUnits.map((u) => ({
          id: u.name,
          label: u.abbreviation ? `${u.name} (${u.abbreviation})` : u.name,
        })),
      [referenceUnits],
    );

    // Local form state manager
    const [formData, setFormData] = useState<Omit<RxRfqItem, "id">>({
      productId: "",
      quantity: 1,
      allowAlternatives: false,
      uom: "",
      comment: "",
    });

    // Reset or populate local form fields automatically when modal state alters
    React.useEffect(() => {
      if (initialData) {
        setFormData({
          productId: initialData.productId,
          quantity: initialData.quantity,
          uom: initialData.uom || "",
          allowAlternatives: initialData.allowAlternatives || false,
        });
      } else {
        setFormData({
          productId: "",
          quantity: 1,
          uom: "",
          allowAlternatives: false,
        });
      }
      setErrors({});
    }, [initialData]);

    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};
      if (!formData.productId) {
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

      const newItem: RxRfqItem = {
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
        <BottomSheetScrollView>
          <View className="flex-1">
            <View className="px-5 pt-5 pb-10 gap-5">
              <View className="w-full gap-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Product <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <ProductPicker
                  value={formData.productId}
                  onChange={(productId) =>
                    setFormData((prev) => ({ ...prev, productId }))
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
                    borderColor: errors.quantity
                      ? colors.error
                      : colors.border,
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
                  Allow Alternatives
                </Text>
                <ActiveCheckbox
                  label="Allow Alternatives"
                  value={formData.allowAlternatives}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      allowAlternatives: value,
                    }))
                  }
                />
              </View>

              <View className="w-full gap-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Unit of Measure (UOM)
                </Text>
                <ReferencePicker
                  title="Select Unit"
                  options={unitOptions}
                  value={formData.uom}
                  onChange={(uom) => setFormData((prev) => ({ ...prev, uom }))}
                  placeholder="Select a unit"
                  emptyMessage="No units set up yet."
                />
              </View>

              <View className="flex-col w-full gap-4">
                <View className="w-full gap-2">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    Comments
                  </Text>
                  <CommentInput
                    value={formData.comment || ""}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, comment: value }))
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                className="rounded-[10px] py-3.5 items-center justify-center mb-[150px]"
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
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

export default RxRfQItemModal;

