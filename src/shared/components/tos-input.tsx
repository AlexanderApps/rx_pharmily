import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

interface TermsOfServiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const TermsOfServiceInput: React.FC<TermsOfServiceInputProps> = ({
  value,
  onChange,
  placeholder = "Enter terms of service...",
  maxLength = 5000,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = value.length;
  const percentageFull = (charCount / maxLength) * 100;

  return (
    <View className="gap-2">
      <View
        className="rounded-md border overflow-hidden min-h-[120px]"
        style={{
          backgroundColor: isFocused ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: colors.border,
        }}
      >
        <TextInput
          className="flex-1 p-3 text-sm"
          style={{ color: colors.text, fontFamily: "System", textAlignVertical: "top" }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          scrollEnabled
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
        />

        {value.length > 0 && (
          <TouchableOpacity
            className="absolute top-2 right-2 p-1"
            onPress={() => onChange("")}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-end gap-1.5">
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {wordCount} words
          </Text>
          <Text className="text-xs" style={{ color: colors.border }}>•</Text>
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {charCount}/{maxLength} characters
          </Text>
        </View>

        {charCount > maxLength * 0.8 && (
          <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
            <View
              className="h-full"
              style={{
                width: `${Math.min(percentageFull, 100)}%`,
                backgroundColor: charCount > maxLength * 0.9 ? colors.error : colors.warning,
              }}
            />
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-1.5 px-2 py-1.5 rounded" style={{ backgroundColor: colors.backgroundElement }}>
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text className="text-xs font-normal flex-1" style={{ color: colors.textSecondary }}>
          Supports RTF formatting. Markdown support coming soon.
        </Text>
      </View>
    </View>
  );
};

export default TermsOfServiceInput;

