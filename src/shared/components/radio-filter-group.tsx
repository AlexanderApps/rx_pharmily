import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/shared/components/themed-text";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "./themed-view";

interface RadioFilterGroupProps {
  options: string[];
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
}

export default function RadioFilterGroup({
  options,
  selectedOption,
  onSelectOption,
}: RadioFilterGroupProps) {
  const { colors } = useTheme();

  const isSelected = (option: string) => selectedOption === option;

  return (
    <ThemedView type="backgroundElement" className="w-full">
      {options.map((option) => {
        const selected = isSelected(option);
        return (
          <Pressable
            key={option}
            onPress={() => onSelectOption(option)}
            className="flex-row items-center justify-between py-3.5 px-3 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            {/* Label */}
            <ThemedText>{option}</ThemedText>
            {/* Radio Button */}
            <View
              className="w-6 h-6 rounded-xl border-2 justify-center items-center"
              style={{ borderColor: selected ? colors.icon : colors.border }}
            >
              {selected && (
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.icon }} />
              )}
            </View>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

