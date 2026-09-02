import React, { useState } from "react";
import { Pressable, Text, View, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

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
      className={`rounded-[10px] py-3.5 items-center justify-center ${
        isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-90"
      }`}
      style={[
        // Only set explicitly when disabled — leaving this untouched
        // (rather than an explicit opacity: 1) when enabled means
        // hover:opacity-90 above isn't competing with an inline style for
        // control of the same property, since inline style generally
        // wins that fight in NativeWind regardless of which was more
        // "recently" applied.
        isDisabled && !submitting ? { backgroundColor: bg, opacity: 0.6 } : { backgroundColor: bg },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.primary },
        style,
      ]}
    >
      {submitting ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <MaterialCommunityIcons name={icon} size={15} color={fg} />}
          <Text className="text-[15px] font-semibold" style={[{ color: fg }, noSelectStyle, textStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default SubmitButton;

