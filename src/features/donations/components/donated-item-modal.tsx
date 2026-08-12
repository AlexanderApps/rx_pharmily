import React, {
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import {
  View,
  StyleSheet,
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditing ? "Edit Item" : "Add New Item"}
          </Text>
          <TouchableOpacity
            onPress={() =>
              (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
            }
            style={styles.closeButton}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Form Fields Content - Let BottomSheet handle scrolling naturally */}
        <View style={styles.content}>
          <View style={styles.contentContainer}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
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

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Quantity <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View
                style={[
                  styles.quantityContainer,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: errors.quantity ? colors.error : colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, prev.quantity - 1),
                    }))
                  }
                  style={styles.quantityButton}
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.quantityInput, { color: colors.text }]}
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
                  style={styles.quantityButton}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.quantity && (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.quantity}
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Batch (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.batch}
                onChangeText={(batch) =>
                  setFormData((prev) => ({ ...prev, batch }))
                }
                placeholder="Enter batch number..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
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
                <View style={styles.expiryWarningRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={14}
                    color={colors.warning}
                  />
                  <Text style={[styles.expiryWarningText, { color: colors.warning }]}>
                    This date is in the past — the item will show as expired.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statusStack}>
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>
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
                {isEditing ? "Save Changes" : "Add Item"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    );
  },
);

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
  statusStack: { flexDirection: "column", width: "100%", gap: 16 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  error: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  expiryWarningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  expiryWarningText: { fontSize: 12, fontWeight: "500", flex: 1 },
  saveButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
});

export default DonatedItemModal;
