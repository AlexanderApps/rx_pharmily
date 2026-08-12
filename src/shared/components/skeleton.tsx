import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, DimensionValue } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// A smooth, continuous opacity pulse rather than a moving shimmer gradient
// — simpler to get right, works with useNativeDriver (so it stays smooth
// even under JS-thread load, e.g. while a network request is in flight),
// and is the same pattern most native apps already use for this.
const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
}) => {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.backgroundElement,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
};

export default Skeleton;
