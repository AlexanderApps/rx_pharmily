import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTheme } from "@/shared/hooks/use-theme";

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const fmtShortDate = (d: Date) =>
  d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

// Self-contained: manages its own "is the picker open" state internally,
// so a screen using two of these (a from/to pair) doesn't need to track
// which one is currently open itself.
const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, maximumDate, icon }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android's picker is a dialog that closes itself after a selection
    // (or cancel) — iOS's stays open until dismissed some other way
    // (the Done button below), so only Android needs this manual close.
    if (Platform.OS === "android") setOpen(false);
    if (selected) onChange(selected);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.chip, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
      >
        <MaterialCommunityIcons name={icon} size={14} color={colors.textSecondary} />
        <Text style={[styles.chipText, { color: value ? colors.text : colors.textSecondary }]}>
          {value ? fmtShortDate(value) : label}
        </Text>
      </Pressable>

      {open && (
        <View style={[styles.popout, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            maximumDate={maximumDate}
            onChange={handleChange}
            {...(Platform.OS === "ios" ? { display: "inline" as const } : {})}
          />
          {Platform.OS === "ios" && (
            <Pressable onPress={() => setOpen(false)} style={[styles.iosDoneButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.iosDoneButtonText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export default DateField;

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  // Android's picker is a native modal dialog regardless of where it
  // sits in the tree, so this positioning only really matters for iOS's
  // inline calendar — but applying it unconditionally is harmless either
  // way and keeps this simple.
  popout: {
    position: "absolute",
    top: "100%",
    left: 0,
    zIndex: 20,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  iosDoneButton: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 10,
  },
  iosDoneButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
