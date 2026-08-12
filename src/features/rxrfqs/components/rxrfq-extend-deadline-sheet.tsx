import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface RxRfqExtendDeadlineSheetProps {
  currentDeadline: Date;
  onClose: () => void;
  onConfirm: (newDeadline: Date) => void;
}

const PRESETS = [1, 3, 7, 14];

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const RxRfqExtendDeadlineSheet = forwardRef<
  BottomSheetModal,
  RxRfqExtendDeadlineSheetProps
>(({ currentDeadline, onClose, onConfirm }, ref) => {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ["65%"], []);
  const [extraDays, setExtraDays] = useState(3);

  useEffect(() => {
    setExtraDays(3);
  }, [currentDeadline]);

  const newDeadline = useMemo(() => {
    const d = new Date(currentDeadline);
    d.setDate(d.getDate() + extraDays);
    return d;
  }, [currentDeadline, extraDays]);

  const handleBottomSheetChange = (index: number) => {
    if (index === -1) onClose();
  };

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      showHandle
      cornerRadius={20}
      padding={0}
      enablePanDownToClose
      onChange={handleBottomSheetChange}
      backgroundColor={colors.backgroundSecondary}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Extend Submission Deadline
        </Text>
        <TouchableOpacity
          onPress={() =>
            (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
          }
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.dateCard,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
            Current deadline
          </Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>
            {fmtDate(currentDeadline)}
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Extend by</Text>
        <View style={styles.presetRow}>
          {PRESETS.map((days) => {
            const selected = extraDays === days;
            return (
              <TouchableOpacity
                key={days}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: selected
                      ? colors.text
                      : colors.backgroundElement,
                    borderColor: selected ? colors.text : colors.border,
                  },
                ]}
                onPress={() => setExtraDays(days)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    {
                      color: selected
                        ? colors.backgroundSecondary
                        : colors.text,
                    },
                  ]}
                >
                  +{days}d
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.stepperRow,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setExtraDays((d) => Math.max(1, d - 1))}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={styles.stepperCenter}>
            <Text style={[styles.stepperValue, { color: colors.text }]}>
              {extraDays}
            </Text>
            <Text style={[styles.stepperUnit, { color: colors.textSecondary }]}>
              day{extraDays > 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setExtraDays((d) => Math.min(90, d + 1))}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: colors.info + "10",
              borderColor: colors.info + "30",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-check-outline"
            size={18}
            color={colors.info}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewLabel, { color: colors.info }]}>
              New deadline
            </Text>
            <Text style={[styles.previewValue, { color: colors.text }]}>
              {fmtDate(newDeadline)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.text }]}
          onPress={() => onConfirm(newDeadline)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.confirmButtonText,
              { color: colors.backgroundSecondary },
            ]}
          >
            Confirm Extension
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: "700" },
  closeButton: { padding: 4 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    gap: 16,
  },

  dateCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 2 },
  dateLabel: { fontSize: 12, fontWeight: "500" },
  dateValue: { fontSize: 15, fontWeight: "600" },

  label: { fontSize: 14, fontWeight: "600" },
  presetRow: { flexDirection: "row", gap: 8 },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: { fontSize: 13, fontWeight: "600" },

  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  stepperButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCenter: { flex: 1, alignItems: "center" },
  stepperValue: { fontSize: 20, fontWeight: "700" },
  stepperUnit: { fontSize: 12, marginTop: 1 },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  previewValue: { fontSize: 15, fontWeight: "600", marginTop: 2 },

  confirmButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: { fontSize: 16, fontWeight: "600" },
});

export default RxRfqExtendDeadlineSheet;
