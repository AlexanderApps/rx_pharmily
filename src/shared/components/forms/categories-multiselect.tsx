import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsFlatList as BottomSheetFlatList } from "@/shared/components/bs/bs-primitives";

interface CategoriesMultiSelectProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  error?: string;
}

const CATEGORIES = [
  { id: "1", name: "Medical Supplies" },
  { id: "2", name: "Medications" },
  { id: "3", name: "Equipment" },
  { id: "4", name: "Consumables" },
  { id: "5", name: "Furniture" },
  { id: "6", name: "Electronics" },
  { id: "7", name: "Linens & Textiles" },
  { id: "8", name: "Diagnostic Tools" },
];

const CategoriesMultiSelect: React.FC<CategoriesMultiSelectProps> = ({
  selectedCategories,
  onChange,
  error,
}) => {
  const { colors } = useTheme();
  const filterModalRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);

  const snapPoints = useMemo(() => ["60%", "85%"], []);

  const selectedCategoryObjects = useMemo(
    () => CATEGORIES.filter((c) => selectedCategories.includes(c.id)),
    [selectedCategories],
  );

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  const toggleBottomSheet = () => {
    if (isOpen) {
      filterModalRef.current?.dismiss();
    } else {
      filterModalRef.current?.present();
    }
  };

  const handleBottomSheetChange = (index: number) => {
    setIsOpen(index !== -1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: error
              ? colors.backgroundSecondary
              : colors.backgroundElement,
            borderColor: error
              ? colors.error
              : isOpen
                ? colors.backgroundElement
                : colors.border,
          },
        ]}
        onPress={toggleBottomSheet}
        activeOpacity={0.7}
      >
        {selectedCategories.length > 0 ? (
          <ScrollView
            horizontal
            scrollEnabled={false}
            style={{ flexGrow: 0, maxHeight: 40 }}
            contentContainerStyle={styles.tagsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {selectedCategoryObjects.map((category) => (
              <View
                key={category.id}
                style={[
                  styles.tag,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>
                  {category.name}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleCategory(category.id)}
                  style={styles.tagCloseButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
            Select categories...
          </Text>
        )}
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

      <BottomSheet
        ref={filterModalRef}
        snapPoints={snapPoints}
        showHandle={true}
        cornerRadius={16}
        padding={20}
        enablePanDownToClose
        onChange={handleBottomSheetChange}
        backgroundColor={colors.backgroundSecondary}
      >
        <View style={{ padding: 20 }}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Categories
            </Text>
          </View>

          <BottomSheetFlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isChecked = selectedCategories.includes(item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    isChecked && { backgroundColor: colors.backgroundElement },
                  ]}
                  onPress={() => toggleCategory(item.id)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.text },
                      isChecked && { fontWeight: "600" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {/* Checkbox moved to the right side 👇 */}
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border },
                      isChecked && {
                        backgroundColor: colors.text,
                        borderColor: colors.text,
                      },
                    ]}
                  >
                    {isChecked && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={colors.backgroundSecondary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {selectedCategories.length > 0 && (
            <View
              style={[
                styles.bottomSheetFooter,
                { borderTopColor: colors.border },
              ]}
            >
              <Text
                style={[styles.selectedCount, { color: colors.textSecondary }]}
              >
                {selectedCategories.length} selected
              </Text>
            </View>
          )}
        </View>
      </BottomSheet>
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
    minHeight: 48,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
    // padding: 16
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  tagCloseButton: {
    padding: 2,
  },
  placeholder: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
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
  bottomSheetHeader: {
    paddingBottom: 16,
    alignItems: "center",
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 24,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // 👈 Spreads text to left and checkbox to right
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12, // 👈 Shifted spacing margin away from right wall
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  bottomSheetFooter: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    borderTopWidth: 0.5,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CategoriesMultiSelect;
