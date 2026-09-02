import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { NewsArticle } from "@/features/posts/types/posts.types";
import LoadingImage from "@/shared/components/loading-image";

interface NewsViewProps {
  news: NewsArticle;
}

function hostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const NewsView: React.FC<NewsViewProps> = ({ news }) => {
  const { colors } = useTheme();

  const handleOpen = () => {
    Linking.openURL(news.sourceUrl).catch(() => {});
  };

  return (
    <Pressable
      onPress={handleOpen}
      className="border rounded-xl overflow-hidden"
      style={{ borderColor: colors.border, backgroundColor: colors.backgroundElement }}
    >
      {news.imageUrl ? (
        <LoadingImage source={{ uri: news.imageUrl }} style={{ width: "100%", height: 160 }} resizeMode="cover" expandable />
      ) : null}

      <View className="p-3 gap-1.5">
        <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={2}>
          {news.title}
        </Text>
        <Text
          className="text-[12.5px] leading-[18px]"
          style={{ color: colors.textSecondary }}
          numberOfLines={3}
        >
          {news.summary}
        </Text>

        <View className="flex-row items-center gap-1.5 mt-0.5">
          <MaterialCommunityIcons
            name="link-variant"
            size={13}
            color={colors.primary}
          />
          <Text className="text-[11px] font-semibold" style={{ color: colors.primary }} numberOfLines={1}>
            {hostnameFromUrl(news.sourceUrl)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default NewsView;

