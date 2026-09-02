import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  placeholder = "Enter comments...",
  maxLength = 2000,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <View className="gap-2">
      <View
        className="rounded-md border overflow-hidden min-h-[100px]"
        style={{
          backgroundColor: isFocused ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: isNearLimit ? colors.warning : colors.border,
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

      <View className="items-end">
        <Text
          className="text-xs font-medium"
          style={{ color: isNearLimit ? colors.warning : colors.textSecondary }}
        >
          {charCount}/{maxLength}
        </Text>
      </View>
    </View>
  );
};

export default CommentInput;

