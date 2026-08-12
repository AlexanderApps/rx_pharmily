import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { BsTextInput as BottomSheetTextInput } from "@/shared/components/bs/bs-primitives";

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
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isFocused
              ? colors.backgroundSecondary
              : colors.backgroundElement,
            borderColor: isNearLimit
              ? colors.warning
              : isFocused
                ? colors.border
                : colors.border,
          },
        ]}
      >
        <BottomSheetTextInput
          style={[styles.input, { color: colors.text }]}
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
            style={styles.clearButton}
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

      <View style={styles.footer}>
        <Text
          style={[
            styles.charCount,
            isNearLimit && { color: colors.warning },
            !isNearLimit && { color: colors.textSecondary },
          ]}
        >
          {charCount}/{maxLength}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  inputContainer: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 100,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: "System",
    textAlignVertical: "top",
  },
  clearButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  footer: {
    alignItems: "flex-end",
  },
  charCount: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default CommentInput;
