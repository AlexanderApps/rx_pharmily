import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";
import ModernSwitch from "@/shared/components/switch";

interface ShelfLifeSettings {
  minShelfLifeMonths: number;
  strictMinShelfLife: boolean;
}

interface ShelfLifeConfigProps {
  value: ShelfLifeSettings;
  onChange: (value: ShelfLifeSettings) => void;
  maxMonths?: number;
}

const ShelfLifeConfig: React.FC<ShelfLifeConfigProps> = ({
  value,
  onChange,
  maxMonths = 120, // Optional upper safety limit (10 years)
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Safely handle numeric text entries and fallback configurations
  const handleTextChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, ""); // Enforce integers only
    const numericValue =
      cleanText === "" ? 0 : Math.min(parseInt(cleanText, 10), maxMonths);

    onChange({
      ...value,
      minShelfLifeMonths: numericValue,
    });
  };

  const handleToggleChange = (newValue: boolean) => {
    onChange({
      ...value,
      strictMinShelfLife: newValue,
    });
  };

  const displayValue =
    value.minShelfLifeMonths === 0 ? "" : value.minShelfLifeMonths.toString();

  return (
    <View className="rounded-lg gap-4">
      {/* Row 1: Numeric Shelf Life Input Wrapper */}
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold" style={{ color: colors.text, fontFamily: "System" }}>
            Minimum Shelf Life
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary, fontFamily: "System" }}>
            Required remaining storage time
          </Text>
        </View>

        <View
          className="flex-row items-center rounded-md border h-11 w-[90px] px-3"
          style={{
            backgroundColor: isFocused ? colors.backgroundSecondary : colors.backgroundElement,
            borderColor: colors.border,
          }}
        >
          <TextInput
            className="flex-1 text-sm font-medium text-right py-0"
            style={{ color: colors.text, fontFamily: "System", minWidth: 0 }}
            value={displayValue}
            onChangeText={handleTextChange}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Text className="text-sm ml-1 font-medium" style={{ color: colors.textSecondary }}>
            mo
          </Text>
        </View>
      </View>

      {/* Row 2: Strict Enforcement Switch Row */}
      <View className="flex-row items-center justify-between gap-3 py-1">
        <View className="flex-1">
          <Text className="text-sm font-semibold" style={{ color: colors.text, fontFamily: "System" }}>
            Strict Enforcement
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary, fontFamily: "System" }}>
            Reject items below minimum limit
          </Text>
        </View>

        <ModernSwitch
          value={value.strictMinShelfLife}
          onValueChange={handleToggleChange}
          inactiveColor={colors.backgroundElement}
          activeColor={colors.secondary}
        />
      </View>
    </View>
  );
};

export default ShelfLifeConfig;
