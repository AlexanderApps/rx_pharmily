import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  icon?: string; // unused on web — kept so call sites don't need a platform branch
}

function toInputValue(d: Date | null): string {
  if (!d) return "";
  // Local date components, not toISOString() — that converts to UTC
  // first, which can silently shift the date by a day depending on the
  // person's timezone relative to UTC.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// A native <input type="date"> rather than a hand-built calendar widget —
// @react-native-community/datetimepicker has no web implementation at
// all, and every browser already ships a perfectly good native date
// picker UI for free. This is a deliberately simple stand-in until a
// more considered cross-platform design is worked out.
const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, maximumDate }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      {React.createElement("input", {
        type: "date",
        value: toInputValue(value),
        max: maximumDate ? toInputValue(maximumDate) : undefined,
        placeholder: label,
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
          color: colors.text,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "inherit",
          padding: 0,
          width: 96,
        },
      })}
    </View>
  );
};

export default DateField;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
