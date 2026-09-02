import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
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
        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
        style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border }}
      >
        <MaterialCommunityIcons name={icon} size={14} color={colors.textSecondary} />
        <Text className="text-xs font-semibold" style={{ color: value ? colors.text : colors.textSecondary }}>
          {value ? fmtShortDate(value) : label}
        </Text>
      </Pressable>

      {open && (
        // Android's picker is a native modal dialog regardless of where
        // it sits in the tree, so this positioning only really matters
        // for iOS's inline calendar — but applying it unconditionally
        // is harmless either way and keeps this simple.
        <View
          className="absolute top-full left-0 z-20 mt-1.5 rounded-xl border p-2"
          style={{ backgroundColor: colors.background, borderColor: colors.border }}
        >
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            maximumDate={maximumDate}
            onChange={handleChange}
            {...(Platform.OS === "ios" ? { display: "inline" as const } : {})}
          />
          {Platform.OS === "ios" && (
            <Pressable
              onPress={() => setOpen(false)}
              className="self-center mt-2 px-6 py-2 rounded-[10px]"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-bold text-[13px]">Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

export default DateField;

