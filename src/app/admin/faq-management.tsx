import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, Modal, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useHelpStore } from "@/features/help/hooks/use-help-data";
import { FaqItem } from "@/features/help/types/help.types";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import SubmitButton from "@/shared/components/submit-button";
import ListSkeleton from "@/shared/components/list-skeleton";

type DraftFaq = { question: string; answer: string; category: string };
const EMPTY_DRAFT: DraftFaq = { question: "", answer: "", category: "" };

export default function FaqManagementScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const faqItems = useHelpStore((state) => state.faqItems);
  const fetchFaqItems = useHelpStore((state) => state.fetchFaqItems);
  const addFaqItem = useHelpStore((state) => state.addFaqItem);
  const updateFaqItem = useHelpStore((state) => state.updateFaqItem);
  const deleteFaqItem = useHelpStore((state) => state.deleteFaqItem);

  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftFaq>(EMPTY_DRAFT);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchFaqItems().finally(() => setIsLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...faqItems].sort((a, b) => a.category.localeCompare(b.category) || a.question.localeCompare(b.question)),
    [faqItems],
  );

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const openNew = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setModalOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setDraft({ question: item.question, answer: item.answer, category: item.category });
    setModalOpen(true);
  };

  const canSave = draft.question.trim().length > 0 && draft.answer.trim().length > 0 && draft.category.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const data = { question: draft.question.trim(), answer: draft.answer.trim(), category: draft.category.trim() };
    const ok = editingId ? await updateFaqItem(editingId, data) : await addFaqItem(data);
    if (ok) {
      toast.success(editingId ? "FAQ entry updated." : "FAQ entry added.");
      setModalOpen(false);
    } else {
      toast.error("Couldn't save. Please try again.");
    }
  };

  const handleDelete = async (item: FaqItem) => {
    const ok = await confirm({
      title: "Delete this FAQ entry?",
      message: item.question,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const success = await deleteFaqItem(item.id);
    toast[success ? "success" : "error"](success ? "FAQ entry deleted." : "Couldn't delete the entry.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>FAQ Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{faqItems.length} entries</Text>
        </View>
        <Pressable onPress={openNew} style={[styles.newButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading && sorted.length === 0 ? (
        <ListSkeleton variant="card" rows={5} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="help-circle-outline" size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No FAQ entries yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <View style={[styles.categoryPill, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
              </View>
              <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
              <Text style={[styles.answer, { color: colors.textSecondary }]} numberOfLines={3}>
                {item.answer}
              </Text>
              <View style={styles.cardActions}>
                <Pressable onPress={() => openEdit(item)} style={[styles.actionButton, { backgroundColor: colors.info + "18" }]}>
                  <MaterialCommunityIcons name="pencil-outline" size={13} color={colors.info} />
                  <Text style={[styles.actionButtonText, { color: colors.info }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item)} style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={13} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? "Edit FAQ Entry" : "New FAQ Entry"}
              </Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <TextInput
              value={draft.category}
              onChangeText={(v) => setDraft((d) => ({ ...d, category: v }))}
              placeholder="e.g. Getting Started"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Question</Text>
            <TextInput
              value={draft.question}
              onChangeText={(v) => setDraft((d) => ({ ...d, question: v }))}
              placeholder="The question as it should appear"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Answer</Text>
            <TextInput
              value={draft.answer}
              onChangeText={(v) => setDraft((d) => ({ ...d, answer: v }))}
              placeholder="The answer shown when expanded"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
              multiline
              textAlignVertical="top"
            />

            <SubmitButton
              label={editingId ? "Save Changes" : "Add Entry"}
              onPress={handleSave}
              disabled={!canSave}
              style={{ marginTop: 18 }}
            />
          </View>
        </KeyboardAvoidingView>
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
  categoryPill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 10, fontWeight: "700" },
  question: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  answer: { fontSize: 12, lineHeight: 17 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  actionButtonText: { fontSize: 12, fontWeight: "700" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, marginTop: 6 },
  textArea: { minHeight: 100 },
});
