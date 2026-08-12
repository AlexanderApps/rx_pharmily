import { View, type ViewProps } from "react-native";

import { ThemeColor } from "@/shared/constants/theme";
import { useTheme } from "@/shared/hooks/use-theme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[{ backgroundColor: colors[type ?? "background"] }, style]}
      {...otherProps}
    />
  );
}
