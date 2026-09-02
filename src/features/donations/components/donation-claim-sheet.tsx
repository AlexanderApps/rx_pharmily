import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import SubmitButton from "@/shared/components/submit-button";
import BottomSheet from "@/shared/components/bottom-sheet";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import { DonationItem, DonationResponseFormData } from "@/features/donations/types/donation.types";

// Same helper as app/donations/donation-market-details.tsx's own
// expiry display — kept local here too rather than shared, matching
// that file's existing (unshared) convention.
const DAY_MS = 24 * 60 * 60 * 1000;
function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

export interface DonationClaimSheetHandle {
  open: () => void;
}

interface DonationClaimSheetProps {
  donationId: string;
  items: DonationItem[];
  onSubmit: (data: DonationResponseFormData) => boolean | Promise<boolean>;
}

type SelectionState = Record<string, { selected: boolean; quantity: string }>;

const DonationClaimSheet = forwardRef<DonationClaimSheetHandle, DonationClaimSheetProps>(
  ({ donationId, items, onSubmit }, ref) => {
    const { colors } = useTheme();
    const modalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["85%"], []);

    const claimableItems = useMemo(() => items.filter((i) => i.isActive), [items]);

    const [selection, setSelection] = useState<SelectionState>({});
    const [responderFacility, setResponderFacility] = useState("");
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | undefined>();

    useImperativeHandle(ref, () => ({
      open: () => {
        setSelection({});
        setResponderFacility("");
        setComment("");
        setError(undefined);
        modalRef.current?.present();
      },
    }));

    const toggleItem = (item: DonationItem) => {
      setSelection((prev) => {
        const current = prev[item.id];
        if (current?.selected) {
          return { ...prev, [item.id]: { selected: false, quantity: current.quantity } };
        }
        return {
          ...prev,
          [item.id]: { selected: true, quantity: String(item.quantity) },
        };
      });
    };

    const updateQuantity = (itemId: string, value: string) => {
      setSelection((prev) => ({
        ...prev,
        [itemId]: { selected: true, quantity: value },
      }));
    };

    const handleSubmit = async () => {
      if (!responderFacility.trim()) {
        setError("Tell them who's claiming these items");
        return;
      }

      const selectedEntries = Object.entries(selection).filter(([, v]) => v.selected);
      if (selectedEntries.length === 0) {
        setError("Select at least one item to claim");
        return;
      }

      const responseItems = [];
      for (const [itemId, value] of selectedEntries) {
        const item = claimableItems.find((i) => i.id === itemId);
        if (!item) continue;
        const qty = Number(value.quantity);
        if (!value.quantity.trim() || Number.isNaN(qty) || qty <= 0) {
          setError(`Enter a valid quantity for ${item.product}`);
          return;
        }
        if (qty > item.quantity) {
          setError(`Only ${item.quantity} available for ${item.product}`);
          return;
        }
        responseItems.push({
          id: "",
          donationItemId: item.id,
          product: item.product,
          requestedQuantity: qty,
        });
      }

      const ok = await onSubmit({
        donationId,
        responderFacility: responderFacility.trim(),
        items: responseItems,
        comment: comment.trim() || undefined,
      });

      if (ok) {
        modalRef.current?.dismiss();
      } else {
        setError("Couldn't submit this claim. Please try again.");
      }
    };

    return (
      <BottomSheet
        ref={modalRef}
        snapPoints={snapPoints}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        backgroundColor={colors.backgroundSecondary}
      >
        <View className="flex-1 flex-col px-5">
          <View className="shrink-0 gap-2.5">
            <Text className="text-base font-bold" style={{ color: colors.text }}>Claim Items</Text>
            <Text className="text-xs -mt-1.5" style={{ color: colors.textSecondary }}>
              Select what you need and how much
            </Text>

            <MyFacilityPicker
              value={responderFacility}
              onChange={setResponderFacility}
              placeholder="Your facility"
              renderAsModal
            />
          </View>

          <ScrollView className="flex-1 mt-3 mb-3" keyboardShouldPersistTaps="handled">
            {claimableItems.map((item) => {
              const entry = selection[item.id];
              const isSelected = !!entry?.selected;
              return (
                <View
                  key={item.id}
                  className="border rounded-xl p-3 gap-2.5 mb-2.5"
                  style={{
                    backgroundColor: colors.backgroundElement,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                >
                  <Pressable
                    onPress={() => toggleItem(item)}
                    className="flex-row items-center gap-2.5"
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                        {item.product}
                      </Text>
                      <Text
                        className="text-[11px] mt-0.5"
                        style={{ color: daysUntil(item.expiryDate) <= 30 ? colors.warning : colors.textSecondary }}
                      >
                        {item.quantity} available
                        {item.batch ? ` · Batch ${item.batch}` : ""}
                        {" · expires "}
                        {new Date(item.expiryDate).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Text>
                    </View>
                  </Pressable>

                  {isSelected && (
                    <View className="flex-row items-center justify-between pl-[30px]">
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        Quantity
                      </Text>
                      <TextInput
                        value={entry.quantity}
                        onChangeText={(v) => updateQuantity(item.id, v)}
                        keyboardType="number-pad"
                        className="w-20 border rounded-lg px-2.5 py-1.5 text-[13px] text-center"
                        style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {claimableItems.length === 0 && (
              <Text className="text-[13px] text-center mt-6" style={{ color: colors.textSecondary }}>
                No claimable items on this donation.
              </Text>
            )}

            <Text className="text-xs font-semibold mt-1" style={{ color: colors.text }}>
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Pickup timing, contact info, etc..."
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-[11px] text-sm min-h-[70px] mt-1.5"
              style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
              multiline
              textAlignVertical="top"
            />

            {error && <Text className="text-xs font-medium mt-2" style={{ color: colors.error }}>{error}</Text>}

            <View style={{ height: 8 }} />
          </ScrollView>

          <SubmitButton
            label="Submit Claim"
            onPress={handleSubmit}
            icon="hand-heart-outline"
            style={{ flexShrink: 0, marginBottom: 20 }}
          />
        </View>
      </BottomSheet>
    );
  },
);

DonationClaimSheet.displayName = "DonationClaimSheet";

export default DonationClaimSheet;

