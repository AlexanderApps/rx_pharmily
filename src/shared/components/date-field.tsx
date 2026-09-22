import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import dayjs from "dayjs";
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

// Replaces @react-native-community/datetimepicker (native-only — see
// date-field.web.tsx's former comment on why a separate web stand-in
// ever existed) with react-native-ui-datepicker, which genuinely
// supports iOS, Android, and web from the same component — this file
// is now the only DateField implementation; there's no .web.tsx
// variant anymore because none is needed.
//
// Style key names (today, selected, selected_label, day_label, ...)
// come from this library's own UI enum (src/ui.ts as of the installed
// 3.x line) — verified against the actual package source rather than
// assumed, since several stale forks/mirrors of this library's README
// document an entirely different, older individual-props styling API
// (selectedItemColor, calendarTextStyle, etc.) that 3.x no longer uses.
//
// Self-contained: manages its own "is the picker open" state internally,
// so a screen using two of these (a from/to pair) doesn't need to track
// which one is currently open itself.
const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, maximumDate, icon }) => {
  const { colors } = useTheme();
  const defaultStyles = useDefaultStyles();
  const [open, setOpen] = useState(false);

  const handleChange = ({ date }: { date: dayjs.ConfigType }) => {
    onChange(dayjs(date).toDate());
    setOpen(false);
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
        <View
          className="absolute top-full left-0 z-20 mt-1.5 rounded-xl border p-2"
          style={{ backgroundColor: colors.background, borderColor: colors.border, width: 280 }}
        >
          <DateTimePicker
            mode="single"
            date={value ?? new Date()}
            maxDate={maximumDate}
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

export default DateField;
