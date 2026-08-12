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
  KeyboardAvoidingView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";

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
        <BottomSheetScrollView>
          <View style={styles.content}>
            <View style={styles.contentContainer}>
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>
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
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Quantity <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.quantityContainer,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: errors.quantity
                        ? colors.error
                        : colors.border,
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

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Unit of Measure (UOM)
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
                  value={formData.uom}
                  onChangeText={(uom) =>
                    setFormData((prev) => ({ ...prev, uom }))
                  }
                  placeholder="Enter UOM..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.statusStack}>
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text }]}>
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
        </BottomSheetScrollView>
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
  saveButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 150,
  },
  saveButtonText: { fontSize: 16, fontWeight: "600" },
});

export default RxRfQItemModal;
