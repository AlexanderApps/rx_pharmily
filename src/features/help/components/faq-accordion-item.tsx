import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
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
      style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      {expanded && (
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
      )}
    </Pressable>
  );
};

export default FaqAccordionItem;

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  question: { fontSize: 14, fontWeight: "600", flex: 1 },
  answer: { fontSize: 13, lineHeight: 19 },
});
