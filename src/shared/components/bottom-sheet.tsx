import React, { useRef, useCallback, useMemo } from "react";
import { StyleSheet, ViewStyle, StyleProp, Animated } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";

import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedText } from "@/shared/components/themed-text";

export interface BottomSheetModalHandle {
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
      header: {
        paddingHorizontal: padding,
        paddingTop: padding,
        paddingBottom: subtitle ? 8 : padding,
        borderBottomWidth: title ? 1 : 0,
        borderBottomColor: colors.divider,
      },
      title: {
        marginBottom: 4,
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
        {children}
      </BottomSheetModal>
    );
  },
);

// <BottomSheetView style={[{ flex: 1 }, styles.content, contentStyle]}>
//    {/* Header */}
//    {/*{title && (
//      <BottomSheetView style={styles.header}>
//        <ThemedText style={styles.title}>{title}</ThemedText>

//        {subtitle && <ThemedText>{subtitle}</ThemedText>}
//      </BottomSheetView>
//    )}*/}

//    {/* Children */}
//    {children}
//  </BottomSheetView>

BottomSheet.displayName = "BottomSheet";

export default BottomSheet;
