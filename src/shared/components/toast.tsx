import React, { useEffect } from "react";
import { Text, Pressable } from "react-native";
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
    <SafeAreaView className="absolute left-0 right-0 bottom-0 items-center z-[1000]" pointerEvents="box-none">
      {/* Plain style props, deliberately, not className — NativeWind's
          className support for react-native-reanimated's Animated.View
          has a real, confirmed, version-dependent bug on web (see
          nativewind/nativewind#1181 and
          software-mansion/react-native-reanimated#6665 and #8329):
          className is silently never applied to Animated.View on web
          across multiple Reanimated versions, only patched in
          NativeWind 4.2.0+. This toast rendered with none of its
          layout/visual classes applied at all on web — full-width,
          unstyled, icon/text/close-button stacking instead of a single
          row — before this fix. style props are never affected by this
          issue regardless of which exact NativeWind/Reanimated version
          combination is actually installed, so this is the robust fix,
          not just a version bump that could regress again later. */}
      <Animated.View
        style={[
          animatedStyle,
          {
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
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          },
        ]}
      >
        <MaterialCommunityIcons name={VARIANT_ICON[variant]} size={18} color={variantColor} />
        <Text className="flex-1 text-[13px] font-semibold" style={{ color: colors.text }} numberOfLines={2}>
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

