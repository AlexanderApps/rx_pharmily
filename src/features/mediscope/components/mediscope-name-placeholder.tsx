import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface MediscopeNamePlaceholderProps {
  product: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  fontSize?: number;
}

// Shown wherever a MediScope request has no photo attached — instead of
// a generic "no image" icon that tells you nothing, this spells out what
// was actually asked for, so the card/detail view still carries real
// information even without a picture.
const MediscopeNamePlaceholder: React.FC<MediscopeNamePlaceholderProps> = ({
  product,
  style,
  className,
  fontSize = 16,
}) => {
  const { colors } = useTheme();

  return (
    <View
      className={`items-center justify-center border px-3.5 ${className ?? ""}`}
      style={[
        {
          backgroundColor: colors.primary + "12",
          borderColor: colors.primary + "22",
        },
        style,
      ]}
    >
      <Text
        className="text-center font-extrabold tracking-wide"
        style={{ color: colors.primary, fontSize }}
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
