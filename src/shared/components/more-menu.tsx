import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/shared/hooks/use-theme";

type MoreMenuItem = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

type MoreMenuProps = {
  items: MoreMenuItem[];
  iconSize?: number;
  iconColor?: string;
  menuWidth?: number;
  style?: ViewStyle;
};

export default function MoreMenu({
  items,
  iconColor,
  iconSize = 22,
  menuWidth = 220,
  style,
}: MoreMenuProps) {
  const [visible, setVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  const openMenu = () => {
    setVisible(true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const renderedItems = useMemo(
    () =>
      items.map((item, index) => {
        const destructiveColor = item.destructive ? colors.error : colors.text;
        const pressedColor =
          colors.text === "#ffffff"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.05)";

        return (
          <Pressable
            key={`${item.label}-${index}`}
            disabled={item.disabled}
            onPress={() => {
              closeMenu();
              item.onPress?.();
            }}
            className="min-h-[50px] px-4 rounded-[14px] mx-1.5 flex-row items-center"
            style={({ pressed }) => ({
              opacity: item.disabled ? 0.4 : 1,
              backgroundColor: pressed ? pressedColor : "transparent",
            })}
          >
            <View className="flex-row items-center gap-3">
              {item.icon && (
                <Ionicons name={item.icon} size={18} color={destructiveColor} />
              )}

              <Animated.Text
                style={[
                  { fontSize: 15, fontWeight: "500" },
                  { color: destructiveColor },
                ]}
              >
                {item.label}
              </Animated.Text>
            </View>
          </Pressable>
        );
      }),
    [items, colors.text, colors.error],
  );

  return (
    <>
      <Pressable
        onPress={openMenu}
        className="w-[42px] h-[42px] rounded-[14px] justify-center items-center"
        style={style}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={iconSize}
          color={iconColor ?? colors.textSecondary}
        />
      </Pressable>

      <Modal visible={visible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View className="flex-1 justify-start items-end pt-20 pr-4">
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  {
                    borderRadius: 20,
                    paddingVertical: 8,
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 8,
                  },
                  {
                    width: menuWidth,
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                    backgroundColor: colors.backgroundSecondary,
                  },
                ]}
              >
                {renderedItems}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

