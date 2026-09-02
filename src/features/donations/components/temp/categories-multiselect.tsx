import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

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
    <View className="w-full">
      <TouchableOpacity
        className="flex-row items-center justify-between px-3 py-3 rounded-md border min-h-12"
        style={{
          backgroundColor: error ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: error ? colors.error : isOpen ? colors.backgroundElement : colors.border,
        }}
        onPress={toggleBottomSheet}
        activeOpacity={0.7}
      >
        {selectedCategories.length > 0 ? (
          <ScrollView
            horizontal
            scrollEnabled={false}
            contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 }}
            showsHorizontalScrollIndicator={false}
          >
            {selectedCategoryObjects.map((category) => (
              <View
                key={category.id}
                className="flex-row items-center px-2.5 py-1.5 rounded gap-1.5"
                style={{ backgroundColor: colors.backgroundSelected }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.text }}>
                  {category.name}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleCategory(category.id)}
                  className="p-0.5"
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
          <Text className="text-sm font-medium flex-1" style={{ color: colors.textSecondary }}>
            Select categories...
          </Text>
        )}
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={error ? colors.error : colors.textSecondary}
          style={isOpen ? { marginLeft: 8, transform: [{ rotate: "180deg" }] } : { marginLeft: 8 }}
        />
      </TouchableOpacity>

      {error && (
        <Text className="text-xs mt-1.5 font-medium" style={{ color: colors.error }}>{error}</Text>
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
        <View className="pb-4 items-center">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            Select Categories
          </Text>
        </View>

        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isChecked = selectedCategories.includes(item.id);
            return (
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-3.5 border-b-[0.5px]"
                style={{
                  borderBottomColor: colors.border,
                  backgroundColor: isChecked ? colors.backgroundElement : "transparent",
                }}
                onPress={() => toggleCategory(item.id)}
                activeOpacity={0.6}
              >
                <Text
                  className="text-sm flex-1"
                  style={{ color: colors.text, fontWeight: isChecked ? "600" : "500" }}
                >
                  {item.name}
                </Text>
                {/* Checkbox moved to the right side 👇 */}
                <View
                  className="w-5 h-5 rounded justify-center items-center ml-3 border-[1.5px]"
                  style={[
                    { borderColor: colors.border },
                    isChecked && { backgroundColor: colors.text, borderColor: colors.text },
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
            className="pt-4 pb-2 items-center border-t-[0.5px]"
            style={{ borderTopColor: colors.border }}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: colors.textSecondary }}
            >
              {selectedCategories.length} selected
            </Text>
          </View>
        )}
      </BottomSheet>
    </View>
  );
};

export default CategoriesMultiSelect;

