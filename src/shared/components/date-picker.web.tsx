import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  format?: "short" | "long";
}

function toInputValue(d: Date): string {
  // Local date components, not toISOString() — that converts through UTC
  // first, which can silently shift the displayed date by a day
  // depending on the person's timezone relative to UTC.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// @react-native-community/datetimepicker has no web implementation at
// all — Metro resolves this file for web builds instead of date-picker.tsx,
// so that native-only import never reaches the web bundle. A real
// <input type="date"> gives a genuine browser-native calendar picker for
// free, same approach already used for date-field.web.tsx.
const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Select date..." }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {React.createElement("input", {
        type: "date",
        value: toInputValue(value),
        placeholder,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          if (!raw) return;
          const [year, month, day] = raw.split("-").map(Number);
          onChange(new Date(year, month - 1, day));
        },
        style: {
          border: "none",
          outline: "none",
          background: "transparent",
          color: colors.textSecondary,
          fontSize: 14,
          fontFamily: "inherit",
          padding: "0 12px",
          height: "100%",
          width: "100%",
        },
      })}
    </View>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
  },
});
