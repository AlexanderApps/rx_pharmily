import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import dayjs from "dayjs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  format?: "short" | "long";
  error?: string;
}

// Replaces @react-native-community/datetimepicker (native-only — see
// date-picker.web.tsx's former comment on why a separate web stand-in
// ever existed) with react-native-ui-datepicker, which genuinely
// supports iOS, Android, and web from the same component — this file
// is now the only DatePicker implementation; there's no .web.tsx
// variant anymore because none is needed.
//
// Style key names (today, selected, selected_label, day_label, ...)
// come from this library's own UI enum (src/ui.ts as of the installed
// 3.x line) — verified against the actual package source rather than
// assumed, since several stale forks/mirrors of this library's README
// document an entirely different, older individual-props styling API
// (selectedItemColor, calendarTextStyle, etc.) that 3.x no longer uses.
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date...",
  format = "short",
  error,
}) => {
  const { colors } = useTheme();
  const defaultStyles = useDefaultStyles();
  const [show, setShow] = useState(false);

  const handleTogglePicker = () => {
    setShow((prev) => !prev);
  };

  const handleChange = ({ date }: { date: dayjs.ConfigType }) => {
    onChange(dayjs(date).toDate());
    setShow(false);
  };

  const formatDate = (date: Date): string => {
    if (format === "long") {
      // Returns format pattern matching: "Tue 5 Jun 2026"
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
      const rawDay = date.toLocaleDateString("en-US", { day: "2-digit" });
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.toLocaleDateString("en-US", { year: "numeric" });

      // Strip leading zero by converting string directly to a Number
      const cleanDay = Number(rawDay);

      return `${weekday} ${cleanDay} ${month} ${year}`;
    }

    // Returns format pattern matching: "30/06/2026"
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const hasValue = !!value;

  return (
    <View className="gap-2">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleTogglePicker}
        className="rounded-md border overflow-hidden h-12 flex-row items-center relative"
        style={{
          backgroundColor: show ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: error ? colors.error : colors.border,
        }}
      >
        <Text
          className="flex-1 px-3 text-sm"
          style={{ color: colors.textSecondary, fontFamily: "System" }}
        >
          {hasValue ? formatDate(value) : placeholder}
        </Text>

        <View className="absolute right-3" pointerEvents="none">
          <MaterialCommunityIcons
            name="calendar"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {error && (
        <Text className="text-xs font-medium" style={{ color: colors.error }}>
          {error}
        </Text>
      )}

      {show && (
        <View
          className="rounded-xl border overflow-hidden p-2"
          style={{ backgroundColor: colors.background, borderColor: colors.border }}
        >
          <DateTimePicker
            mode="single"
            date={value || new Date()}
            onChange={handleChange}
            styles={{
              ...defaultStyles,
              today: { borderColor: colors.primary, borderWidth: 1 },
              today_label: { color: colors.primary },
              selected: { backgroundColor: colors.primary, borderColor: colors.primary },
              selected_label: { color: "#ffffff" },
              day_label: { color: colors.text },
              outside_label: { color: colors.textSecondary },
              disabled_label: { color: colors.textSecondary, opacity: 0.4 },
              month_label: { color: colors.text },
              year_label: { color: colors.text },
              weekday_label: { color: colors.textSecondary },
              month_selector_label: { color: colors.text },
              year_selector_label: { color: colors.text },
              button_next_image: { tintColor: colors.text },
              button_prev_image: { tintColor: colors.text },
            }}
          />
        </View>
      )}
    </View>
  );
};

export default DatePicker;
