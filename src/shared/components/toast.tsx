import React, { useEffect } from "react";
import { Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useToastStore, ToastVariant } from "@/shared/hooks/use-toast";
import { useTheme } from "@/shared/hooks/use-theme";

const VARIANT_ICON: Record<ToastVariant, keyof typeof MaterialCommunityIcons.glyphMap> = {
  success: "check-circle",
  error: "alert-circle",
  info: "information",
};

const DISPLAY_MS = 3000;

// Mounted once, at the root layout — every screen in the app shares this
// one instance rather than each screen managing its own toast state.
// Confirms an action happened without demanding a tap to dismiss the way
// Alert.alert does, and without interrupting whatever the person does
// next (they can keep typing, keep scrolling — it just fades away on
// its own).
const Toast: React.FC = () => {
  const { colors } = useTheme();
  const message = useToastStore((state) => state.message);
  const variant = useToastStore((state) => state.variant);
  const toastKey = useToastStore((state) => state.key);
  const hide = useToastStore((state) => state.hide);

  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) return;

    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    opacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(1, { duration: DISPLAY_MS - 220 }),
      withTiming(0, { duration: 200 }),
    );

    const timer = setTimeout(() => {
      translateY.value = withTiming(40, { duration: 200 });
      hide();
    }, DISPLAY_MS);

    return () => clearTimeout(timer);
    // toastKey (not message) is the dependency — re-showing the same
    // message text should still restart the timer and animation, and
    // key increments on every show() call regardless of content.
  }, [toastKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  const variantColor =
    variant === "success" ? colors.success : variant === "error" ? colors.error : colors.primary;

  return (
    <SafeAreaView style={styles.wrap} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          animatedStyle,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons name={VARIANT_ICON[variant]} size={18} color={variantColor} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>
        <Pressable onPress={hide} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Toast;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 480,
    width: "92%",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { flex: 1, fontSize: 13, fontWeight: "600" },
});
