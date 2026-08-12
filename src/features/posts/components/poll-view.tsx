import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { Poll } from "@/features/posts/types/posts.types";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";

interface PollViewProps {
  postId: string;
  poll: Poll;
}

function timeLeftLabel(closesAt?: Date) {
  if (!closesAt) return null;
  const ms = closesAt.getTime() - Date.now();
  if (ms <= 0) return "Poll closed";
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h left`;
  return `${Math.round(hours / 24)}d left`;
}

const PollView: React.FC<PollViewProps> = ({ postId, poll }) => {
  const { colors } = useTheme();
  const votePoll = usePostsStore((state) => state.votePoll);

  const totalVotes = useMemo(
    () => poll.options.reduce((sum, o) => sum + o.voteCount, 0),
    [poll.options],
  );

  const isClosed = !!poll.closesAt && poll.closesAt.getTime() < Date.now();
  const hasVoted = !!poll.votedOptionId;
  const showResults = hasVoted || isClosed;
  const closeLabel = timeLeftLabel(poll.closesAt);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.question, { color: colors.text }]}>{poll.question}</Text>

      <View style={{ gap: 8 }}>
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = poll.votedOptionId === option.id;

          if (!showResults) {
            return (
              <Pressable
                key={option.id}
                onPress={() => votePoll(postId, option.id)}
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed
                      ? colors.backgroundSelected
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={option.id}
              onPress={() => !isClosed && votePoll(postId, option.id)}
              disabled={isClosed}
              style={[
                styles.resultOption,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
            >
              <View
                style={[
                  styles.resultFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: isSelected
                      ? colors.primary + "30"
                      : colors.backgroundSecondary,
                  },
                ]}
              />
              <View style={styles.resultContent}>
                <View style={styles.resultLabelRow}>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.text, fontWeight: isSelected ? "700" : "500" },
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </View>
                <Text style={[styles.pctText, { color: colors.textSecondary }]}>
                  {pct}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </Text>
        {closeLabel && (
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            · {closeLabel}
          </Text>
        )}
      </View>
    </View>
  );
};

export default PollView;

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  question: { fontSize: 14, fontWeight: "600" },
  optionButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionLabel: { fontSize: 13, flexShrink: 1 },
  resultOption: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  resultFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  resultLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  pctText: { fontSize: 12, fontWeight: "600" },
  footerRow: { flexDirection: "row", gap: 4 },
  footerText: { fontSize: 11 },
});
