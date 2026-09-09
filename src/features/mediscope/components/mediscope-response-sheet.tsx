import React, { forwardRef, useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import SubmitButton from "@/shared/components/submit-button";
import BottomSheet from "@/shared/components/bottom-sheet";
import MyFacilityPicker from "@/shared/components/forms/my-facility-picker";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
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
    const getMyFacilities = useProfileStore((state) => state.getMyFacilities);
    const [availability, setAvailability] = useState<MediscopeAvailability>("full");
    const [selectedFacilityId, setSelectedFacilityId] = useState("");
    const [cost, setCost] = useState("");
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
      setAvailability("full");
      setSelectedFacilityId("");
      setCost("");
      setComment("");
      setError(undefined);
    }, [requestId]);

    const handleBottomSheetChange = (index: number) => {
      if (index === -1) onClose();
    };

    const handleSubmit = async () => {
      const costNumber = Number(cost);
      if (!selectedFacilityId) {
        setError("Let them know where it's available");
        return;
      }
      // vendorFacility is inserted directly as vendor_facility_id, a
      // real `uuid references facilities(id)` foreign key — must stay
      // the actual id. facility_where_available, by contrast, is a
      // genuine `text` column in the DB (not a foreign key), and is
      // rendered as raw text directly on the response card, so
      // resolving it to the facility's name here is correct and keeps
      // that display working exactly as the old free-text field did.
      const facilityName = getMyFacilities().find((f) => f.id === selectedFacilityId)?.name ?? "";
      if (!cost.trim() || Number.isNaN(costNumber) || costNumber < 0) {
        setError("Enter a valid cost");
        return;
      }

      const ok = await onSubmit({
        requestId,
        vendorFacility: selectedFacilityId,
        availability,
        facilityWhereAvailable: facilityName,
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
        title="Respond"
        subtitle={productName}
        snapPoints={["65%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >

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
          <View className="mt-1.5">
            <MyFacilityPicker
              value={selectedFacilityId}
              onChange={setSelectedFacilityId}
              placeholder="Select your facility"
              renderAsModal
            />
          </View>

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

