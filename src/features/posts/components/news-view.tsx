import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
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
      style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
    >
      {news.imageUrl ? (
        <LoadingImage source={{ uri: news.imageUrl }} style={styles.image} resizeMode="cover" expandable />
      ) : null}

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {news.title}
        </Text>
        <Text
          style={[styles.summary, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {news.summary}
        </Text>

        <View style={styles.sourceRow}>
          <MaterialCommunityIcons
            name="link-variant"
            size={13}
            color={colors.primary}
          />
          <Text style={[styles.sourceText, { color: colors.primary }]} numberOfLines={1}>
            {hostnameFromUrl(news.sourceUrl)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default NewsView;

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: 160 },
  body: { padding: 12, gap: 6 },
  title: { fontSize: 14, fontWeight: "700" },
  summary: { fontSize: 12.5, lineHeight: 18 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  sourceText: { fontSize: 11, fontWeight: "600" },
});
