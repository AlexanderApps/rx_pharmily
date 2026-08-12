import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useConfirmStore } from "@/shared/hooks/use-confirm";
import { useTheme } from "@/shared/hooks/use-theme";

// Mounted once, at the root layout, the same as Toast — every screen
// shares this one instance rather than each confirmation building its
// own Modal from scratch.
const ConfirmDialog: React.FC = () => {
  const { colors } = useTheme();
  const pending = useConfirmStore((state) => state.pending);
  const resolve = useConfirmStore((state) => state.resolve);

  return (
    <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => resolve(false)}>
      <Pressable style={styles.backdrop} onPress={() => resolve(false)}>
        <Pressable style={[styles.card, { backgroundColor: colors.background }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>{pending?.title}</Text>
          {pending?.message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{pending.message}</Text>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => resolve(false)}
              style={[styles.button, { backgroundColor: colors.backgroundElement }]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {pending?.cancelLabel ?? "Cancel"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => resolve(true)}
              style={[
                styles.button,
                { backgroundColor: pending?.destructive ? colors.error : colors.primary },
              ]}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>
                {pending?.confirmLabel ?? "Confirm"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ConfirmDialog;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 16, fontWeight: "700" },
  message: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  button: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonText: { fontSize: 14, fontWeight: "700" },
});
