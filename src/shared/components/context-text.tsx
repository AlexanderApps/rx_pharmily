import React, { useState } from "react";
import { Pressable, Text, Modal, View } from "react-native";
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
        className="border-b self-start"
        style={({ pressed }) => ({
          borderBottomColor: highlightedColor,
          borderStyle: "dashed",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text className="text-[13px] font-bold" style={{ color: highlightedColor }}>
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
          className="flex-1 items-center justify-center bg-[rgba(0,0,0,0.5)]"
          onPress={() => setVisible(false)}
        >
          <View
            className="w-4/5 rounded-xl p-5"
            style={{
              backgroundColor: colors.backgroundSecondary || "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
              {value}
            </Text>
            {subtitle && (
              <Text className="text-base font-semibold mb-1.5" style={{ color: colors.text }}>
                {subtitle}
              </Text>
            )}
            <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
              {definition}
            </Text>
            <Text className="mt-[15px] text-xs text-center" style={{ color: colors.textSecondary + "A0" }}>
              Tap anywhere to close
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

