import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  Platform,
} from "react-native";
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
    <View style={styles.container}>
      {/* Row 1: Numeric Shelf Life Input Wrapper */}
      <View style={styles.fieldRow}>
        <View style={styles.labelContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Minimum Shelf Life
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Required remaining storage time
          </Text>
        </View>

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isFocused
                ? colors.backgroundSecondary
                : colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={displayValue}
            onChangeText={handleTextChange}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Text style={[styles.suffix, { color: colors.textSecondary }]}>
            mo
          </Text>
        </View>
      </View>

      {/* Row 2: Strict Enforcement Switch Row */}
      <View style={[styles.fieldRow, styles.switchPadding]}>
        <View style={styles.labelContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Strict Enforcement
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    gap: 16,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchPadding: {
    paddingVertical: 4,
  },
  labelContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: "System",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    height: 44,
    width: 90,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "System",
    textAlign: "right",
    paddingVertical: 0, // Fix vertical alignment drift on Android
  },
  suffix: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default ShelfLifeConfig;
