import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, FlatList } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

export interface ReferencePickerOption {
  id: string;
  label: string;
}

interface ReferencePickerProps {
  title: string;
  options: ReferencePickerOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  emptyMessage?: string;
  // Client-side filtering only, no server-side search for now — that's
  // a deliberate deferral, not an oversight, since these lists are
  // small enough today (see the default below) that it isn't needed
  // yet. Defaults to true since most of this picker's consumers
  // (categories, units, incoterms, currencies) can plausibly grow past
  // the point where scrolling alone is comfortable — regions is the
  // one exception (Ghana's 16 regions, not the kind of list that grows
  // unpredictably), and passes false explicitly at its call sites.
  searchable?: boolean;
}

// Same shape as shared/components/product-picker.tsx — centered Modal,
// search input, FlatList results (virtualized, unlike a plain
// ScrollView, so this scales to larger lists without rendering
// everything upfront). Generic here since categories, units, regions,
// and currencies are all simple id+label lookups from
// features/reference-data with no special scoping logic (unlike
// MyFacilityPicker, which filters to the current user's own facility
// memberships) — one reusable component covers all of them rather than
// near-duplicate files per reference type.
const ReferencePicker: React.FC<ReferencePickerProps> = ({
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

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  const results = useMemo(() => {
    if (!searchable) return options;
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search, searchable]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <View className="w-full">
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between px-3 py-3 rounded-md border"
        style={{
          backgroundColor: error ? colors.backgroundSecondary : colors.backgroundElement,
          borderColor: error ? colors.error : colors.border,
        }}
      >
        <Text className="text-sm font-medium flex-1" style={{ color: selected ? colors.text : colors.textSecondary }} numberOfLines={1}>
          {selected?.label || placeholder}
        </Text>
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
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = value === item.id;
                  return (
                    <Pressable
                      onPress={() => handleSelect(item.id)}
                      className="flex-row items-center justify-between gap-2 px-2.5 py-3 rounded-lg"
                      style={{ backgroundColor: isSelected ? colors.backgroundSelected : "transparent" }}
                    >
                      <Text className="text-[13px] flex-1" style={{ color: colors.text }} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ReferencePicker;
