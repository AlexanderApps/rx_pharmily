import React, { useState } from "react";
import { Pressable, Text, Modal, View, StyleSheet } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme"; // Update with your actual theme hook path

export const ContextText = ({
  value,
  subtitle,
  definition,
}: {
  value: string;
  subtitle?: string;
  definition: string;
}) => {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  // Use a dedicated primary/accent color if available, or fall back to standard text color
  const highlightedColor = colors.text;

  return (
    <>
      <Pressable
        onLongPress={() => setVisible(true)}
        delayLongPress={500}
        style={({ pressed }) => [
          styles.pressable,
          { borderBottomColor: highlightedColor },
          pressed && styles.pressedState,
        ]}
      >
        <Text style={[styles.valueText, { color: highlightedColor }]}>
          {value}
        </Text>
      </Pressable>

      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.backgroundSecondary || "#fff" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {value}
            </Text>
            {subtitle && (
              <Text style={[styles.modalSubtitle, { color: colors.text }]}>
                {subtitle}
              </Text>
            )}
            <Text
              style={[styles.modalDefinition, { color: colors.textSecondary }]}
            >
              {definition}
            </Text>
            <Text
              style={[styles.closeHint, { color: colors.textSecondary + "A0" }]}
            >
              Tap anywhere to close
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pressable: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  pressedState: {
    opacity: 0.7,
  },
  valueText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "semibold",
    marginBottom: 6,
  },
  modalDefinition: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeHint: {
    marginTop: 15,
    fontSize: 12,
    textAlign: "center",
  },
});
