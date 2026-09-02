import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

interface IncotermsDropdownProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

// Was BottomSheet-based (native sheet / bottom-sheet.web.tsx's own
// centered-on-web behavior) — now always a centered, scrollable Modal
// on both platforms, same as reference-picker.tsx's own move for the
// same reason: consistent behavior regardless of platform or nesting,
// rather than the previous native-sheet/web-dialog split.
export const IncotermsDropdown: React.FC<IncotermsDropdownProps> = ({
  value,
  onChange,
  label,
  error,
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  // Reads from the real incoterms reference table — see
  // reference-data.types.ts and the incoterms migration for how this
  // is seeded and kept in sync with what the app actually offers.
  const incotermRows = useReferenceDataStore((state) => state.incoterms);

  const incotermList = useMemo(
    () => incotermRows.map((row) => ({ code: row.code, label: row.label, description: row.description })),
    [incotermRows],
  );

  const selectedOption = useMemo(
    () => incotermList.find((option) => option.code === value) ?? incotermList[0],
    [incotermList, value],
  );

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        className="flex-row items-center justify-between border rounded-[10px] px-3.5 py-3.5"
        style={{ backgroundColor: colors.backgroundElement, borderColor: error ? colors.error : colors.border }}
        onPress={() => setIsOpen((prev) => !prev)}
      >
        <View className="flex-row items-center flex-1 gap-2.5">
          <MaterialCommunityIcons
            name={
              !selectedOption || selectedOption.code === ""
                ? "file-cancel-outline"
                : "truck-cargo-container"
            }
            size={18}
            color={!selectedOption || selectedOption.code === "" ? colors.textSecondary : colors.primary}
          />

          <Text numberOfLines={1} className="flex-1 text-sm font-medium" style={{ color: colors.text }}>
            {selectedOption?.label ?? "Select Incoterm"}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={error ? colors.error : colors.textSecondary}
          style={isOpen ? { marginLeft: 8, transform: [{ rotate: "180deg" }] } : { marginLeft: 8 }}
        />
      </TouchableOpacity>

      {error && (
        <Text className="text-xs" style={{ color: colors.error }}>
          {error}
        </Text>
      )}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={() => setIsOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className="rounded-2xl self-center w-full overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary, maxWidth: 460, maxHeight: "75%" }}
            >
              <View
                className="px-4 py-4"
                style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
              >
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  Select Shipping Incoterm
                </Text>
                <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>
                  Determines delivery responsibility and risk transfer
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {incotermList.map((item) => {
                  const isSelected = value === item.code;
                  return (
                    <Pressable
                      key={item.code || "NONE"}
                      onPress={() => handleSelect(item.code)}
                      className="flex-row items-center justify-between px-4 py-4"
                      style={{
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                        backgroundColor: isSelected ? `${colors.primary}10` : "transparent",
                      }}
                    >
                      <View className="flex-row flex-1 gap-3">
                        <View
                          className="w-[60px] rounded-md items-center justify-center py-[5px] self-start"
                          style={{ backgroundColor: item.code === "" ? colors.border : `${colors.primary}15` }}
                        >
                          <Text
                            className="text-[11px] font-bold"
                            style={{ color: item.code === "" ? colors.textSecondary : colors.primary }}
                          >
                            {item.code || "NONE"}
                          </Text>
                        </View>

                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {item.label}
                          </Text>
                          <Text className="mt-1 text-xs leading-[18px]" style={{ color: colors.textSecondary }}>
                            {item.description}
                          </Text>
                        </View>
                      </View>

                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
