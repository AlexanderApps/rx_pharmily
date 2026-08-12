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
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isFocused
              ? colors.backgroundSecondary
              : colors.backgroundElement,
            borderColor: isFocused ? colors.border : colors.border,
          },
        ]}
      >
        <TextInput
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
        <View style={styles.stats}>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {wordCount} words
          </Text>
          <Text style={[styles.separator, { color: colors.border }]}>•</Text>
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {charCount}/{maxLength} characters
          </Text>
        </View>

        {charCount > maxLength * 0.8 && (
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentageFull, 100)}%`,
                  backgroundColor:
                    charCount > maxLength * 0.9 ? colors.error : colors.warning,
                },
              ]}
            />
          </View>
        )}
      </View>

      <View
        style={[styles.info, { backgroundColor: colors.backgroundElement }]}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Supports RTF formatting. Markdown support coming soon.
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
    minHeight: 120,
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
    gap: 8,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  separator: {
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "400",
    flex: 1,
  },
});

export default TermsOfServiceInput;
