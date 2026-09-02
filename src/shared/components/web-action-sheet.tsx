import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface WebActionSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: number;
}

// The web counterpart to shared/components/bottom-sheet.tsx (the native
// wrapper around @gorhom/bottom-sheet). A panel sliding up from the
// bottom of a browser window is a touch-first pattern with no real web
// equivalent worth imitating — a centered dialog is what web users
// actually expect, and it's also immune to the exact stacking-context
// bug that a plain position:"absolute" panel hit and got fixed for
// (see shared/components/forms/web-dropdown.tsx's own history) — Modal
// renders in its own top-level layer on both platforms, so nothing on
// the page can paint through it and it can't be painted through either.
//
// Deliberately NOT ref-based like BottomSheetModal (present/dismiss/
// expand/collapse/snapToIndex) — that's a five-method API this doesn't
// try to mirror. Each call site's web branch gets its own `visible`
// boolean state instead, same shape as WebDropdown's own internal
// `open` state. The native branch at each call site keeps using
// BottomSheet/BottomSheetModal exactly as it always has, completely
// unaffected by this — see the plan doc's own principle: native usage
// stays untouched, only a web branch gets added alongside it.
const WebActionSheet: React.FC<WebActionSheetProps> = ({
  visible,
  onDismiss,
  children,
  title,
  subtitle,
  maxWidth = 420,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={onDismiss}>
        {/* Swallow taps on the card itself so they don't fall through to
            the backdrop Pressable behind it and dismiss the sheet before
            an inner control's own onPress fires — same reasoning as
            WebDropdown's identical guard around its own panel. */}
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            className="rounded-2xl p-[18px] gap-2.5 self-center w-full"
            style={{ backgroundColor: colors.backgroundSecondary, maxWidth }}
          >
            {title && (
              <View className="gap-0.5 mb-1">
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  {title}
                </Text>
                {subtitle && (
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    {subtitle}
                  </Text>
                )}
              </View>
            )}
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default WebActionSheet;
