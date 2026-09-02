import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";

interface ProductComboBoxProps {
  value: string;
  isCustomProduct: boolean;
  onChange: (value: string, isCustomProduct: boolean) => void;
  placeholder?: string;
  error?: string;
}

const ProductComboBox: React.FC<ProductComboBoxProps> = ({
  value,
  isCustomProduct,
  onChange,
  placeholder = "Search products or type your own...",
  error,
}) => {
  const { colors } = useTheme();
  const products = useCatalogStore((state) => state.products);
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [products, value]);

  const showDropdown = focused && value.trim().length > 0 && suggestions.length > 0;

  const handleChangeText = (text: string) => {
    onChange(text, true);
  };

  const handleSelectSuggestion = (name: string) => {
    onChange(name, false);
    setFocused(false);
  };

  return (
    <View>
      <View
        className="flex-row items-center gap-2 border rounded-[10px] px-3 py-[11px]"
        style={{ backgroundColor: colors.backgroundElement, borderColor: error ? colors.error : colors.border }}
      >
        <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          className="flex-1 text-sm p-0"
          style={{ color: colors.text }}
        />
        {value.trim().length > 0 && (
          <Pressable onPress={() => onChange("", true)} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {value.trim().length > 0 && (
        <View className="flex-row items-center gap-[5px] mt-1.5">
          <MaterialCommunityIcons
            name={isCustomProduct ? "pencil-outline" : "check-decagram-outline"}
            size={12}
            color={isCustomProduct ? colors.warning : colors.success}
          />
          <Text className="text-[11px] font-semibold" style={{ color: isCustomProduct ? colors.warning : colors.success }}>
            {isCustomProduct ? "Custom entry — not in the catalog yet" : "Matched to a catalog product"}
          </Text>
        </View>
      )}

      {error && <Text className="text-[11px] mt-1" style={{ color: colors.error }}>{error}</Text>}

      {showDropdown && (
        <View
          className="border rounded-[10px] mt-1.5 overflow-hidden"
          style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item.id}
              onPressIn={() => handleSelectSuggestion(item.name)}
              className="flex-row items-center gap-2 px-3 py-[11px]"
              style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
            >
              <MaterialCommunityIcons name="pill" size={14} color={colors.textSecondary} />
              <Text className="text-[13px] flex-1" style={{ color: colors.text }} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default ProductComboBox;

