// import React from "react";
// import { View, StyleSheet } from "react-native";
// import { useTheme } from "@/shared/hooks/use-theme";

// interface DatePickerProps {
//   value: Date;
//   onChange: (date: Date) => void;
//   placeholder?: string;
//   format?: "short" | "long";
// }

// function toInputValue(d: Date): string {
//   // Local date components, not toISOString() — that converts through UTC
//   // first, which can silently shift the displayed date by a day
//   // depending on the person's timezone relative to UTC.
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// }

// // @react-native-community/datetimepicker has no web implementation at
// // all — Metro resolves this file for web builds instead of date-picker.tsx,
// // so that native-only import never reaches the web bundle. A real
// // <input type="date"> gives a genuine browser-native calendar picker for
// // free, same approach already used for date-field.web.tsx.
// const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Select date..." }) => {
//   const { colors } = useTheme();

//   return (
//     <View style={[styles.container, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
//       {React.createElement("input", {
//         type: "date",
//         value: toInputValue(value),
//         placeholder,
//         onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
//           const raw = e.target.value;
//           if (!raw) return;
//           const [year, month, day] = raw.split("-").map(Number);
//           onChange(new Date(year, month - 1, day));
//         },
//         style: {
//           border: "none",
//           outline: "none",
//           background: "transparent",
//           color: colors.textSecondary,
//           fontSize: 14,
//           fontFamily: "inherit",
//           padding: "0 12px",
//           height: "100%",
//           width: "100%",
//         },
//       })}
//     </View>
//   );
// };

// export default DatePicker;

// const styles = StyleSheet.create({
//   container: {
//     borderRadius: 6,
//     borderWidth: 1,
//     height: 48,
//     justifyContent: "center",
//   },
// });

// import React, { useState } from "react";
// import { View, Text, TouchableOpacity, Platform } from "react-native";
// import DateTimePicker, {
//   DateTimePickerChangeEvent,
// } from "@react-native-community/datetimepicker";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useTheme } from "@/shared/hooks/use-theme";

// interface DatePickerProps {
//   value: Date;
//   onChange: (date: Date) => void;
//   placeholder?: string;
//   format?: "short" | "long";
// }

// const DatePicker: React.FC<DatePickerProps> = ({
//   value,
//   onChange,
//   placeholder = "Select date...",
//   format = "short",
// }) => {
//   const { colors } = useTheme();
//   const [show, setShow] = useState(false);

//   const handleTogglePicker = () => {
//     setShow((prev) => !prev);
//   };

//   const onDismiss = () => {
//     setShow(false);
//   };

//   const handleChange = (
//     event: DateTimePickerChangeEvent,
//     selectedDate?: Date,
//   ) => {
//     if (Platform.OS === "android") {
//       setShow(false);
//     }
//     if (selectedDate) {
//       onChange(selectedDate);
//     }
//   };

//   const formatDate = (date: Date): string => {
//     if (format === "long") {
//       // Returns format pattern matching: "Tue 5 Jun 2026"
//       const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
//       const rawDay = date.toLocaleDateString("en-US", { day: "2-digit" });
//       const month = date.toLocaleDateString("en-US", { month: "short" });
//       const year = date.toLocaleDateString("en-US", { year: "numeric" });

//       // Strip leading zero by converting string directly to a Number
//       const cleanDay = Number(rawDay);

//       return `${weekday} ${cleanDay} ${month} ${year}`;
//     }

//     // Returns format pattern matching: "30/06/2026"
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   };

//   const hasValue = !!value;

//   return (
//     <View className="gap-2">
//       <TouchableOpacity
//         activeOpacity={0.7}
//         onPress={handleTogglePicker}
//         className="rounded-md border overflow-hidden h-12 flex-row items-center relative"
//         style={{
//           backgroundColor: show ? colors.backgroundSecondary : colors.backgroundElement,
//           borderColor: colors.border,
//         }}
//       >
//         <Text
//           className="flex-1 px-3 text-sm"
//           style={{ color: colors.textSecondary, fontFamily: "System" }}
//         >
//           {hasValue ? formatDate(value) : placeholder}
//         </Text>

//         <View className="absolute right-3" pointerEvents="none">
//           <MaterialCommunityIcons
//             name="calendar"
//             size={20}
//             color={colors.textSecondary}
//           />
//         </View>
//       </TouchableOpacity>

//       {show && (
//         <DateTimePicker
//           testID="dateTimePicker"
//           value={value || new Date()}
//           mode="date"
//           display={Platform.OS === "ios" ? "spinner" : "default"}
//           onValueChange={handleChange}
//           onDismiss={onDismiss}
//         />
//       )}
//     </View>
//   );
// };

// export default DatePicker;

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Platform } from "react-native";
import UIDateTimePicker, { useDefaultStyles } from "react-native-ui-datepicker";
import dayjs from "dayjs";
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
  const defaultStyles = useDefaultStyles();

  const handleTogglePicker = () => {
    setShow((prev) => !prev);
  };

  const handleDateChange = (params: { date: any }) => {
    const selectedDate = dayjs(params.date).toDate();
    onChange(selectedDate);
    setShow(false);
  };

  const formatDate = (date: Date): string => {
    if (format === "long") {
      return dayjs(date).format("ddd D MMM YYYY");
    }
    return dayjs(date).format("DD/MM/YYYY");
  };

  const hasValue = !!value;

  return (
    <View className="gap-2 w-full">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleTogglePicker}
        className="rounded-md border overflow-hidden h-12 flex-row items-center relative w-full"
        style={{
          backgroundColor: show ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: colors.border,
          // Support standard cursor pointer behaviors for web view environments
          ...Platform.select({ web: { cursor: "pointer" } as any }),
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

      <Modal
        visible={show}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShow(false)}
      >
        <TouchableOpacity 
          className="flex-1 justify-center items-center px-4"
          style={{ 
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            // Smooth cursor fallback actions on the dim layout mask
            ...Platform.select({ web: { cursor: "default" } as any })
          }}
          activeOpacity={1}
          onPress={() => setShow(false)}
        >
          {/* Calendar Wrapper: Limited to a clean desktop max-width (400px) */}
          <TouchableOpacity 
            activeOpacity={1} 
            className="w-full rounded-2xl p-5 shadow-2xl border"
            style={{ 
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
              maxWidth: 400, // Hard stop boundary prevents stretching on large web windows
            }}
          >
            <UIDateTimePicker
              mode="single"
              date={dayjs(value || new Date())}
              onChange={handleDateChange}
              styles={{
                ...defaultStyles,
                // Make the cells perfectly circular or softly rounded for premium web aesthetics
                selected: {
                  backgroundColor: colors.primary || "#007AFF",
                  borderRadius: 9999,
                  aspectRatio: 1,
                  justifyContent: "center",
                  alignItems: "center",
                },
                selected_label: {
                  color: "#FFFFFF",
                  fontWeight: "600",
                },
                day: {
                  ...defaultStyles.day,
                  borderRadius: 9999,
                  aspectRatio: 1,
                  justifyContent: "center",
                  alignItems: "center",
                },
                day_label: {
                  color: colors.text || "#000000",
                },
                today: {
                  borderColor: colors.primary || "#007AFF",
                  borderWidth: 1.5,
                  borderRadius: 9999,
                  aspectRatio: 1,
                  justifyContent: "center",
                  alignItems: "center",
                },
                today_label: {
                  color: colors.primary || "#007AFF",
                  fontWeight: "600",
                },
                month_selector_label: {
                  color: colors.text || "#000000",
                  fontWeight: "600",
                },
                year_selector_label: {
                  color: colors.text || "#000000",
                  fontWeight: "600",
                },
                weekday_label: {
                  color: colors.textSecondary || "#666666",
                  fontWeight: "500",
                }
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default DatePicker;
