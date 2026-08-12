import React, { useState } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { printOrExportPdf } from "@/shared/utils/pdf";

interface PrintButtonProps {
  // Builds the HTML lazily so the (sometimes non-trivial) document assembly
  // only happens when the user actually taps the button.
  getHtml: () => string;
  fileName: string;
  label?: string;
  // "icon" renders a bare icon button (for a header), "full" renders a
  // labeled pill button (for inline placement in a screen body).
  variant?: "icon" | "full";
}

const PrintButton: React.FC<PrintButtonProps> = ({
  getHtml,
  fileName,
  label = "Print / Export PDF",
  variant = "full",
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await printOrExportPdf(getHtml(), fileName);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <MaterialCommunityIcons name="printer-outline" size={18} color={colors.text} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={[
        styles.fullButton,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <MaterialCommunityIcons name="printer-outline" size={16} color={colors.text} />
      )}
      <Text style={[styles.fullButtonText, { color: colors.text }]}>
        {loading ? "Preparing..." : label}
      </Text>
    </Pressable>
  );
};

export default PrintButton;

const styles = StyleSheet.create({
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  fullButtonText: { fontSize: 13, fontWeight: "600" },
});
