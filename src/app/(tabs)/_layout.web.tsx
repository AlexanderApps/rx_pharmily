import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

// import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from "@/shared/components/app-tabs";

export default function TabLayout() {
  const { resolvedTheme } = useTheme();

  return (
    <ThemeProvider value={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}>
      {/*<AnimatedSplashOverlay />*/}
      <AppTabs />
    </ThemeProvider>
  );
}
