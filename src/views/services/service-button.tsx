import React from "react";
import { Dimensions, Pressable } from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/shared/hooks/use-theme";
// import AppText from "@/shared/components/app-text";
import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";

interface ServiceButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  width?: "full" | "half" | "third";
  disabled?: boolean;
  className?: string;
}

const ServiceButton: React.FC<ServiceButtonProps> = ({
  icon,
  label,
  onPress,
  width = "third",
  disabled = false,
}) => {
  const { colors } = useTheme();

  const screenWidth = Dimensions.get("window").width;

  const padding = 16;
  const gap = 12;

  const getButtonWidth = () => {
    const availableWidth = screenWidth - padding * 2;

    switch (width) {
      case "full":
        return availableWidth;

      case "half":
        return (availableWidth - gap) / 2;

      case "third":
      default:
        return (availableWidth - gap * 2) / 3;
    }
  };

  const buttonWidth = getButtonWidth();

  const buttonHeight = 100;

  const rippleSize = Math.max(buttonWidth, buttonHeight) * 1.5;

  // Animations
  const scale = useSharedValue(1);

  const rippleScale = useSharedValue(0);

  const rippleOpacity = useSharedValue(0);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const rippleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    };
  });

  const animatePress = () => {
    scale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 200,
    });
  };

  const animateRelease = () => {
    scale.value = withSpring(1);
  };

  const triggerRipple = () => {
    rippleScale.value = 0;
    rippleOpacity.value = 0.25;

    rippleScale.value = withTiming(1, {
      duration: 600,
    });

    rippleOpacity.value = withTiming(0, {
      duration: 600,
    });
  };

  const handlePress = () => {
    if (disabled) return;

    triggerRipple();

    onPress();
  };

  const backgroundColor = colors.backgroundElement;

  const rippleColor = colors.backgroundSelected;

  const textColor = colors.textSecondary;

  return (
    <Animated.View
      style={[
        {
          width: buttonWidth,
          height: buttonHeight,
          marginBottom: 12,
        },
        animatedButtonStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={animatePress}
        onPressOut={animateRelease}
        disabled={disabled}
        style={{
          flex: 1,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: disabled ? colors.border : backgroundColor,

          justifyContent: "center",
          alignItems: "center",

          padding: 12,

          // shadowColor: "#000",
          // shadowOffset: {
          //   width: 0,
          //   height: 4,
          // },
          // shadowOpacity: 0.15,
          // shadowRadius: 8,

          // elevation: 4,
        }}
      >
        {/* Ripple */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",

              width: rippleSize,
              height: rippleSize,

              borderRadius: rippleSize / 2,

              backgroundColor: rippleColor,

              alignSelf: "center",
            },
            rippleAnimatedStyle,
          ]}
        />

        {/* Content */}
        <ThemedView
          type="backgroundElement"
          style={{
            zIndex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingHorizontal: 8,
          }}
        >
          <ThemedView
            type="backgroundElement"
            style={{
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {typeof icon === "string" ? (
              <ThemedText
                style={{
                  fontSize: 28,
                  color: textColor,
                }}
              >
                {icon}
              </ThemedText>
            ) : (
              icon
            )}
          </ThemedView>

          <ThemedText
            numberOfLines={1}
            type="small"
            style={{
              opacity: disabled ? 0.5 : 1,
              fontSize: 13,
            }}
          >
            {label}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Animated.View>
  );
};

export default ServiceButton;
