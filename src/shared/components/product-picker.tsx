import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, FlatList, Alert } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";

interface ProductPickerProps {
  value?: string;
  onChange: (productId: string) => void;
  error?: string;
  placeholder?: string;
}

const ProductPicker: React.FC<ProductPickerProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select a product",
}) => {
  const { colors } = useTheme();
  const products = useCatalogStore((state) => state.products);
  const submitFormularyRequest = useCatalogStore((state) => state.submitFormularyRequest);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = products.find((p) => p.id === value);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const exactMatchExists = results.some((p) => p.name.toLowerCase() === search.trim().toLowerCase());

  const handleSelect = (productId: string) => {
    onChange(productId);
    setOpen(false);
    setSearch("");
  };

  const handleRequestNew = () => {
    const name = search.trim();
    submitFormularyRequest({ productName: name });
    setOpen(false);
    setSearch("");
    Alert.alert(
      "Submitted for review",
      `"${name}" was sent to be added to the catalog. You'll be notified once it's reviewed — pick an existing product for now if you need one today.`,
    );
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between border rounded-lg px-3 py-[11px]"
        style={{ backgroundColor: colors.backgroundElement, borderColor: error ? colors.error : colors.border }}
      >
        <Text
          className="text-sm flex-1"
          style={{ color: selected ? colors.text : colors.textSecondary }}
          numberOfLines={1}
        >
          {selected ? selected.name : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      {error && <Text className="text-xs mt-1" style={{ color: colors.error }}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 items-center justify-center p-6">
          <Pressable className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" onPress={() => setOpen(false)} />
          <View className="w-full max-w-[480px] rounded-2xl p-3.5 gap-2" style={{ backgroundColor: colors.backgroundSecondary }}>
            <View className="flex-row items-center gap-2 rounded-[10px] px-3 py-[9px]" style={{ backgroundColor: colors.backgroundElement }}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search products..."
                placeholderTextColor={colors.textSecondary}
                className="flex-1 text-sm p-0"
                style={{ color: colors.text }}
                autoFocus
              />
            </View>

            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                search.trim().length > 0 && !exactMatchExists ? (
                  <Pressable
                    onPress={handleRequestNew}
                    className="flex-row items-center justify-between gap-2 px-2.5 py-3 rounded-lg"
                    style={{ backgroundColor: colors.backgroundElement }}
                  >
                    <MaterialCommunityIcons name="clipboard-plus-outline" size={16} color={colors.primary} />
                    <Text className="text-[13px] flex-1" style={{ color: colors.primary }} numberOfLines={1}>
                      Request "{search.trim()}" be added to the catalog
                    </Text>
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  className="flex-row items-center justify-between gap-2 px-2.5 py-3 rounded-lg"
                  style={{ backgroundColor: item.id === value ? colors.backgroundSelected : "transparent" }}
                >
                  <Text className="text-[13px] flex-1" style={{ color: colors.text }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.category && (
                    <Text className="text-[10px]" style={{ color: colors.textSecondary }}>{item.category}</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProductPicker;

