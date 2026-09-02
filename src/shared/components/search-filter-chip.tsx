import React from "react";
import { Pressable, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface SearchFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  // Tint used when active — defaults to the app's primary accent, but a
  // screen can pass e.g. colors.error for an "urgent" style toggle.
  activeColor?: string;
}

// Same visual language as FilterButton (rounded pill, tinted background +
// colored border when active) but for simple toggle chips that don't open
// a selection sheet — no caret, no badge.
const SearchFilterChip: React.FC<SearchFilterChipProps> = ({
  label,
  active,
  onPress,
  icon,
  activeColor,
}) => {
  const { colors } = useTheme();
  const tint = activeColor ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 border px-3 py-[7px] rounded-full"
      style={{
        backgroundColor: active ? tint + "18" : colors.backgroundElement,
        borderColor: active ? tint : colors.border,
      }}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={active ? tint : colors.textSecondary}
        />
      )}
      <Text
        className="text-xs"
        style={{ color: active ? tint : colors.text, fontWeight: active ? "700" : "600" }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default SearchFilterChip;

