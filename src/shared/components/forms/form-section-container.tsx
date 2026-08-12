import React from "react";
import { View, StyleSheet, Text } from "react-native";
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
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSelected,
          borderLeftColor: colors.backgroundSelected,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
          {required && (
            <Text style={[styles.required, { color: colors.error }]}> *</Text>
          )}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
  },
  header: {
    marginBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  required: {
    fontWeight: "700",
  },
  content: {
    gap: 12,
  },
});

export default FormSectionContainer;
