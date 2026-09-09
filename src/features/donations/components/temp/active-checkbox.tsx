import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

interface ActiveCheckboxProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  // Defaults to a neutral gray for "off" — right for a genuine
  // active/inactive toggle (5 other consumers use it this way). Only
  // override this where "off" specifically means something more
  // restrictive/negative, like "alternatives not allowed" — see
  // rxrfq-item-modal.tsx, which passes colors.error to match how the
  // items table's own badge already colors this exact field.
  offColor?: string;
}

const ActiveCheckbox: React.FC<ActiveCheckboxProps> = ({
  value,
  onChange,
  label = "Active",
  offColor,
}) => {
  const { colors } = useTheme();
  const inactiveColor = offColor ?? colors.border;

  return (
    <Pressable
      className="flex-row items-center px-4 py-3.5 rounded-lg border-[1.5px]"
      style={({ pressed }) => ({
        backgroundColor: value
          ? colors.success + "15"
          : colors.backgroundElement,
        borderColor: value ? colors.success : inactiveColor,
        opacity: pressed ? 0.9 : 1,
      })}
      onPress={() => onChange(!value)}
    >
      {/* Checkbox (Matches previous square checkbox style guide) */}
      <View
        className="w-5 h-5 rounded items-center justify-center border-[1.5px] mr-3"
        style={{
          borderColor: value ? colors.success : inactiveColor,
          backgroundColor: value ? colors.success : "transparent",
        }}
      >
        {value && (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color={colors.backgroundSecondary} // Sharp vector contrast cut
          />
        )}
      </View>

      {/* Label Text */}
      <Text
        className="text-sm font-semibold flex-1"
        style={{ color: value ? colors.success : colors.textSecondary }}
      >
        {label}
      </Text>

      {/* Modern Pill Badge */}
      {value && (
        <View className="px-2 py-1 rounded-md" style={{ backgroundColor: colors.success }}>
          <Text
            className="text-[10px] font-bold uppercase tracking-[0.5px]"
            style={{ color: colors.backgroundSecondary }}
          >
            Active
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default ActiveCheckbox;

