import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface ProductDropdownProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

const PRODUCTS = [
  { id: "1", name: "Paracetamol 500mg", category: "Medications" },
  { id: "2", name: "Bandages (Box of 100)", category: "Medical Supplies" },
  { id: "3", name: "Surgical Gloves", category: "Medical Supplies" },
  { id: "4", name: "Stethoscope", category: "Equipment" },
  { id: "5", name: "Blood Pressure Monitor", category: "Equipment" },
  { id: "6", name: "IV Drip Stand", category: "Equipment" },
  { id: "7", name: "Thermometer (Digital)", category: "Equipment" },
  { id: "8", name: "Oxygen Mask", category: "Medical Supplies" },
  { id: "9", name: "Antiseptic Solution", category: "Medications" },
  {
    id: "10",
    name: "Hospital Bed Sheets (Set)",
    category: "Linens & Textiles",
  },
];

const ProductDropdown: React.FC<ProductDropdownProps> = ({
  value,
  onChange,
  error,
  placeholder = "Select a product",
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === value),
    [value],
  );

  const filteredProducts = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase()) ||
          p.category.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [searchText],
  );

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (productId: string) => {
    onChange(productId);
    setIsOpen(false);
    setSearchText("");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: error
              ? colors.backgroundSelected
              : colors.backgroundElement,
            borderColor: error
              ? colors.error
              : isOpen
                ? colors.backgroundElement
                : colors.border,
          },
        ]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <Text
            style={[
              styles.buttonText,
              { color: selectedProduct ? colors.text : colors.textSecondary },
            ]}
          >
            {selectedProduct?.name || placeholder}
          </Text>
          {selectedProduct && (
            <Text style={[styles.category, { color: colors.textSecondary }]}>
              {selectedProduct.category}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={error ? colors.error : colors.textSecondary}
          style={[styles.icon, isOpen && styles.iconRotated]}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      {/* Dropdown panel with proper scrolling */}
      {isOpen && (
        <View
          style={[
            styles.dropdownPanel,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Search Input */}
          <View
            style={[
              styles.searchContainer,
              { borderBottomColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Product List with ScrollView for guaranteed scrolling */}
          {filteredProducts.length === 0 ? (
            <View style={styles.noResults}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={32}
                color={colors.border}
              />
              <Text
                style={[styles.noResultsText, { color: colors.textSecondary }]}
              >
                No products found
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listContainer}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              {filteredProducts.map((item) => {
                const isSelected = value === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border },
                      isSelected && {
                        backgroundColor: colors.backgroundElement,
                      },
                    ]}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          isSelected && { fontWeight: "600" },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.categoryTag,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={colors.text}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  category: {
    fontSize: 12,
  },
  icon: {
    marginLeft: 8,
  },
  iconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  dropdownPanel: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 300, // Constrain dropdown height
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  listContainer: {
    maxHeight: 240, // Leave room for search input
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 4,
  },
  noResultsText: {
    fontSize: 13,
    fontWeight: "500",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  optionContent: {
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  optionText: {
    fontSize: 14,
  },
  categoryTag: {
    fontSize: 12,
  },
});

export default ProductDropdown;
