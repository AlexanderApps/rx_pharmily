import React, {
  useCallback,
  useImperativeHandle,
  useState,
  forwardRef,
} from "react";
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

// Mirrors the native BottomSheet's public shape closely enough that every
// screen calling `ref.current?.present()` / `.dismiss()` works unchanged.
// A drag-up sheet is a mobile idiom — on a facility workstation this
// renders as a proper centered dialog instead, which is what a desktop
// user actually expects.
export interface BottomSheetModalHandle {
  present: () => void;
  dismiss: () => void;
  expand: () => void;
  collapse: () => void;
  snapToIndex: (index: number) => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;

  showHandle?: boolean;
  backgroundColor?: string;
  showBackdrop?: boolean;
  backdropOpacity?: number;
  cornerRadius?: number;
  padding?: number;

  enablePanDownToClose?: boolean;

  onPresent?: () => void;
  onDismiss?: () => void;
  onChange?: (index: number) => void;

  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;

  // Caps the dialog width so it doesn't stretch edge-to-edge on a wide
  // workstation monitor. Most sheets in this app are forms — 560 reads
  // like a deliberate dialog rather than a resized mobile sheet.
  maxWidth?: number;
}

const BottomSheet = forwardRef<BottomSheetModalHandle, BottomSheetProps>(
  (
    {
      children,
      showBackdrop = true,
      backdropOpacity = 0.5,
      backgroundColor,
      cornerRadius = 20,
      padding = 0,
      enablePanDownToClose = true,
      onPresent,
      onDismiss,
      onChange,
      style,
      contentStyle,
      maxWidth = 560,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);

    const open = useCallback(() => {
      setVisible(true);
      onPresent?.();
      onChange?.(0);
    }, [onPresent, onChange]);

    const close = useCallback(() => {
      setVisible(false);
      onDismiss?.();
      onChange?.(-1);
    }, [onDismiss, onChange]);

    useImperativeHandle(
      ref,
      () => ({
        present: open,
        dismiss: close,
        expand: open,
        collapse: close,
        snapToIndex: () => {},
      }),
      [open, close],
    );

    const bgColor = backgroundColor || colors.backgroundSecondary;

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          {showBackdrop && (
            <Pressable
              style={[styles.backdrop, { opacity: backdropOpacity }]}
              onPress={enablePanDownToClose ? close : undefined}
            />
          )}

          <View
            style={[
              styles.card,
              {
                backgroundColor: bgColor,
                borderRadius: cornerRadius,
                maxWidth,
                padding,
              },
              style,
            ]}
          >
            <Pressable onPress={close} style={styles.closeButton} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
            </Pressable>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.scrollContent, contentStyle]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  card: {
    width: "100%",
    maxHeight: "85vh" as any,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.15)",
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingTop: 20, paddingBottom: 20 },
});
