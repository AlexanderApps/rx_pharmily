import React, { useState } from "react";
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { FaqItem } from "@/features/help/types/help.types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqAccordionItemProps {
  item: FaqItem;
}

const FaqAccordionItem: React.FC<FaqAccordionItemProps> = ({ item }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <Pressable
      onPress={toggle}
      className="rounded-[14px] border p-3.5 gap-2"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between gap-2.5">
        <Text className="text-sm font-semibold flex-1" style={{ color: colors.text }}>{item.question}</Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      {expanded && (
        <Text className="text-[13px] leading-[19px]" style={{ color: colors.textSecondary }}>{item.answer}</Text>
      )}
    </Pressable>
  );
};

export default FaqAccordionItem;

