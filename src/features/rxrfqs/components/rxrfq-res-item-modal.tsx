import React, { useMemo, useState, useEffect, forwardRef } from "react";
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
  // The request's own currency — the response must respect it, not
  // offer a different one. Passed through to PriceComboBox as a
  // read-only display, same as the currency label already shown
  // elsewhere for this response (see rxrfq-res-items-table.tsx, which
  // already receives this from its own parent).
  currency?: string;
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
    <View className="flex-row items-start justify-between px-5 pt-2.5 pb-3.5 border-b gap-3" style={{ borderBottomColor: colors.border }}>
      <View className="flex-1 gap-1">
        <Text className="text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: colors.textSecondary }}>
          {isEditing ? "Edit response" : "Respond to item"}
        </Text>
        <Text
          className="text-[17px] font-bold"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <View className="flex-row flex-wrap gap-1.5 mt-1">
          <View
            className="flex-row items-center gap-1 px-2 py-1 rounded-md border"
            style={{
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={12}
              color={colors.textSecondary}
            />
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              Qty {rfqItem.quantity}
              {rfqItem.uom ? ` ${rfqItem.uom}` : ""}
            </Text>
          </View>
          {rfqItem.allowAlternatives && (
            <View
              className="flex-row items-center gap-1 px-2 py-1 rounded-md border"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={12}
                color={colors.textSecondary}
              />
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                Alternatives OK
              </Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onDismiss}
        className="w-[34px] h-[34px] rounded-full items-center justify-center"
        style={{ backgroundColor: colors.backgroundElement }}
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
        className="flex-row items-center border rounded-lg overflow-hidden"
        style={{
          backgroundColor: colors.backgroundElement,
          borderColor: error ? colors.error : colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => onStep(-1)}
          className="px-4 py-3 items-center justify-center"
          style={{ backgroundColor: colors.backgroundSelected }}
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
          value={value.toString()}
          onChangeText={onInput}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          onPress={() => onStep(1)}
          className="px-4 py-3 items-center justify-center"
          style={{ backgroundColor: colors.backgroundSelected }}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error && (
        <Text className="text-xs font-medium mt-0.5" style={{ color: colors.error }}>{error}</Text>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RxRfqResponseItemModal = forwardRef<
  BottomSheetModal,
  RxRfqResponseItemModalProps
>(({ rfqItem, onClose, onSave, initialData, isEditing = false, facilityId, currency }, ref) => {
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
        <View className="px-5 pt-5 pb-10 gap-5">
          {/* Quantity */}
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
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
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              Unit Rate <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <PriceComboBox
              value={rateInput}
              onChange={handleRateChange}
              error={errors.rate}
              facilityId={facilityId}
              currency={currency}
            />
          </View>

          {/* Line Total */}
          {formData.rate > 0 && formData.quantity > 0 && (
            <View
              className="flex-row justify-between items-center px-3.5 py-3 rounded-lg border"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              }}
            >
              <Text
                className="text-[13px] font-medium"
                style={{ color: colors.textSecondary }}
              >
                Line Total
              </Text>
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}

          {/* Alternative product */}
          {rfqItem.allowAlternatives && (
            <View className="w-full gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
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
            <View className="w-full gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Alternative Product Details{" "}
                <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                className="border rounded-lg px-3 py-3 text-[15px]"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: errors.alternativeProductDetails
                    ? colors.error
                    : colors.border,
                  color: colors.text,
                }}
                value={formData.alternativeProductDetails}
                onChangeText={(v) => setField("alternativeProductDetails", v)}
                placeholder="Describe the alternative product..."
                placeholderTextColor={colors.textSecondary}
              />
              {errors.alternativeProductDetails && (
                <Text className="text-xs font-medium mt-0.5" style={{ color: colors.error }}>
                  {errors.alternativeProductDetails}
                </Text>
              )}
            </View>
          )}

          {/* Comment */}
          <View className="w-full gap-2">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>Comments</Text>
            <CommentInput
              value={formData.comment || ""}
              onChange={(v) => setField("comment", v)}
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
              {isEditing ? "Save Changes" : "Add Response"}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default RxRfqResponseItemModal;
