import React, { useEffect } from "react";
import { View, ActivityIndicator, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import AnimatedLogoMark from "@/features/splash/components/animated-logo-mark";

interface SplashScreenProps {
  backgroundColor: string;
  indicatorColor: string;
}

// app/_layout.tsx's loading state (while auth/initial data resolve)
// and, previously, a static LogoMark + ActivityIndicator with no
// relationship between the two — the indicator was visible from the
// very first frame, competing with the logo for attention instead of
// following it.
const SplashScreen: React.FC<SplashScreenProps> = ({ backgroundColor, indicatorColor }) => {
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    // Same ~900ms estimate AnimatedLogoMark uses for when its own
    // entrance has settled — the indicator only appears once that
    // "moment" is over, as a secondary, quieter element rather than
    // something competing with the reveal from frame one.
    indicatorOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({ opacity: indicatorOpacity.value }));

  const containerStyle: ViewStyle = {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor,
    gap: 20,
  };

  return (
    <View style={containerStyle}>
      <AnimatedLogoMark size={72} />
      <Animated.View style={indicatorStyle}>
        <ActivityIndicator size="large" color={indicatorColor} />
      </Animated.View>
    </View>
  );
};

export default SplashScreen;
