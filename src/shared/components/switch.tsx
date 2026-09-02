import React from "react";
import { Animated, Pressable, ViewStyle } from "react-native";

import { useTheme } from "@/shared/hooks/use-theme";

type ModernSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
};

export default function ModernSwitch({
  value,
  onValueChange,
  disabled = false,
  size = "medium",
  activeColor = "#7C3AED",
  inactiveColor = "#D1D5DB",
  thumbColor = "#FFFFFF",
  style,
}: ModernSwitchProps) {
  const dimensions = {
    small: {
      width: 42,
      height: 24,
      thumb: 18,
      translateX: 18,
    },
    medium: {
      width: 52,
      height: 30,
      thumb: 24,
      translateX: 22,
    },
    large: {
      width: 64,
      height: 36,
      thumb: 30,
      translateX: 28,
    },
  };

  const current = dimensions[size];

  const { colors } = useTheme();

  // const inactiveThemedColor = colors.text === "#ffffff" ? colors.secondary : colors.border;

  const translateAnim = React.useRef(
    new Animated.Value(value ? current.translateX : 0),
  ).current;

  React.useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: value ? current.translateX : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  }, [value]);

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      className="justify-center px-[3px]"
      style={[
        {
          width: current.width,
          height: current.height,
          borderRadius: current.height / 2,
          backgroundColor: value ? activeColor : inactiveColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          },
          {
            width: current.thumb,
            height: current.thumb,
            borderRadius: current.thumb / 2,
            backgroundColor: thumbColor,
            transform: [{ translateX: translateAnim }],
          },
        ]}
      />
    </Pressable>
  );
}

