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

      await onSubmit({
        requestId,
        vendorFacility: facilityWhereAvailable.trim(),
        availability,
        facilityWhereAvailable: facilityWhereAvailable.trim(),
        cost: costNumber,
        currency: "GHS",
        comment: comment.trim() || undefined,
      });
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Respond</Text>
          {productName && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {productName}
            </Text>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.text }]}>Availability</Text>
          <View style={styles.chipRow}>
            {(["full", "partial"] as MediscopeAvailability[]).map((option) => {
              const active = availability === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setAvailability(option)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? colors.success : colors.backgroundElement },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option === "full" ? "check-circle-outline" : "circle-half-full"}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {option === "full" ? "Fully available" : "Partially available"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Facility where available <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={facilityWhereAvailable}
            onChangeText={setFacilityWhereAvailable}
            placeholder="e.g. Ridge Hospital Pharmacy"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Cost (GHS) <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
            Comment (optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Any additional detail..."
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

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 4 },
  label: { fontSize: 12, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 70 },
  errorText: { fontSize: 12, fontWeight: "500", marginTop: 8 },
});
