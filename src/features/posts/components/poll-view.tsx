import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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

// A separate component (rather than inlining this in the .map() below) so
// each option can track its own pressed state independently via
// onPressIn/onPressOut, instead of Pressable's function-form style prop —
// on Android that function form intermittently failed to actually commit
// the borderWidth/borderColor to the native view, leaving the option with
// no visible outline at all even though the same style object renders
// correctly on web.
const PollOptionButton: React.FC<{
  label: string;
  onPress: () => void;
  borderColor: string;
  backgroundColor: string;
  pressedBackgroundColor: string;
  textColor: string;
}> = ({ label, onPress, borderColor, backgroundColor, pressedBackgroundColor, textColor }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.optionButton,
        { borderColor, backgroundColor: pressed ? pressedBackgroundColor : backgroundColor },
      ]}
    >
      <Text className="text-[13px]" style={{ color: textColor, flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
};

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
    <View className="gap-2.5">
      <Text className="text-sm font-semibold" style={{ color: colors.text }}>{poll.question}</Text>

      <View style={{ gap: 8 }}>
        {poll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = poll.votedOptionId === option.id;

          if (!showResults) {
            return (
              <PollOptionButton
                key={option.id}
                label={option.label}
                onPress={() => votePoll(postId, option.id)}
                borderColor={colors.border}
                backgroundColor={colors.backgroundElement}
                pressedBackgroundColor={colors.backgroundSelected}
                textColor={colors.text}
              />
            );
          }

          return (
            <Pressable
              key={option.id}
              onPress={() => !isClosed && votePoll(postId, option.id)}
              disabled={isClosed}
              className="border rounded-[10px] overflow-hidden"
              style={{
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: colors.backgroundElement,
              }}
            >
              <View
                className="absolute top-0 left-0 bottom-0"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isSelected
                    ? colors.primary + "30"
                    : colors.backgroundSecondary,
                }}
              />
              <View className="flex-row items-center justify-between py-2.5 px-3 gap-2">
                <View className="flex-row items-center gap-1.5 flex-1">
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                  <Text
                    className="text-[13px]"
                    style={{ color: colors.text, fontWeight: isSelected ? "700" : "500", flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                </View>
                <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  {pct}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-1">
        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </Text>
        {closeLabel && (
          <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
            · {closeLabel}
          </Text>
        )}
      </View>
    </View>
  );
};

export default PollView;

const styles = StyleSheet.create({
  optionButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
