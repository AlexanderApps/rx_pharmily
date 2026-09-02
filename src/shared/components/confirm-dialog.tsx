import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
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
      <Pressable className="flex-1 items-center justify-center p-6 bg-[rgba(0,0,0,0.45)]" onPress={() => resolve(false)}>
        <Pressable className="w-full max-w-[380px] rounded-2xl p-5" style={{ backgroundColor: colors.background }} onPress={() => {}}>
          <Text className="text-base font-bold" style={{ color: colors.text }}>{pending?.title}</Text>
          {pending?.message ? (
            <Text className="text-[13px] leading-[19px] mt-2" style={{ color: colors.textSecondary }}>{pending.message}</Text>
          ) : null}

          <View className="flex-row gap-2.5 mt-5">
            <Pressable
              onPress={() => resolve(false)}
              className="flex-1 rounded-[10px] py-3 items-center"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {pending?.cancelLabel ?? "Cancel"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => resolve(true)}
              className="flex-1 rounded-[10px] py-3 items-center"
              style={{ backgroundColor: pending?.destructive ? colors.error : colors.primary }}
            >
              <Text className="text-sm font-bold text-white">
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

