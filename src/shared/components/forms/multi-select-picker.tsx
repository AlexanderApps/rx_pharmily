import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Pressable, Modal, FlatList, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

export interface MultiSelectPickerOption {
  id: string;
  label: string;
}

interface MultiSelectPickerProps {
  title: string;
  options: MultiSelectPickerOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  placeholder?: string;
  emptyMessage?: string;
  searchable?: boolean;
}

// Multiselect sibling of reference-picker.tsx — same centered, scrollable
// Modal shape (see the earlier move away from BottomSheet for these
// reference-data pickers), but toggles stay open across taps instead of
// closing after one selection, and the trigger shows removable chips for
// what's already picked rather than a single label.
const MultiSelectPicker: React.FC<MultiSelectPickerProps> = ({
  title,
  options,
  value,
  onChange,
  error,
  placeholder = "Select",
  emptyMessage = "No entries available.",
  searchable = true,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOptions = useMemo(() => options.filter((o) => value.includes(o.id)), [options, value]);

  const results = useMemo(() => {
    if (!searchable) return options;
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search, searchable]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <View className="w-full">
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between px-3 py-3 rounded-md border min-h-12"
        style={{
          backgroundColor: error ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: error ? colors.error : colors.border,
        }}
      >
        {selectedOptions.length > 0 ? (
          <ScrollView
            horizontal
            scrollEnabled={false}
            contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 }}
            showsHorizontalScrollIndicator={false}
          >
            {selectedOptions.map((option) => (
              <View
                key={option.id}
                className="flex-row items-center px-2.5 py-1.5 rounded gap-1.5"
                style={{ backgroundColor: colors.backgroundSelected }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.text }}>
                  {option.label}
                </Text>
                <TouchableOpacity onPress={() => toggle(option.id)} className="p-0.5" hitSlop={4}>
                  <MaterialCommunityIcons name="close" size={14} color={colors.text} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text className="text-sm font-medium flex-1" style={{ color: colors.textSecondary }}>
            {placeholder}
          </Text>
        )}
        <MaterialCommunityIcons name="chevron-down" size={18} color={error ? colors.error : colors.textSecondary} />
      </Pressable>
      {error && <Text className="text-xs mt-1.5 font-medium" style={{ color: colors.error }}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleClose}>
        <View className="flex-1 items-center justify-center p-6">
          <Pressable className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" onPress={handleClose} />
          <View
            className="w-full max-w-[480px] rounded-2xl p-3.5 gap-2"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-semibold text-center pb-1" style={{ color: colors.text }}>
              {title}
            </Text>

            {searchable && (
              <View
                className="flex-row items-center gap-2 rounded-[10px] px-3 py-[9px]"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
                  placeholderTextColor={colors.textSecondary}
                  className="flex-1 text-sm p-0"
                  style={{ color: colors.text }}
                  autoFocus
                />
              </View>
            )}

            {results.length === 0 ? (
              <Text className="text-[13px] text-center py-6" style={{ color: colors.textSecondary }}>
                {options.length === 0 ? emptyMessage : "No matches."}
              </Text>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 360 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isChecked = value.includes(item.id);
                  return (
                    <Pressable
                      onPress={() => toggle(item.id)}
                      className="flex-row items-center justify-between px-2.5 py-3 rounded-lg gap-2"
                    >
                      <Text className="text-[13px] flex-1" style={{ color: colors.text }} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <View
                        className="w-5 h-5 rounded justify-center items-center border-[1.5px]"
                        style={{
                          borderColor: isChecked ? colors.primary : colors.border,
                          backgroundColor: isChecked ? colors.primary : "transparent",
                        }}
                      >
                        {isChecked && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}

            <Pressable
              onPress={handleClose}
              className="py-3 rounded-md items-center mt-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold text-sm">
                Done{value.length > 0 ? ` (${value.length} selected)` : ""}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MultiSelectPicker;
