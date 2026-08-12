import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
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
        Alert.alert("Missing information", "Add a question and at least two options.");
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
        Alert.alert("Missing information", "Add a title, summary, and article link.");
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
      await addPost({ type: "text", text, media: media.length > 0 ? media : undefined });
    }

    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Post</Text>
          <Pressable
            onPress={handlePost}
            disabled={!canPost}
            style={[
              styles.postButton,
              { backgroundColor: canPost ? colors.primary : colors.backgroundElement },
            ]}
          >
            <Text
              style={[
                styles.postButtonText,
                { color: canPost ? "#fff" : colors.textSecondary },
              ]}
            >
              Post
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: currentUser.avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {currentUser.fullName}
              </Text>
              {currentUser.role ? (
                <Text style={[styles.authorRole, { color: colors.textSecondary }]}>
                  {currentUser.role}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.typeRow}>
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
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: active ? colors.primary : colors.backgroundElement,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={15}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: active ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_LENGTH))}
            placeholder={
              postType === "text" ? "What's on your mind?" : "Add a caption (optional)"
            }
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            multiline
            autoFocus={postType === "text"}
          />

          {postType === "text" && <MediaPicker media={media} onChange={setMedia} />}

          {postType === "poll" && (
            <View style={styles.pollSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Question <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Ask the community something..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                Options <Text style={{ color: colors.error }}>*</Text>
              </Text>
              {options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <TextInput
                    value={option}
                    onChangeText={(v) => updateOption(index, v)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.fieldInput,
                      styles.optionInput,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
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
                <Pressable onPress={addOption} style={styles.addOptionRow}>
                  <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                  <Text style={[styles.addOptionText, { color: colors.primary }]}>
                    Add option
                  </Text>
                </Pressable>
              )}

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                Poll duration
              </Text>
              <View style={styles.typeRow}>
                {DURATION_CHOICES.map((choice) => {
                  const active = durationHours === choice.hours;
                  return (
                    <Pressable
                      key={choice.label}
                      onPress={() => setDurationHours(choice.hours)}
                      style={[
                        styles.durationChip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.backgroundElement,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: active ? "#fff" : colors.textSecondary },
                        ]}
                      >
                        {choice.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {postType === "news" && (
            <View style={styles.pollSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Title <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={newsTitle}
                onChangeText={setNewsTitle}
                placeholder="Article headline"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                Summary <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={newsSummary}
                onChangeText={setNewsSummary}
                placeholder="A couple of sentences on what it's about..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.fieldInput,
                  styles.newsSummaryInput,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                multiline
                textAlignVertical="top"
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                Image URL (optional)
              </Text>
              <TextInput
                value={newsImageUrl}
                onChangeText={setNewsImageUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
                Article Link <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                value={newsSourceUrl}
                onChangeText={setNewsSourceUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                style={[
                  styles.fieldInput,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />

              <View style={styles.rssNote}>
                <MaterialCommunityIcons
                  name="rss"
                  size={13}
                  color={colors.textSecondary}
                />
                <Text style={[styles.rssNoteText, { color: colors.textSecondary }]}>
                  News posts are added manually for now — pulling these from an RSS
                  feed is planned for later.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {postType === "text" && (
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {text.length}/{MAX_LENGTH}
            </Text>
          )}
          <View style={styles.footerHint}>
            <MaterialCommunityIcons
              name="information-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text style={[styles.footerHintText, { color: colors.textSecondary }]}>
              Visible to everyone in the RxPharmily community
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: { padding: 4 },
  cancelText: { fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  postButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postButtonText: { fontSize: 14, fontWeight: "600" },
  content: { padding: 16, gap: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  authorName: { fontSize: 14, fontWeight: "600" },
  authorRole: { fontSize: 11, marginTop: 1 },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeChipText: { fontSize: 12, fontWeight: "600" },
  input: { fontSize: 16, lineHeight: 22, minHeight: 60, textAlignVertical: "top" },
  pollSection: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600" },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  optionInput: { flex: 1 },
  newsSummaryInput: { minHeight: 80 },
  rssNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 14,
  },
  rssNoteText: { fontSize: 11, flex: 1, lineHeight: 15 },
  addOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  addOptionText: { fontSize: 13, fontWeight: "600" },
  durationChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  charCount: { fontSize: 11, textAlign: "right" },
  footerHint: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerHintText: { fontSize: 11, flex: 1 },
});
