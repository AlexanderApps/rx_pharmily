import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import { PostType, PostMedia } from "@/features/posts/types/posts.types";
import MediaPicker from "@/features/posts/components/media-picker";

const MAX_LENGTH = 1000;
const MAX_OPTIONS = 6;
const DURATION_CHOICES: { label: string; hours: number | null }[] = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
  { label: "No limit", hours: null },
];

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const currentUser = useProfileStore((state) => state.user);
  const addPost = usePostsStore((state) => state.addPost);

  const [postType, setPostType] = useState<PostType>("text");
  const [text, setText] = useState("");
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [durationHours, setDurationHours] = useState<number | null>(72);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsSourceUrl, setNewsSourceUrl] = useState("");

  const initials = currentUser.fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);

  const canPost =
    postType === "text"
      ? text.trim().length > 0 || media.length > 0
      : postType === "poll"
        ? question.trim().length > 0 && filledOptions.length >= 2
        : newsTitle.trim().length > 0 &&
          newsSummary.trim().length > 0 &&
          newsSourceUrl.trim().length > 0;

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!canPost) return;

    if (postType === "poll") {
      if (question.trim().length === 0 || filledOptions.length < 2) {
        Alert.alert(
          "Missing information",
          "Add a question and at least two options."
        );
        return;
      }
      await addPost({
        type: "poll",
        text,
        poll: {
          question,
          options: filledOptions,
          closesAt:
            durationHours != null
              ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
              : undefined,
        },
      });
    } else if (postType === "news") {
      if (
        newsTitle.trim().length === 0 ||
        newsSummary.trim().length === 0 ||
        newsSourceUrl.trim().length === 0
      ) {
        Alert.alert(
          "Missing information",
          "Add a title, summary, and article link."
        );
        return;
      }
      await addPost({
        type: "news",
        text,
        news: {
          title: newsTitle.trim(),
          summary: newsSummary.trim(),
          imageUrl: newsImageUrl.trim() || undefined,
          sourceUrl: newsSourceUrl.trim(),
        },
      });
    } else {
      await addPost({
        type: "text",
        text,
        media: media.length > 0 ? media : undefined,
      });
    }

    router.back();
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <Text className="text-[15px]" style={{ color: colors.text }}>
              Cancel
            </Text>
          </Pressable>
          )}

          <Text
            className="text-base font-bold"
            style={{ color: colors.text }}
          >
            New Post
          </Text>

          <Pressable
            onPress={handlePost}
            disabled={!canPost}
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: canPost
                ? colors.primary
                : colors.backgroundElement,
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: canPost ? "#fff" : colors.textSecondary,
              }}
            >
              Post
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="p-4 gap-3.5"
          keyboardShouldPersistTaps="handled"
        >
          {/* Author */}
          <View className="flex-row items-center gap-2.5">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              <Text className="text-white text-[13px] font-bold">
                {initials}
              </Text>
            </View>
            <View>
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                {currentUser.fullName}
              </Text>
              {currentUser.role ? (
                <Text
                  className="text-[11px] mt-px"
                  style={{ color: colors.textSecondary }}
                >
                  {currentUser.role}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Post type chips */}
          <View className="flex-row gap-2 flex-wrap">
            {(["text", "poll", "news"] as PostType[]).map((type) => {
              const active = postType === type;
              const icon =
                type === "poll"
                  ? "poll"
                  : type === "news"
                    ? "newspaper-variant-outline"
                    : "text-box-outline";
              const label =
                type === "poll" ? "Poll" : type === "news" ? "News" : "Text";

              return (
                <Pressable
                  key={type}
                  onPress={() => setPostType(type)}
                  className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
                  style={{
                    backgroundColor: active
                      ? colors.primary
                      : colors.backgroundElement,
                  }}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={15}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: active ? "#fff" : colors.textSecondary,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Caption / text input */}
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_LENGTH))}
            placeholder={
              postType === "text"
                ? "What's on your mind?"
                : "Add a caption (optional)"
            }
            placeholderTextColor={colors.textSecondary}
            className="text-base leading-[22px] min-h-[60px]"
            style={{ color: colors.text, textAlignVertical: "top" }}
            multiline
            autoFocus={postType === "text"}
          />

          {postType === "text" && (
            <MediaPicker media={media} onChange={setMedia} />
          )}

          {/* Poll section */}
          {postType === "poll" && (
            <View className="gap-1.5">
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                Question <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Ask the community something..."
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-[11px] text-sm"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />

              <Text
                className="text-xs font-semibold mt-3"
                style={{ color: colors.text }}
              >
                Options <Text style={{ color: colors.error }}>*</Text>
              </Text>

              {options.map((option, index) => (
                <View
                  key={index}
                  className="flex-row items-center gap-2 mt-1.5"
                >
                  <TextInput
                    value={option}
                    onChangeText={(v) => updateOption(index, v)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={colors.textSecondary}
                    className="flex-1 border rounded-lg px-3 py-[11px] text-sm"
                    style={{
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />
                  {options.length > 2 && (
                    <Pressable onPress={() => removeOption(index)} hitSlop={8}>
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  )}
                </View>
              ))}

              {options.length < MAX_OPTIONS && (
                <Pressable
                  onPress={addOption}
                  className="flex-row items-center gap-1.5 mt-2.5"
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: colors.primary }}
                  >
                    Add option
                  </Text>
                </Pressable>
              )}

              <Text
                className="text-xs font-semibold mt-3"
                style={{ color: colors.text }}
              >
                Poll duration
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {DURATION_CHOICES.map((choice) => {
                  const active = durationHours === choice.hours;
                  return (
                    <Pressable
                      key={choice.label}
                      onPress={() => setDurationHours(choice.hours)}
                      className="px-3 py-[7px] rounded-full"
                      style={{
                        backgroundColor: active
                          ? colors.primary
                          : colors.backgroundElement,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: active ? "#fff" : colors.textSecondary,
                        }}
                      >
                        {choice.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* News section */}
          {postType === "news" && (
            <View className="gap-1.5">
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                Title <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={newsTitle}
                onChangeText={setNewsTitle}
                placeholder="Article headline"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-[11px] text-sm"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />

              <Text
                className="text-xs font-semibold mt-3"
                style={{ color: colors.text }}
              >
                Summary <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={newsSummary}
                onChangeText={setNewsSummary}
                placeholder="A couple of sentences on what it's about..."
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-[11px] text-sm min-h-20"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlignVertical: "top",
                }}
                multiline
              />

              <Text
                className="text-xs font-semibold mt-3"
                style={{ color: colors.text }}
              >
                Image URL (optional)
              </Text>
              <TextInput
                value={newsImageUrl}
                onChangeText={setNewsImageUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                className="border rounded-lg px-3 py-[11px] text-sm"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />

              <Text
                className="text-xs font-semibold mt-3"
                style={{ color: colors.text }}
              >
                Article Link <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={newsSourceUrl}
                onChangeText={setNewsSourceUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                className="border rounded-lg px-3 py-[11px] text-sm"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />

              <View className="flex-row items-start gap-1.5 mt-3.5">
                <MaterialCommunityIcons
                  name="rss"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text
                  className="text-[11px] flex-1 leading-[15px]"
                  style={{ color: colors.textSecondary }}
                >
                  News posts are added manually for now — pulling these from an
                  RSS feed is planned for later.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="px-4 py-3 gap-1.5">
          {postType === "text" && (
            <Text
              className="text-[11px] text-right"
              style={{ color: colors.textSecondary }}
            >
              {text.length}/{MAX_LENGTH}
            </Text>
          )}
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons
              name="information-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              className="text-[11px] flex-1"
              style={{ color: colors.textSecondary }}
            >
              Visible to everyone in the RxPharmily community
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}