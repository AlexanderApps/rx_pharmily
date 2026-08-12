import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import SubmitButton from "@/shared/components/submit-button";
import BottomSheet from "@/shared/components/bottom-sheet";
import { DonationItem, DonationResponseFormData } from "@/features/donations/types/donation.types";

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
        <View style={styles.sheetBody}>
          <View style={styles.headerBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Claim Items</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select what you need and how much
            </Text>

            <TextInput
              value={responderFacility}
              onChangeText={setResponderFacility}
              placeholder="Your facility name"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
              ]}
            />
          </View>

          <ScrollView style={styles.listBlock} keyboardShouldPersistTaps="handled">
            {claimableItems.map((item) => {
              const entry = selection[item.id];
              const isSelected = !!entry?.selected;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => toggleItem(item)}
                    style={styles.itemTopRow}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                        {item.product}
                      </Text>
                      <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                        {item.quantity} available
                        {item.batch ? ` · Batch ${item.batch}` : ""}
                      </Text>
                    </View>
                  </Pressable>

                  {isSelected && (
                    <View style={styles.qtyRow}>
                      <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>
                        Quantity
                      </Text>
                      <TextInput
                        value={entry.quantity}
                        onChangeText={(v) => updateQuantity(item.id, v)}
                        keyboardType="number-pad"
                        style={[
                          styles.qtyInput,
                          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            {claimableItems.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No claimable items on this donation.
              </Text>
            )}

            <Text style={[styles.label, { color: colors.text, marginTop: 4 }]}>
              Comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Pickup timing, contact info, etc..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
              ]}
              multiline
              textAlignVertical="top"
            />

            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

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

const styles = StyleSheet.create({
  sheetBody: { flex: 1, flexDirection: "column", paddingHorizontal: 20 },
  headerBlock: { flexShrink: 0, gap: 10 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: -6 },
  listBlock: { flex: 1, marginTop: 12, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: { minHeight: 70, marginTop: 6 },
  itemRow: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10, marginBottom: 10 },
  itemTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 11, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 30 },
  qtyLabel: { fontSize: 12 },
  qtyInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: { fontSize: 13, textAlign: "center", marginTop: 24 },
  errorText: { fontSize: 12, fontWeight: "500", marginTop: 8 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
