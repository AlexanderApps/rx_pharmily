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
  Text,
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
      title,
      subtitle,
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
            {/* A real row, in normal layout flow — not absolutely
                positioned over the scrollable content below. This was
                the actual bug: the old close button sat at a fixed
                coordinate (top:14, right:14) regardless of what a given
                sheet rendered at that spot, so it could land on top of
                a title or form field. Renders even with no title passed
                at all, so every consumer gets the same predictable
                layout — title left, dismiss right, content pushed
                below — with nothing left for the button to overlap. */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
                {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
              </View>
              <Pressable onPress={close} style={styles.closeButton} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

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
    maxHeight: "85dvh" as any,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.15)",
    marginTop: 1,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingTop: 20, paddingBottom: 20 },
});
