import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList, Alert } from "react-native";
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
        style={[
          styles.trigger,
          { backgroundColor: colors.backgroundElement, borderColor: error ? colors.error : colors.border },
        ]}
      >
        <Text
          style={[styles.triggerText, { color: selected ? colors.text : colors.textSecondary }]}
          numberOfLines={1}
        >
          {selected ? selected.name : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search products..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
                autoFocus
              />
            </View>

            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              ListFooterComponent={
                search.trim().length > 0 && !exactMatchExists ? (
                  <Pressable
                    onPress={handleRequestNew}
                    style={[styles.resultRow, { backgroundColor: colors.backgroundElement }]}
                  >
                    <MaterialCommunityIcons name="clipboard-plus-outline" size={16} color={colors.primary} />
                    <Text style={[styles.resultText, { color: colors.primary }]} numberOfLines={1}>
                      Request "{search.trim()}" be added to the catalog
                    </Text>
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  style={[
                    styles.resultRow,
                    { backgroundColor: item.id === value ? colors.backgroundSelected : "transparent" },
                  ]}
                >
                  <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.category && (
                    <Text style={[styles.resultCategory, { color: colors.textSecondary }]}>{item.category}</Text>
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

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  triggerText: { fontSize: 14, flex: 1 },
  errorText: { fontSize: 12, marginTop: 4 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { width: "100%", maxWidth: 480, borderRadius: 16, padding: 14, gap: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resultText: { fontSize: 13, flex: 1 },
  resultCategory: { fontSize: 10 },
});
