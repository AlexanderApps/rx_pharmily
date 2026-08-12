import React from "react";
import {
  TouchableOpacity,
  View,
  Animated,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedText } from "@/shared/components/themed-text";

interface FilterButtonProps {
  label: string;
  onPress: () => void;

  disabled?: boolean;

  variant?: "primary" | "secondary" | "outline" | "ghost";

  size?: "small" | "medium" | "large";

  isActive?: boolean;

  // Whether this filter currently has one or more values selected —
  // drives the "highlighted" tinted look, independent of isActive (which
  // just means "this filter's sheet is currently open").
  hasSelectedValues?: boolean;

  badge?: number | string;

  className?: string;

  style?: StyleProp<ViewStyle>;

  textStyle?: StyleProp<TextStyle>;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  onPress,
  disabled = false,
  variant = "outline",
  size = "small",
  isActive = false,
  hasSelectedValues = false,
  badge,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  // Animation for caret
  const rotateAnim = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      damping: 10,
      mass: 1,
    }).start();
  }, [isActive]);

  // A filter reads as "highlighted" once it has a selection, or while its
  // sheet is open — either way it should stand out from idle filters.
  const highlighted = hasSelectedValues || isActive;

  // Dynamic variant styles — each one always returns a legible
  // text/border/background combination in both the idle and highlighted
  // state, regardless of variant.
  const variantStyles = {
    primary: {
      bg: highlighted ? colors.primary : colors.backgroundElement,
      text: highlighted ? "#ffffff" : colors.textSecondary,
      border: "transparent",
    },
    secondary: {
      bg: colors.backgroundSelected,
      text: colors.text,
      border: "transparent",
    },
    outline: {
      bg: highlighted ? colors.primary + "18" : colors.backgroundElement,
      text: highlighted ? colors.primary : colors.text,
      border: highlighted ? colors.primary : colors.border,
    },
    ghost: {
      bg: "transparent",
      text: colors.text,
      border: "transparent",
    },
  };

  const currentVariant = variantStyles[variant];

  // Size styles
  const sizeStyles = {
    small: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      fontSize: 12,
      iconSize: 14,
    },
    medium: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      fontSize: 13,
      iconSize: 15,
    },
    large: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 22,
      fontSize: 14,
      iconSize: 17,
    },
  };

  const currentSize = sizeStyles[size];

  const caretRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
          backgroundColor: currentVariant.bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: currentVariant.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {/* Label */}
        <ThemedText
          style={[
            {
              fontSize: currentSize.fontSize,
              fontWeight: highlighted ? "700" : "600",
              color: currentVariant.text,
            },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>

        {/* Badge */}
        {badge !== undefined && (
          <View
            style={{
              backgroundColor: highlighted ? colors.primary : colors.backgroundSecondary,
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 5,
            }}
          >
            <ThemedText
              style={{
                fontSize: 10,
                color: highlighted ? "#ffffff" : colors.text,
                fontWeight: "700",
                lineHeight: 13,
              }}
            >
              {badge}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Caret */}
      <Animated.View style={{ transform: [{ rotate: caretRotation }] }}>
        <MaterialCommunityIcons
          name="chevron-down"
          size={currentSize.iconSize}
          color={currentVariant.text}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default FilterButton;
