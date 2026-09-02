import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface StatusFilterOption {
  key: string;
  label: string;
  count?: number;
}

interface StatusFilterTabsProps {
  options: StatusFilterOption[];
  selected: string;
  onSelect: (key: string) => void;
}

// A single, reusable filter-chip row for admin list screens — new
// screens should reach for this instead of hand-rolling another
// version of the same row, and any visual tweak (spacing, colors,
// active-state styling) only needs to happen once here to apply
// everywhere it's used.
const StatusFilterTabs: React.FC<StatusFilterTabsProps> = ({ options, selected, onSelect }) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="h-[52px] grow-0 shrink-0"
      // NativeWind v4 has documented issues with gap-* and
      // items-center/justify-center inside contentContainerClassName
      // specifically (nativewind/nativewind#671, #700) — kept as a
      // plain style object here rather than risk that bug on a
      // component shared across every admin screen.
      contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
    >
      {options.map((option) => {
        const active = option.key === selected;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            className="flex-row items-center gap-1.5 px-3 py-[7px] rounded-[18px] border"
            style={{
              backgroundColor: active ? colors.primary : colors.backgroundSecondary,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: active ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>
              {option.label}
            </Text>
            {option.count !== undefined && (
              <View
                className="min-w-4 h-4 rounded-lg px-1 items-center justify-center"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.backgroundElement }}
              >
                <Text style={{ color: active ? "#fff" : colors.textSecondary, fontSize: 10, fontWeight: "700" }}>
                  {option.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default StatusFilterTabs;

