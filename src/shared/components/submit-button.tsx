import React, { useState } from "react";
import { Pressable, Text, View, ActivityIndicator, StyleProp, ViewStyle, TextStyle, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface SubmitButtonProps {
  label: string;
  onPress: () => Promise<void> | void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: "primary" | "outline";
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

// The standard "submit this form" button — manages its own loading state
// internally so no screen needs to hand-roll a submitting useState,
// disables itself while the async onPress is in flight (so a double-tap
// can't fire two submissions), and shows a spinner in place of the label
// rather than giving no indication anything is happening at all.
const SubmitButton: React.FC<SubmitButtonProps> = ({
  label,
  onPress,
  disabled,
  style,
  textStyle,
  variant = "primary",
  icon,
}) => {
  const { colors } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const isDisabled = disabled || submitting;

  const handlePress = async () => {
    if (isDisabled) return;
    setSubmitting(true);
    try {
      await onPress();
    } finally {
      setSubmitting(false);
    }
  };

  const bg = variant === "outline" ? "transparent" : isDisabled ? colors.backgroundElement : colors.primary;
  const fg = variant === "outline" ? colors.primary : isDisabled ? colors.textSecondary : "#fff";

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor: bg, opacity: isDisabled && !submitting ? 0.6 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.primary },
        style,
      ]}
    >
      {submitting ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.content}>
          {icon && <MaterialCommunityIcons name={icon} size={15} color={fg} />}
          <Text style={[styles.text, { color: fg }, textStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default SubmitButton;

const styles = StyleSheet.create({
  button: { borderRadius: 10, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { fontSize: 15, fontWeight: "600" },
});
