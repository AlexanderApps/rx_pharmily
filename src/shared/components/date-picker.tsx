import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  format?: "short" | "long";
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date...",
  format = "short",
}) => {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const handleTogglePicker = () => {
    setShow((prev) => !prev);
  };

  const onDismiss = () => {
    setShow(false);
  };

  const handleChange = (
    event: DateTimePickerChangeEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
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
          borderColor: colors.border,
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

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={handleChange}
          onDismiss={onDismiss}
        />
      )}
    </View>
  );
};

export default DatePicker;
