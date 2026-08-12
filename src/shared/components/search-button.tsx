import React from "react";
import {
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "./themed-view";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SearchButtonProps {
  placeholder?: string;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  variant?: "default" | "compact" | "full";
  showIcon?: boolean;
}

const SearchButton: React.FC<SearchButtonProps> = ({
  placeholder = "Search...",
  disabled = false,
  onPress,
  className,
  variant = "default",
  showIcon = true,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  // Animation
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 10,
      mass: 1,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      mass: 1,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;

    // Call custom callback if provided
    if (onPress) {
      onPress();
    } else {
      // Default: navigate to search screen
      // router.push("/(app)/search");
    }
  };

  // // Get dimensions for responsive sizing
  // const screenWidth = Dimensions.get("window").width;
  // const padding = 16;

  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          height: 40,
          paddingHorizontal: 12,
          borderRadius: 12,
        };
      case "full":
        return {
          height: 56,
          paddingHorizontal: 20,
          borderRadius: 16,
        };
      default: // "default"
        return {
          height: 48,
          paddingHorizontal: 16,
          borderRadius: 14,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{
          height: variantStyles.height,
          paddingHorizontal: variantStyles.paddingHorizontal,
          borderRadius: variantStyles.borderRadius,
          backgroundColor: disabled
            ? colors.border
            : isFocused
              ? colors.backgroundElement
              : colors.backgroundElement,
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused ? colors.background : colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: isFocused ? colors.background : "transparent",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isFocused ? 0.15 : 0,
          shadowRadius: 4,
          elevation: isFocused ? 3 : 0,
        }}
      >
        {/* Left content - Icon + Placeholder */}
        <ThemedView
          type="backgroundElement"
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            gap: 10,
          }}
        >
          {showIcon && (
            <ThemedView
              type="backgroundElement"
              style={{
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <MaterialIcons
                name="search"
                size={variant === "compact" ? 16 : 18}
                color={colors.textSecondary}
              />
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={{ flex: 1 }}>
            <ThemedText
              style={{
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {placeholder}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Right content - Shortcut indicator (optional) */}
        {variant === "full" && !disabled && (
          <ThemedView
            type="backgroundElement"
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <ThemedText type="small">
              {Platform.OS === "ios" ? "⌘K" : "Ctrl+K"}
            </ThemedText>
          </ThemedView>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SearchButton;
