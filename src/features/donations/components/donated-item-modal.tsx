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
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";

import ProductComboBox from "@/shared/components/product-combobox";
import ItemStatusCheckbox from "@/features/donations/components/temp/item-status-checkbox";
import ActiveCheckbox from "@/features/donations/components/temp/active-checkbox";
import DatePicker from "@/shared/components/date-picker";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
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
    const [formData, setFormData] = useState<Omit<DonationItem, "id">>({
      product: "",
      quantity: 1,
      uom: "",
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
          uom: initialData.uom || "",
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
          uom: "",
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
        // initialData stays null across two consecutive "Add" attempts
        // (no reference change), so the effect above that resets
        // formData only fires on a genuine initialData change — never
        // between "typed something, dismissed without saving" and the
        // next fresh "Add Item" open. Resetting here, on every close
        // regardless of cause, closes that gap without disturbing the
        // effect's own handling of genuine edit-to-edit transitions.
        setFormData({
          product: "",
          quantity: 1,
          uom: "",
          batch: "",
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: true,
          isActive: true,
          isCustomProduct: true,
        });
        setErrors({});
      }
    };

    return (
      <BottomSheet
        ref={ref}
        title={isEditing ? "Edit Item" : "Add New Item"}
        snapPoints={snapPoints}
        showHandle={true}
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        {/* Form Fields Content */}
        <BottomSheetScrollView keyboardShouldPersistTaps="handled">
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
                Unit of Measure (UOM)
              </Text>
              <ReferencePicker
                title="Select Unit"
                options={unitOptions}
                value={formData.uom ?? ""}
                onChange={(uom) => setFormData((prev) => ({ ...prev, uom }))}
                placeholder="Select a unit"
                emptyMessage="No units set up yet."
              />
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

              {/* isActive is the actual "is this line item available for
                  donation" toggle — separate from Item Status above,
                  which is a quality/condition flag, not availability.
                  Previously this was never exposed here at all: it only
                  ever existed as a hardcoded `true` default, so the
                  creator had no way to actually turn a line item off.
                  Availability also depends on expiryDate (see
                  isDonationItemAvailable in donation.types.ts) — this
                  toggle alone doesn't guarantee an item is claimable if
                  it's already expired, which is called out below. */}
              <View className="w-full gap-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Available for Donation
                </Text>
                <ActiveCheckbox
                  value={formData.isActive}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, isActive: value }))
                  }
                  label={formData.isActive ? "Available" : "Not available"}
                />
                {formData.isActive && formData.expiryDate.getTime() < Date.now() && (
                  <Text className="text-xs font-medium" style={{ color: colors.warning }}>
                    This item is expired, so it won't actually be claimable
                    even while marked available.
                  </Text>
                )}
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
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

export default DonatedItemModal;

