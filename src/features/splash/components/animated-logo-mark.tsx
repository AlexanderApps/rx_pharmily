import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  LOGO_NETWORK_LAYER_SVG,
  LOGO_BRAND_LAYER_SVG,
} from "@/shared/assets/logo-mark";

// See logo-mark.tsx for why this is done once, at module scope, rather
// than inside the component — the source markup is a static constant.
const SANITIZED_NETWORK_SVG = LOGO_NETWORK_LAYER_SVG.replace(/&#xA;/g, " ");
const SANITIZED_BRAND_SVG = LOGO_BRAND_LAYER_SVG.replace(/&#xA;/g, " ");

interface AnimatedLogoMarkProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// The splash/loading-screen counterpart to LogoMark — a two-stage
// reveal (the network connects first, the Rx/cross/pill mark pops into
// its center a beat later) settling into a slow, continuous breathing
// pulse, since app/_layout.tsx's loading screen can be visible for a
// variable stretch while auth and initial data resolve, and a logo
// that goes still the moment the entrance finishes would read as
// frozen rather than "still working" if that takes any longer than
// instant.
//
// Composited from two separately-rendered SvgXml layers (see
// LOGO_NETWORK_LAYER_SVG / LOGO_BRAND_LAYER_SVG in shared/assets/logo-
// mark.ts) stacked via absolute positioning, rather than one SvgXml
// with its internal nodes animated — SvgXml parses a static XML string
// into a single opaque render target, so there's no way to reach a
// path or group inside it from a shared value. Hand-translating the
// whole mark into individual react-native-svg JSX primitives to get
// around that is exactly what LOGO_MARK_SVG's own comment already
// flags as easy to get subtly wrong across a dozen gradient stops and
// grouped transforms — animating two already-verified, complete SVG
// documents as whole layers avoids that risk entirely.
const AnimatedLogoMark: React.FC<AnimatedLogoMarkProps> = ({ size = 96, style }) => {
  const networkOpacity = useSharedValue(0);
  const networkScale = useSharedValue(0.85);
  const brandOpacity = useSharedValue(0);
  const brandScale = useSharedValue(0.6);
  const breathScale = useSharedValue(1);

  useEffect(() => {
    networkOpacity.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    networkScale.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });

    brandOpacity.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    brandScale.value = withDelay(200, withSpring(1, { damping: 9, stiffness: 120, mass: 0.6 }));

    // Starts once the entrance has had time to settle (~900ms covers
    // the network's 550ms plus the brand layer's 200ms delay + its own
    // settle time), not chained off the entrance animations' own
    // completion callbacks — this is a fixed, generous estimate rather
    // than something that has to track exactly when withSpring finishes.
    breathScale.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.035, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));
  const networkStyle = useAnimatedStyle(() => ({
    opacity: networkOpacity.value,
    transform: [{ scale: networkScale.value }],
  }));
  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ scale: brandScale.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, breathStyle, style]}>
      <Animated.View style={[{ position: "absolute", width: size, height: size }, networkStyle]}>
        <SvgXml xml={SANITIZED_NETWORK_SVG} width={size} height={size} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", width: size, height: size }, brandStyle]}>
        <SvgXml xml={SANITIZED_BRAND_SVG} width={size} height={size} />
      </Animated.View>
    </Animated.View>
  );
};

export default AnimatedLogoMark;
