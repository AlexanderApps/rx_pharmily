import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { CoverLetterTemplate } from "@/features/profile/types/profile.types";

export default function CoverLettersScreen() {
  const { colors } = useTheme();
  const templates = useProfileStore((state) => state.coverLetterTemplates);
  const addCoverLetterTemplate = useProfileStore((state) => state.addCoverLetterTemplate);
  const updateCoverLetterTemplate = useProfileStore((state) => state.updateCoverLetterTemplate);
  const deleteCoverLetterTemplate = useProfileStore((state) => state.deleteCoverLetterTemplate);
  const fetchCoverLetterTemplates = useProfileStore((state) => state.fetchCoverLetterTemplates);

  useEffect(() => {
    fetchCoverLetterTemplates();
  }, []);

  const [editingTemplate, setEditingTemplate] = useState<CoverLetterTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const openNew = () => {
    setEditingTemplate(null);
    setTitle("");
    setBody("");
    setShowForm(true);
  };

  const openEdit = (template: CoverLetterTemplate) => {
    setEditingTemplate(template);
    setTitle(template.title);
    setBody(template.body);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing information", "Add a title and the letter text.");
      return;
    }
    if (editingTemplate) {
      updateCoverLetterTemplate(editingTemplate.id, { title, body });
    } else {
      addCoverLetterTemplate({ title, body });
    }
    setShowForm(false);
  };

  const handleDelete = async (template: CoverLetterTemplate) => {
    const ok = await confirm({
      title: "Delete this template?",
      message: `"${template.title}" will be removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await deleteCoverLetterTemplate(template.id);
    toast.success("Template deleted.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Header Component Section */}
      <ScreenHeader
        title="Cover Letter Templates"
        subtitle="Reuse these when applying to a job"
        actions={
          <Pressable
            onPress={openNew}
            className="w-[34px] h-[34px] rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {/* Templates Stream List */}
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <EmptyState icon="file-account-outline" message="No templates yet." />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            className="rounded-[14px] border p-3.5 gap-1.5"
            style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-sm font-bold flex-1" style={{ color: colors.text }} numberOfLines={1}>
                {item.title}
              </Text>
              <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
              </Pressable>
            </View>
            <Text className="text-xs leading-[18px]" style={{ color: colors.textSecondary }} numberOfLines={3}>
              {item.body}
            </Text>
          </Pressable>
        )}
      />

      {/* Editor Modal Window Overlay */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
            
            <View className="flex-row items-center gap-2 px-3 py-3 border-b" style={{ borderBottomColor: colors.border }}>
              <Pressable onPress={() => setShowForm(false)} className="p-1.5">
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
              <Text className="text-base font-bold flex-1" style={{ color: colors.text }}>
                {editingTemplate ? "Edit Template" : "New Template"}
              </Text>
              <Pressable onPress={handleSave} className="p-1.5">
                <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
              </Pressable>
            </View>

            {/* Modal Input Content Body Container */}
            <View className="p-4">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. General Locum Application"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
              />

              <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>Letter</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Write the reusable text here..."
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[220px]"
                style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                multiline
                textAlignVertical="top"
              />
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
