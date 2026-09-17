import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";

interface NotFoundScreenProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
}

// A full detail screen's "this record doesn't exist" state — distinct
// from empty-state.tsx, which is a list's empty-state pattern rendered
// inline within an otherwise-normal screen. This is the entire screen's
// content, reached via a stale link, a removed record, or a bad id in
// the URL, so it gets its own SafeAreaView and a way back rather than
// a bare line of text with nothing else on the page.
const NotFoundScreen: React.FC<NotFoundScreenProps> = ({
  icon = "file-question-outline",
  title,
  message,
}) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center px-8 gap-3">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-1"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons name={icon} size={30} color={colors.textSecondary} />
        </View>
        <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>
          {title}
        </Text>
        {message && (
          <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
            {message}
          </Text>
        )}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          className="flex-row items-center gap-1.5 mt-4 px-4 py-2.5 rounded-[10px]"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <MaterialCommunityIcons name="arrow-left" size={16} color={colors.text} />
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Go back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default NotFoundScreen;
