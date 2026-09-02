import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface FormButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

const FormButton: React.FC<FormButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  icon,
  style,
}) => {
  const { colors } = useTheme();

  const isDisabled = disabled || isLoading;

  const getButtonStyles = (): StyleProp<ViewStyle> => {
    const variantStyles: Record<
      NonNullable<FormButtonProps["variant"]>,
      ViewStyle
    > = {
      primary: {
        backgroundColor: colors.primary,
      },

      secondary: {
        backgroundColor: colors.backgroundElement,
        borderWidth: 1,
        borderColor: colors.border,
      },

      danger: {
        backgroundColor: colors.error,
      },
    };

    return [
      styles.button,
      variantStyles[variant],
      isDisabled && { opacity: 0.6 },
      style,
    ];
  };

  const textColor = variant === "secondary" ? colors.text : "#ffffff";

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {isLoading ? (
        <View className="flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color={textColor} />

          <Text className="text-sm font-semibold" style={{ color: textColor }}>Loading...</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon && (
            <MaterialCommunityIcons name={icon} size={18} color={textColor} />
          )}

          <Text className="text-sm font-semibold" style={{ color: textColor }}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
});

export default FormButton;

