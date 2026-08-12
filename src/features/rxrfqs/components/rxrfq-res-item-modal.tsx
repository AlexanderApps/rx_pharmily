// import React, { useMemo, useState, forwardRef } from "react";
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   TextInput,
// } from "react-native";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { useTheme } from "@/shared/hooks/use-theme";
// import BottomSheet from "@/shared/components/bottom-sheet";
// import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
// import {
//   RxRfqItem,
//   RxRfqResponseItem,
// } from "@/features/rxrfqs/types/rxrfqs.types";
// import CommentInput from "@/shared/components/bs/comment-input";
// import ActiveCheckbox from "@/features/donations/components/temp/active-checkbox";

// interface RxRfqResponseItemModalProps {
//   rfqItem: RxRfqItem;
//   onClose: () => void;
//   onSave: (item: RxRfqResponseItem) => void;
//   initialData?: RxRfqResponseItem | null;
//   isEditing?: boolean;
// }

// const RxRfqResponseItemModal = forwardRef<
//   BottomSheetModal,
//   RxRfqResponseItemModalProps
// >(({ rfqItem, onClose, onSave, initialData, isEditing = false }, ref) => {
//   const { colors } = useTheme();
//   const snapPoints = useMemo(() => ["90%", "95%"], []);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const [formData, setFormData] = useState<
//     Omit<RxRfqResponseItem, "id" | "rfqItemId" | "amount">
//   >({
//     product: rfqItem.product,
//     quantity: rfqItem.quantity,
//     rate: 0,
//     offeredAlternative: false,
//     alternativeProductDetails: "",
//     comment: "",
//   });
//   const [rateInput, setRateInput] = useState(
//     formData.rate === 0 ? "" : formData.rate.toString(),
//   );

//   React.useEffect(() => {
//     if (initialData) {
//       setFormData({
//         product: initialData.product,
//         quantity: initialData.quantity,
//         rate: initialData.rate,
//         offeredAlternative: initialData.offeredAlternative,
//         alternativeProductDetails: initialData.alternativeProductDetails || "",
//         comment: initialData.comment || "",
//       });
//     } else {
//       setFormData({
//         product: rfqItem.product,
//         quantity: rfqItem.quantity,
//         rate: 0,
//         offeredAlternative: false,
//         alternativeProductDetails: "",
//         comment: "",
//       });
//     }
//     setErrors({});
//   }, [initialData, rfqItem]);

//   const amount = formData.quantity * formData.rate;

//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};
//     if (!formData.product.trim()) newErrors.product = "Product is required";
//     if (formData.quantity < 1)
//       newErrors.quantity = "Quantity must be at least 1";
//     if (formData.rate <= 0) newErrors.rate = "Rate must be greater than 0";
//     if (
//       formData.offeredAlternative &&
//       !formData.alternativeProductDetails?.trim()
//     ) {
//       newErrors.alternativeProductDetails =
//         "Please describe the alternative product";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSave = () => {
//     if (!validateForm()) return;
//     onSave({
//       id: initialData?.id || `res_item_${Date.now()}`,
//       rfqItemId: rfqItem.id,
//       ...formData,
//       amount,
//     });
//   };

//   const handleBottomSheetChange = (index: number) => {
//     if (index === -1) onClose();
//   };

//   return (
//     <BottomSheet
//       ref={ref}
//       snapPoints={snapPoints}
//       // showHandle
//       cornerRadius={20}
//       padding={0}
//       // enablePanDownToClose
//       onChange={handleBottomSheetChange}
//       backgroundColor={colors.backgroundSecondary}
//     >
//       {/* Header */}
//       <View style={[styles.header, { borderBottomColor: colors.border }]}>
//         <Text style={[styles.title, { color: colors.text }]}>
//           {isEditing ? "Edit Response Item" : "Respond to Item"}
//         </Text>
//         <TouchableOpacity
//           onPress={() =>
//             (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
//           }
//           style={styles.closeButton}
//         >
//           <MaterialCommunityIcons name="close" size={24} color={colors.text} />
//         </TouchableOpacity>
//       </View>

//       <BottomSheetScrollView>
//         <View style={styles.content}>
//           <View style={styles.contentContainer}>
//             {/* RFQ item context pill */}
//             <View
//               style={[
//                 styles.contextBanner,
//                 {
//                   backgroundColor: colors.backgroundElement,
//                   borderColor: colors.border,
//                 },
//               ]}
//             >
//               <MaterialCommunityIcons
//                 name="file-document-outline"
//                 size={14}
//                 color={colors.textSecondary}
//               />
//               <Text
//                 style={[styles.contextText, { color: colors.textSecondary }]}
//                 numberOfLines={1}
//               >
//                 Responding to:{" "}
//                 <Text style={{ color: colors.text, fontWeight: "500" }}>
//                   {rfqItem.product}
//                 </Text>{" "}
//                 · Qty {rfqItem.quantity} {rfqItem.uom || ""}
//               </Text>
//             </View>

//             {/* Product */}
//             <View style={styles.section}>
//               <Text style={[styles.label, { color: colors.text }]}>
//                 Product <Text style={{ color: colors.error }}>*</Text>
//               </Text>
//               <TextInput
//                 style={[
//                   styles.input,
//                   {
//                     backgroundColor: colors.backgroundElement,
//                     borderColor: errors.product ? colors.error : colors.border,
//                     color: colors.text,
//                   },
//                 ]}
//                 value={formData.product}
//                 onChangeText={(product) =>
//                   setFormData((prev) => ({ ...prev, product }))
//                 }
//                 placeholder="Product name..."
//                 placeholderTextColor={colors.textSecondary}
//               />
//               {errors.product && (
//                 <Text style={[styles.error, { color: colors.error }]}>
//                   {errors.product}
//                 </Text>
//               )}
//             </View>

//             {/* Quantity */}
//             <View style={styles.section}>
//               <Text style={[styles.label, { color: colors.text }]}>
//                 Quantity <Text style={{ color: colors.error }}>*</Text>
//               </Text>
//               <View
//                 style={[
//                   styles.quantityContainer,
//                   {
//                     backgroundColor: colors.backgroundElement,
//                     borderColor: errors.quantity ? colors.error : colors.border,
//                   },
//                 ]}
//               >
//                 <TouchableOpacity
//                   onPress={() =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       quantity: Math.max(1, prev.quantity - 1),
//                     }))
//                   }
//                   style={styles.quantityButton}
//                 >
//                   <MaterialCommunityIcons
//                     name="minus"
//                     size={20}
//                     color={colors.textSecondary}
//                   />
//                 </TouchableOpacity>
//                 <TextInput
//                   style={[styles.quantityInput, { color: colors.text }]}
//                   value={formData.quantity.toString()}
//                   onChangeText={(value) => {
//                     const num = parseInt(value, 10);
//                     setFormData((prev) => ({
//                       ...prev,
//                       quantity: isNaN(num) ? 1 : num,
//                     }));
//                   }}
//                   keyboardType="number-pad"
//                 />
//                 <TouchableOpacity
//                   onPress={() =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       quantity: Math.min(prev.quantity + 1, rfqItem.quantity),
//                     }))
//                   }
//                   style={styles.quantityButton}
//                 >
//                   <MaterialCommunityIcons
//                     name="plus"
//                     size={20}
//                     color={colors.textSecondary}
//                   />
//                 </TouchableOpacity>
//               </View>
//               {errors.quantity && (
//                 <Text style={[styles.error, { color: colors.error }]}>
//                   {errors.quantity}
//                 </Text>
//               )}
//             </View>

//             {/* Rate */}
//             {/*<View style={styles.section}>
//               <Text style={[styles.label, { color: colors.text }]}>
//                 Unit Rate <Text style={{ color: colors.error }}>*</Text>
//               </Text>
//               <TextInput
//                 style={[
//                   styles.input,
//                   {
//                     backgroundColor: colors.backgroundElement,
//                     borderColor: errors.rate ? colors.error : colors.border,
//                     color: colors.text,
//                   },
//                 ]}
//                 value={formData.rate === 0 ? "" : formData.rate.toString()}
//                 onChangeText={(value) => {
//                   const num = parseFloat(value);
//                   setFormData((prev) => ({
//                     ...prev,
//                     rate: isNaN(num) ? 0 : num,
//                   }));
//                 }}
//                 placeholder="0.00"
//                 placeholderTextColor={colors.textSecondary}
//                 keyboardType="decimal-pad"
//               />
//               {errors.rate && (
//                 <Text style={[styles.error, { color: colors.error }]}>
//                   {errors.rate}
//                 </Text>
//               )}
//             </View>*/}
//             {/* Rate */}
//             <View style={styles.section}>
//               <Text style={[styles.label, { color: colors.text }]}>
//                 Unit Rate <Text style={{ color: colors.error }}>*</Text>
//               </Text>
//               <TextInput
//                 style={[
//                   styles.input,
//                   {
//                     backgroundColor: colors.backgroundElement,
//                     borderColor: errors.rate ? colors.error : colors.border,
//                     color: colors.text,
//                   },
//                 ]}
//                 // Bind directly to the local string state instead of the raw number state
//                 value={rateInput}
//                 onChangeText={(value) => {
//                   // 1. Instantly update the input text so points/decimals show up immediately
//                   setRateInput(value);

//                   // 2. Safely parse the value for your actual form submission state
//                   const num = parseFloat(value);
//                   setFormData((prev) => ({
//                     ...prev,
//                     rate: isNaN(num) ? 0 : num,
//                   }));
//                 }}
//                 placeholder="0.00"
//                 placeholderTextColor={colors.textSecondary}
//                 keyboardType="decimal-pad"
//               />
//               {errors.rate && (
//                 <Text style={[styles.error, { color: colors.error }]}>
//                   {errors.rate}
//                 </Text>
//               )}
//             </View>

//             {/* Computed amount */}
//             {formData.rate > 0 && formData.quantity > 0 && (
//               <View
//                 style={[
//                   styles.amountRow,
//                   {
//                     backgroundColor: colors.backgroundElement,
//                     borderColor: colors.border,
//                   },
//                 ]}
//               >
//                 <Text
//                   style={[styles.amountLabel, { color: colors.textSecondary }]}
//                 >
//                   Line Total
//                 </Text>
//                 <Text style={[styles.amountValue, { color: colors.text }]}>
//                   {amount.toLocaleString(undefined, {
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2,
//                   })}
//                 </Text>
//               </View>
//             )}

//             {/* Offered alternative */}
//             {rfqItem.allowAlternatives && (
//               <View style={styles.section}>
//                 <Text style={[styles.label, { color: colors.text }]}>
//                   Offering Alternative Product
//                 </Text>
//                 <ActiveCheckbox
//                   label="This is an alternative to the requested product"
//                   value={formData.offeredAlternative}
//                   onChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       offeredAlternative: value,
//                     }))
//                   }
//                 />
//               </View>
//             )}

//             {formData.offeredAlternative && (
//               <View style={styles.section}>
//                 <Text style={[styles.label, { color: colors.text }]}>
//                   Alternative Product Details{" "}
//                   <Text style={{ color: colors.error }}>*</Text>
//                 </Text>
//                 <TextInput
//                   style={[
//                     styles.input,
//                     {
//                       backgroundColor: colors.backgroundElement,
//                       borderColor: errors.alternativeProductDetails
//                         ? colors.error
//                         : colors.border,
//                       color: colors.text,
//                     },
//                   ]}
//                   value={formData.alternativeProductDetails}
//                   onChangeText={(alternativeProductDetails) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       alternativeProductDetails,
//                     }))
//                   }
//                   placeholder="Describe the alternative product..."
//                   placeholderTextColor={colors.textSecondary}
//                 />
//                 {errors.alternativeProductDetails && (
//                   <Text style={[styles.error, { color: colors.error }]}>
//                     {errors.alternativeProductDetails}
//                   </Text>
//                 )}
//               </View>
//             )}

//             {/* Comment */}
//             <View style={styles.section}>
//               <Text style={[styles.label, { color: colors.text }]}>
//                 Comments
//               </Text>
//               <CommentInput
//                 value={formData.comment || ""}
//                 onChange={(value) =>
//                   setFormData((prev) => ({ ...prev, comment: value }))
//                 }
//               />
//             </View>

//             <TouchableOpacity
//               style={[styles.saveButton, { backgroundColor: colors.text }]}
//               onPress={handleSave}
//               activeOpacity={0.8}
//             >
//               <Text
//                 style={[
//                   styles.saveButtonText,
//                   { color: colors.backgroundSecondary },
//                 ]}
//               >
//                 {isEditing ? "Save Changes" : "Add Response"}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </BottomSheetScrollView>
//     </BottomSheet>
//   );
// });

// const styles = StyleSheet.create({
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//   },
//   title: { fontSize: 18, fontWeight: "700" },
//   closeButton: { padding: 4 },
//   content: { flex: 1 },
//   contentContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 40,
//     gap: 20,
//   },
//   contextBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   contextText: { fontSize: 13, flex: 1 },
//   section: { width: "100%", gap: 8 },
//   label: { fontSize: 14, fontWeight: "600" },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     fontSize: 15,
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderRadius: 8,
//     overflow: "hidden",
//   },
//   quantityButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   quantityInput: {
//     flex: 1,
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: "600",
//     paddingVertical: 8,
//   },
//   amountRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   amountLabel: { fontSize: 13, fontWeight: "500" },
//   amountValue: { fontSize: 16, fontWeight: "600" },
//   error: { fontSize: 12, fontWeight: "500", marginTop: 2 },
//   saveButton: {
//     borderRadius: 10,
//     paddingVertical: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 10,
//   },
//   saveButtonText: { fontSize: 16, fontWeight: "600" },
// });

// export default RxRfqResponseItemModal;

import React, { useMemo, useState, useEffect, forwardRef } from "react";
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
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";
import {
  RxRfqItem,
  RxRfqResponseItem,
} from "@/features/rxrfqs/types/rxrfqs.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import CommentInput from "@/shared/components/bs/comment-input";
import PriceComboBox from "@/shared/components/price-combobox";
import ActiveCheckbox from "@/features/donations/components/temp/active-checkbox";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RxRfqResponseItemModalProps {
  rfqItem: RxRfqItem;
  onClose: () => void;
  onSave: (item: RxRfqResponseItem) => void;
  initialData?: RxRfqResponseItem | null;
  isEditing?: boolean;
  facilityId?: string;
}

type FormData = Omit<
  RxRfqResponseItem,
  "id" | "rfqItemId" | "amount" | "productId"
>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useResponseItemForm(
  rfqItem: RxRfqItem,
  initialData: RxRfqResponseItem | null | undefined,
  onClose: () => void,
  onSave: (item: RxRfqResponseItem) => void,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rateInput, setRateInput] = useState("");
  const [formData, setFormData] = useState<FormData>({
    quantity: rfqItem.quantity,
    rate: 0,
    offeredAlternative: false,
    alternativeProductDetails: "",
    comment: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        quantity: initialData.quantity,
        rate: initialData.rate,
        offeredAlternative: initialData.offeredAlternative,
        alternativeProductDetails: initialData.alternativeProductDetails || "",
        comment: initialData.comment || "",
      });
      setRateInput(initialData.rate === 0 ? "" : initialData.rate.toString());
    } else {
      setFormData({
        quantity: rfqItem.quantity,
        rate: 0,
        offeredAlternative: false,
        alternativeProductDetails: "",
        comment: "",
      });
      setRateInput("");
    }
    setErrors({});
  }, [initialData, rfqItem]);

  const amount = formData.quantity * formData.rate;

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleRateChange = (value: string) => {
    setRateInput(value);
    const num = parseFloat(value);
    setField("rate", isNaN(num) ? 0 : num);
  };

  const handleQuantityStep = (delta: number) =>
    setField(
      "quantity",
      Math.min(Math.max(1, formData.quantity + delta), rfqItem.quantity),
    );

  const handleQuantityInput = (value: string) => {
    const num = parseInt(value, 10);
    setField("quantity", isNaN(num) ? 1 : num);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (formData.quantity < 1) next.quantity = "Quantity must be at least 1";
    if (formData.rate <= 0) next.rate = "Rate must be greater than 0";
    if (
      formData.offeredAlternative &&
      !formData.alternativeProductDetails?.trim()
    ) {
      next.alternativeProductDetails =
        "Please describe the alternative product";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initialData?.id || `res_item_${Date.now()}`,
      rfqItemId: rfqItem.id,
      productId: rfqItem.productId,
      ...formData,
      amount,
    });
  };

  const handleSheetChange = (index: number) => {
    if (index === -1) onClose();
  };

  return {
    formData,
    setField,
    rateInput,
    handleRateChange,
    handleQuantityStep,
    handleQuantityInput,
    amount,
    errors,
    handleSave,
    handleSheetChange,
  };
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ResponseItemHeader({
  rfqItem,
  isEditing,
  onDismiss,
}: {
  rfqItem: RxRfqItem;
  isEditing: boolean;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const productName =
    useCatalogStore((state) => state.getProduct(rfqItem.productId)?.name) ?? "Unknown product";
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerEyebrow, { color: colors.textSecondary }]}>
          {isEditing ? "Edit response" : "Respond to item"}
        </Text>
        <Text
          style={[styles.headerProduct, { color: colors.text }]}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <View style={styles.headerPills}>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>
              Qty {rfqItem.quantity}
              {rfqItem.uom ? ` ${rfqItem.uom}` : ""}
            </Text>
          </View>
          {rfqItem.allowAlternatives && (
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                Alternatives OK
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onDismiss}
        style={[
          styles.closeButton,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

function QuantityStepper({
  value,
  onStep,
  onInput,
  error,
}: {
  value: number;
  onStep: (delta: number) => void;
  onInput: (value: string) => void;
  error?: string;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View
        style={[
          styles.quantityContainer,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => onStep(-1)}
          style={[
            styles.quantityButton,
            { backgroundColor: colors.backgroundSelected },
          ]}
        >
          <MaterialCommunityIcons
            name="minus"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <TextInput
          style={[styles.quantityInput, { color: colors.text }]}
          value={value.toString()}
          onChangeText={onInput}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          onPress={() => onStep(1)}
          style={[
            styles.quantityButton,
            { backgroundColor: colors.backgroundSelected },
          ]}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RxRfqResponseItemModal = forwardRef<
  BottomSheetModal,
  RxRfqResponseItemModalProps
>(({ rfqItem, onClose, onSave, initialData, isEditing = false, facilityId }, ref) => {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ["90%", "95%"], []);

  const {
    formData,
    setField,
    rateInput,
    handleRateChange,
    handleQuantityStep,
    handleQuantityInput,
    amount,
    errors,
    handleSave,
    handleSheetChange,
  } = useResponseItemForm(rfqItem, initialData, onClose, onSave);

  const dismiss = () =>
    (ref as React.RefObject<BottomSheetModal>).current?.dismiss();

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      cornerRadius={20}
      padding={0}
      onChange={handleSheetChange}
      backgroundColor={colors.backgroundSecondary}
    >
      <ResponseItemHeader
        rfqItem={rfqItem}
        isEditing={isEditing}
        onDismiss={dismiss}
      />

      <BottomSheetScrollView>
        <View style={styles.contentContainer}>
          {/* Quantity */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Quantity <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <QuantityStepper
              value={formData.quantity}
              onStep={handleQuantityStep}
              onInput={handleQuantityInput}
              error={errors.quantity}
            />
          </View>

          {/* Unit Rate */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Unit Rate <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <PriceComboBox
              value={rateInput}
              onChange={handleRateChange}
              error={errors.rate}
              facilityId={facilityId}
            />
          </View>

          {/* Line Total */}
          {formData.rate > 0 && formData.quantity > 0 && (
            <View
              style={[
                styles.amountRow,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.amountLabel, { color: colors.textSecondary }]}
              >
                Line Total
              </Text>
              <Text style={[styles.amountValue, { color: colors.text }]}>
                {amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}

          {/* Alternative product */}
          {rfqItem.allowAlternatives && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Offering Alternative Product
              </Text>
              <ActiveCheckbox
                label="This is an alternative to the requested product"
                value={formData.offeredAlternative}
                onChange={(value) => setField("offeredAlternative", value)}
              />
            </View>
          )}

          {formData.offeredAlternative && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                Alternative Product Details{" "}
                <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: errors.alternativeProductDetails
                      ? colors.error
                      : colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.alternativeProductDetails}
                onChangeText={(v) => setField("alternativeProductDetails", v)}
                placeholder="Describe the alternative product..."
                placeholderTextColor={colors.textSecondary}
              />
              {errors.alternativeProductDetails && (
                <Text style={[styles.error, { color: colors.error }]}>
                  {errors.alternativeProductDetails}
                </Text>
              )}
            </View>
          )}

          {/* Comment */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Comments</Text>
            <CommentInput
              value={formData.comment || ""}
              onChange={(v) => setField("comment", v)}
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
              {isEditing ? "Save Changes" : "Add Response"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default RxRfqResponseItemModal;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerContent: { flex: 1, gap: 4 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  headerProduct: { fontSize: 17, fontWeight: "700" },
  headerPills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: "500" },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  section: { width: "100%", gap: 8 },
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
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  amountLabel: { fontSize: 13, fontWeight: "500" },
  amountValue: { fontSize: 16, fontWeight: "600" },
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
