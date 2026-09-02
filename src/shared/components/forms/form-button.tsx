import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { noSelectStyle } from "@/shared/constants/text-selection";

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

    return [variantStyles[variant], isDisabled && { opacity: 0.6 }, style];
  };

  const textColor = variant === "secondary" ? colors.text : "#ffffff";

  return (
    <TouchableOpacity
      className={`py-3 px-4 rounded-md items-center justify-center min-h-11 ${
        isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-90"
      }`}
      style={getButtonStyles()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {isLoading ? (
        <View className="flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color={textColor} />

          <Text className="text-sm font-semibold" style={[{ color: textColor }, noSelectStyle]}>Loading...</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon && (
            <MaterialCommunityIcons name={icon} size={18} color={textColor} />
          )}

          <Text className="text-sm font-semibold" style={[{ color: textColor }, noSelectStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FormButton;

