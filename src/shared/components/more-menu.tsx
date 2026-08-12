import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
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
            style={({ pressed }) => [
              styles.menuItem,
              {
                opacity: item.disabled ? 0.4 : 1,
                backgroundColor: pressed ? pressedColor : "transparent",
              },
            ]}
          >
            <View style={styles.menuItemLeft}>
              {item.icon && (
                <Ionicons name={item.icon} size={18} color={destructiveColor} />
              )}

              <Animated.Text
                style={[
                  styles.menuText,
                  {
                    color: destructiveColor,
                  },
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
      <Pressable onPress={openMenu} style={[styles.triggerButton, style]}>
        <Ionicons
          name="ellipsis-vertical"
          size={iconSize}
          color={iconColor ?? colors.textSecondary}
        />
      </Pressable>

      <Modal visible={visible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuContainer,
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 16,
  },

  triggerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  menuContainer: {
    borderRadius: 20,
    paddingVertical: 8,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 8,
  },

  menuItem: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 6,

    flexDirection: "row",
    alignItems: "center",
  },

  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
