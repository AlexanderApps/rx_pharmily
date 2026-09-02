import React from "react";
import { View, Text, Pressable } from "react-native";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  tintColor?: string;
  iconColor?: string;
  onPress?: () => void;
  colors: any;
}

export default function ActionButton({
  icon,
  label,
  tintColor,
  onPress,
  colors,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      // Uses uniform NativeWind press state modifier and elevation shadow utilities
      className="w-[31%] rounded-[16px] border-[0.5px] p-3 items-center justify-center shadow-sm elevation-[1] active:opacity-80"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        shadowColor: colors.text,
        // Match original shadow parameters
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }}
    >
      <View
        className="w-11 h-11 rounded-[12px] items-center justify-center mb-2"
        style={{
          backgroundColor: tintColor ? `${tintColor}18` : colors.backgroundElement,
        }}
      >
        {icon}
      </View>
      
      <Text
        className="text-[13px] font-medium"
        style={{ color: colors.text }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
