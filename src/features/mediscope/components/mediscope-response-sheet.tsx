import React, { forwardRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import SubmitButton from "@/shared/components/submit-button";
import BottomSheet from "@/shared/components/bottom-sheet";
import {
  MediscopeAvailability,
  MediscopeResponseFormData,
} from "@/features/mediscope/types/mediscope.types";

interface MediscopeResponseSheetProps {
  requestId: string;
  productName?: string;
  onSubmit: (data: MediscopeResponseFormData) => boolean | Promise<boolean>;
  onClose: () => void;
}

const MediscopeResponseSheet = forwardRef<BottomSheetModal, MediscopeResponseSheetProps>(
  ({ requestId, productName, onSubmit, onClose }, ref) => {
    const { colors } = useTheme();
    const [availability, setAvailability] = useState<MediscopeAvailability>("full");
    const [facilityWhereAvailable, setFacilityWhereAvailable] = useState("");
    const [cost, setCost] = useState("");
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
      setAvailability("full");
      setFacilityWhereAvailable("");
      setCost("");
      setComment("");
      setError(undefined);
    }, [requestId]);

    const handleBottomSheetChange = (index: number) => {
      if (index === -1) onClose();
    };

    const handleSubmit = async () => {
      const costNumber = Number(cost);
      if (!facilityWhereAvailable.trim()) {
        setError("Let them know where it's available");
        return;
      }
      if (!cost.trim() || Number.isNaN(costNumber) || costNumber < 0) {
        setError("Enter a valid cost");
        return;
      }

      const ok = await onSubmit({
        requestId,
        vendorFacility: facilityWhereAvailable.trim(),
        availability,
        facilityWhereAvailable: facilityWhereAvailable.trim(),
        cost: costNumber,
        currency: "GHS",
        comment: comment.trim() || undefined,
      });
      if (!ok) {
        setError("Couldn't submit this response. Please try again.");
      }
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={["65%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        <View className="px-5 pb-3.5 gap-0.5" style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
          <Text className="text-base font-bold" style={{ color: colors.text }}>Respond</Text>
          {productName && (
            <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {productName}
            </Text>
          )}
        </View>

        <View className="px-5 pt-4 gap-1">
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>Availability</Text>
          <View className="flex-row flex-wrap gap-2 mt-1.5">
            {(["full", "partial"] as MediscopeAvailability[]).map((option) => {
              const active = availability === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setAvailability(option)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{ backgroundColor: active ? colors.success : colors.backgroundElement }}
                >
                  <MaterialCommunityIcons
                    name={option === "full" ? "check-circle-outline" : "circle-half-full"}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                    {option === "full" ? "Fully available" : "Partially available"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Facility where available <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={facilityWhereAvailable}
            onChangeText={setFacilityWhereAvailable}
            placeholder="e.g. Ridge Hospital Pharmacy"
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-[11px] text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Cost (GHS) <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            className="border rounded-lg px-3 py-[11px] text-sm mt-1.5"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
          />

          <Text className="text-xs font-semibold mt-3.5" style={{ color: colors.text }}>
            Comment (optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Any additional detail..."
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-[11px] text-sm mt-1.5 min-h-[70px]"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
            multiline
            textAlignVertical="top"
          />

          {error && <Text className="text-xs font-medium mt-2" style={{ color: colors.error }}>{error}</Text>}

          <SubmitButton
            label="Submit Response"
            onPress={handleSubmit}
            icon="send-outline"
            style={{ marginTop: 16 }}
          />
        </View>
      </BottomSheet>
    );
  },
);

MediscopeResponseSheet.displayName = "MediscopeResponseSheet";

export default MediscopeResponseSheet;

