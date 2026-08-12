import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Cover Letter Templates</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Reuse these when applying to a job
          </Text>
        </View>
        <Pressable onPress={openNew} style={[styles.newButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="file-account-outline" size={36} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No templates yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEdit(item)}
            style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
              </Pressable>
            </View>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]} numberOfLines={3}>
              {item.body}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShowForm(false)} style={styles.back}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: colors.text }]}>
                {editingTemplate ? "Edit Template" : "New Template"}
              </Text>
              <Pressable onPress={handleSave} style={styles.back}>
                <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.formContent}>
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. General Locum Application"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Letter</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Write the reusable text here..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  newButton: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  cardBody: { fontSize: 12, lineHeight: 18 },
  formContent: { padding: 16 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 220 },
});
