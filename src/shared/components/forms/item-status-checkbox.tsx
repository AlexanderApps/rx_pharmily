import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface ItemStatusCheckboxProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}

const ItemStatusCheckbox: React.FC<ItemStatusCheckboxProps> = ({
  value,
  onChange,
  label,
  description,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      className="flex-row items-center px-3 py-3 rounded-md border gap-2.5 bg-[#f9fafb] border-[#d1d5db]"
      style={value ? { backgroundColor: colors.success + "15", borderColor: colors.success } : undefined}
      onPress={() => onChange(!value)}
      activeOpacity={0.7}
    >
      <View
        className="w-5 h-5 rounded border-2 items-center justify-center border-[#d1d5db]"
        style={value ? { backgroundColor: colors.success, borderColor: colors.success } : undefined}
      >
        {value && (
          <MaterialCommunityIcons name="check-bold" size={14} color="#fff" />
        )}
      </View>
      <View className="flex-1 gap-0.5">
        {label && (
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>{label}</Text>
        )}
        {description && (
          <Text className="text-xs font-normal" style={{ color: colors.textSecondary }}>
            {description}
          </Text>
        )}
      </View>
      {value && (
        <MaterialCommunityIcons
          name="check-circle"
          size={20}
          color={colors.success}
        />
      )}
    </TouchableOpacity>
  );
};

export default ItemStatusCheckbox;

