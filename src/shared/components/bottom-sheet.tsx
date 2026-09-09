import React, { useRef, useCallback, useMemo } from "react";
import { StyleSheet, ViewStyle, StyleProp, Animated, Pressable, View, Text } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useTheme } from "@/shared/hooks/use-theme";

export interface BottomSheetModalHandle {
  // Use present() to OPEN this sheet — on native, expand() only
  // changes the snap point of an already-presented sheet, it does NOT
  // present a currently-dismissed one, unlike bottom-sheet.web.tsx's
  // version, where expand is explicitly aliased to the same open()
  // function as present() (both just set visible=true there). Calling
  // expand() to open a native sheet silently does nothing — it will
  // work correctly on web and appear completely broken on native.
  present: () => void;
  dismiss: () => void;
  expand: () => void;
  collapse: () => void;
  snapToIndex: (index: number) => void;
}

interface BottomSheetProps {
  children: React.ReactNode;

  // Content
  title?: string;
  subtitle?: string;

  // Sizing & Snapping
  snapPoints?: (number | string)[];
  initialIndex?: number;
  animatedIndex?: Animated.Value;
  animatedPosition?: Animated.Value;

  // Appearance
  showHandle?: boolean;
  backgroundColor?: string;
  showBackdrop?: boolean;
  backdropOpacity?: number;
  cornerRadius?: number;
  padding?: number;

  // Behavior
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  overDragResistanceFactor?: number;
  keyboardBehavior?: "interactive" | "extend" | "fillParent";

  // Animation
  animationConfigs?: any;
  animationDuration?: number;

  // Callbacks
  onPresent?: () => void;
  onDismiss?: () => void;
  onChange?: (index: number) => void;

  // Styling
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  handleStyle?: StyleProp<ViewStyle>;
  handleIndicatorStyle?: StyleProp<ViewStyle>;
}

const BottomSheet = React.forwardRef<BottomSheetModal, BottomSheetProps>(
  (
    {
      children,
      title,
      subtitle,
      showHandle = true,
      snapPoints = ["50%", "90%"],
      initialIndex = 0,
      animatedIndex,
      animatedPosition,
      backgroundColor,
      showBackdrop = true,
      backdropOpacity = 0.5,
      cornerRadius = 24,
      padding = 16,
      enablePanDownToClose = true,
      enableDynamicSizing = false,
      overDragResistanceFactor = 0,
      keyboardBehavior = "interactive",
      animationConfigs,
      animationDuration,
      onPresent,
      onDismiss,
      onChange,
      style,
      contentStyle,
      handleStyle,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const internalRef = useRef<BottomSheetModal>(null);

    const bottomSheetRef =
      (ref as React.RefObject<BottomSheetModal>) || internalRef;

    // Default animation configs
    const defaultAnimationConfigs = useBottomSheetTimingConfigs({
      duration: animationDuration || 500,
    });

    const animationConfig = useMemo(
      () => animationConfigs || defaultAnimationConfigs,
      [animationConfigs, defaultAnimationConfigs],
    );

    // Memoized snap points
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    // Render backdrop
    const renderBackdrop = useCallback(
      (props: any) =>
        showBackdrop ? (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={backdropOpacity}
            pressBehavior="close"
          />
        ) : null,
      [showBackdrop, backdropOpacity],
    );

    const bgColor = backgroundColor || colors.backgroundSecondary;

    const styles = StyleSheet.create({
      modal: {
        backgroundColor: bgColor,
        borderTopLeftRadius: cornerRadius,
        borderTopRightRadius: cornerRadius,
        overflow: "hidden",
      },
      // A real row, in normal layout flow — not absolutely positioned
      // over children. This is the actual fix: the old close button sat
      // at a fixed screen coordinate (top:14, right:14) regardless of
      // what content a given sheet happened to render at that spot, so
      // it could land on top of a title, a form field, anything. This
      // header always renders (even with no title passed at all) so
      // every consumer gets the exact same predictable layout: title
      // left, dismiss button right, and children pushed below — no
      // overlap possible, because there's nothing left for the button
      // to overlap with.
      header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: padding,
        paddingTop: padding,
        paddingBottom: title || subtitle ? 12 : padding,
      },
      titleContainer: {
        flex: 1,
        paddingRight: 12,
        gap: 2,
      },
      title: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.text,
      },
      subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
      },
      content: {
        paddingHorizontal: padding,
        paddingBottom: padding,
      },
      handle: {
        backgroundColor: colors.divider,
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginVertical: 10,
      },
      closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(128,128,128,0.15)",
        // Nudges the button up slightly to optically center it against
        // a multi-line title/subtitle stack, since both sit at
        // alignItems: "flex-start" rather than "center" — flex-start is
        // itself deliberate: "center" would drag a short single-line
        // title down to align with the button's vertical midpoint
        // instead of sitting flush at the top like normal text.
        marginTop: 1,
      },
    });

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={Math.max(
          0,
          Math.min(initialIndex, memoizedSnapPoints.length - 1),
        )}
        snapPoints={memoizedSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        overDragResistanceFactor={overDragResistanceFactor}
        keyboardBehavior={keyboardBehavior}
        animationConfigs={animationConfig}
        onDismiss={onDismiss}
        onChange={onChange}
        // handleIndicatorStyle={
        //   showHandle ? [styles.handle, handleStyle] : { display: "none" }
        // }
        handleIndicatorStyle={{ display: "none" }}
        style={[styles.modal, style]}
        backgroundStyle={{ backgroundColor: backgroundColor }}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <Pressable
            onPress={() => bottomSheetRef.current?.dismiss()}
            style={styles.closeButton}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        {children}
      </BottomSheetModal>
    );
  },
);

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
