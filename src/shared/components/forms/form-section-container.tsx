import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface FormSectionContainerProps {
  title: string;
  children: React.ReactNode;
  required?: boolean;
  subtitle?: string;
}

const FormSectionContainer: React.FC<FormSectionContainerProps> = ({
  title,
  children,
  required = false,
  subtitle,
}) => {
  const { colors } = useTheme();

  return (
    <View
      className="mb-6 rounded-lg p-4 border-l-4"
      // shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
      // shadowRadius: 2, elevation: 2 — left disabled here, same as before
      style={{
        backgroundColor: colors.backgroundSelected,
        borderLeftColor: colors.backgroundSelected,
        shadowColor: colors.text,
      }}
    >
      <View className="mb-4 gap-1">
        <Text className="text-base font-semibold tracking-[0.3px]" style={{ color: colors.text }}>
          {title}
          {required && (
            <Text className="font-bold" style={{ color: colors.error }}> *</Text>
          )}
        </Text>
        {subtitle && (
          <Text className="text-[13px] font-normal leading-[18px]" style={{ color: colors.textSecondary }}>
            {subtitle}
          </Text>
        )}
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
};

export default FormSectionContainer;
