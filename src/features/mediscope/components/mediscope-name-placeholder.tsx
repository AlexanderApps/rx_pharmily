import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface MediscopeNamePlaceholderProps {
  product: string;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
}

// Shown wherever a MediScope request has no photo attached — instead of
// a generic "no image" icon that tells you nothing, this spells out what
// was actually asked for, so the card/detail view still carries real
// information even without a picture.
const MediscopeNamePlaceholder: React.FC<MediscopeNamePlaceholderProps> = ({
  product,
  style,
  fontSize = 16,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary + "12", borderColor: colors.primary + "22" },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: colors.primary, fontSize }]}
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {product.toUpperCase()}
      </Text>
    </View>
  );
};

export default MediscopeNamePlaceholder;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  text: {
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
