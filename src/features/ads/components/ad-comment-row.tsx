import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { AdComment } from "@/features/ads/types/ads.types";

interface AdCommentRowProps {
  comment: AdComment;
}

const AdCommentRow: React.FC<AdCommentRowProps> = ({ comment }) => {
  const { colors } = useTheme();
  const initials = comment.author.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: comment.author.avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.topLine}>
          <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
            {comment.author.name}
          </Text>
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {format(comment.createdAt)}
          </Text>
        </View>
        <Text style={[styles.text, { color: colors.text }]}>{comment.text}</Text>
      </View>
    </View>
  );
};

export default AdCommentRow;

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, paddingVertical: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bubble: { flex: 1, borderRadius: 12, padding: 10, gap: 3 },
  topLine: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  authorName: { fontSize: 12, fontWeight: "600", flex: 1 },
  timeAgo: { fontSize: 10 },
  text: { fontSize: 13, lineHeight: 18 },
});
