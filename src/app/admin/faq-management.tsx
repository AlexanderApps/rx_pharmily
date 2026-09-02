import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
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
    () =>
      [...faqItems].sort(
        (a, b) => a.category.localeCompare(b.category) || a.question.localeCompare(b.question),
      ),
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

  const canSave =
    draft.question.trim().length > 0 &&
    draft.answer.trim().length > 0 &&
    draft.category.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const data = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      category: draft.category.trim(),
    };
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
    toast[success ? "success" : "error"](
      success ? "FAQ entry deleted." : "Couldn't delete the entry.",
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader
        title="FAQ Management"
        subtitle={`${faqItems.length} entries`}
        actions={
          <Pressable
            onPress={openNew}
            className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {isLoading && sorted.length === 0 ? (
        <ListSkeleton variant="card" rows={5} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 grow"
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState icon="help-circle-outline" message="No FAQ entries yet." />
          }
          renderItem={({ item }) => (
            <View
              className="rounded-[14px] border p-3.5 gap-1.5"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <View
                className="self-start px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: colors.primary + "18" }}
              >
                <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                  {item.category}
                </Text>
              </View>
              <Text className="text-sm font-bold mt-0.5" style={{ color: colors.text }}>
                {item.question}
              </Text>
              <Text
                className="text-xs leading-[17px]"
                style={{ color: colors.textSecondary }}
                numberOfLines={3}
              >
                {item.answer}
              </Text>
              <View className="flex-row gap-2 mt-1.5">
                <Pressable
                  onPress={() => openEdit(item)}
                  className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: colors.info + "18" }}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={13} color={colors.info} />
                  <Text className="text-xs font-bold" style={{ color: colors.info }}>
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item)}
                  className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: colors.error + "18" }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={13} color={colors.error} />
                  <Text className="text-xs font-bold" style={{ color: colors.error }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/40"
        >
          <View
            className="rounded-t-[20px] p-5 max-h-[88%]"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                {editingId ? "Edit FAQ Entry" : "New FAQ Entry"}
              </Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Category
            </Text>
            <TextInput
              value={draft.category}
              onChangeText={(v) => setDraft((d) => ({ ...d, category: v }))}
              placeholder="e.g. Getting Started"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                color: colors.text,
              }}
            />

            <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>
              Question
            </Text>
            <TextInput
              value={draft.question}
              onChangeText={(v) => setDraft((d) => ({ ...d, question: v }))}
              placeholder="The question as it should appear"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                color: colors.text,
              }}
            />

            <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>
              Answer
            </Text>
            <TextInput
              value={draft.answer}
              onChangeText={(v) => setDraft((d) => ({ ...d, answer: v }))}
              placeholder="The answer shown when expanded"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[100px]"
              style={{
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
                color: colors.text,
                textAlignVertical: "top",
              }}
              multiline
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