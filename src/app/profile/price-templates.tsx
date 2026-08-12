import React, { useEffect, useMemo, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { formatAmount } from "@/shared/utils/format";
import { PriceTemplate } from "@/features/profile/types/profile.types";

export default function PriceTemplatesScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ facilityId?: string }>();
  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const facilityMemberships = useProfileStore((state) => state.facilityMemberships);
  const myFacilities = useMemo(() => {
    const myIds = new Set(
      facilityMemberships.filter((m) => m.userId === user.id).map((m) => m.facilityId),
    );
    return facilities.filter((f) => myIds.has(f.id));
  }, [facilities, facilityMemberships, user.id]);
  const allPriceTemplates = useProfileStore((state) => state.priceTemplates);
  const addPriceTemplate = useProfileStore((state) => state.addPriceTemplate);
  const deletePriceTemplate = useProfileStore((state) => state.deletePriceTemplate);
  const fetchPriceTemplates = useProfileStore((state) => state.fetchPriceTemplates);

  useEffect(() => {
    fetchPriceTemplates();
  }, []);


  const [activeFacilityId, setActiveFacilityId] = useState(
    params.facilityId ?? myFacilities[0]?.id,
  );
  const priceTemplates = useMemo(
    () => allPriceTemplates.filter((t) => t.facilityId === activeFacilityId),
    [allPriceTemplates, activeFacilityId],
  );

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [csvText, setCsvText] = useState("");

  const openNew = () => {
    setTitle("");
    setCsvText("product,rate,unit\nParacetamol 500mg,0.35,tablet\n");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!activeFacilityId) {
      Alert.alert("No facility", "You need to belong to a facility before uploading a price template.");
      return;
    }
    if (!title.trim() || !csvText.trim()) {
      Alert.alert("Missing information", "Add a title and the CSV rows.");
      return;
    }
    addPriceTemplate(
      activeFacilityId,
      title,
      `${title.trim().toLowerCase().replace(/\s+/g, "-")}.csv`,
      csvText,
    );
    setShowForm(false);
  };

  const handleDelete = async (template: PriceTemplate) => {
    const ok = await confirm({
      title: "Delete this template?",
      message: `"${template.title}" will be removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await deletePriceTemplate(template.id);
    toast.success("Template deleted.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Price Templates</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Reusable rate cards for RxRFQ responses
          </Text>
        </View>
        <Pressable onPress={openNew} style={[styles.newButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {myFacilities.length > 1 && (
        <View style={styles.facilityChipRow}>
          {myFacilities.map((f) => {
            const active = f.id === activeFacilityId;
            return (
              <Pressable
                key={f.id}
                onPress={() => setActiveFacilityId(f.id)}
                style={[styles.facilityChip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
              >
                <Text style={[styles.facilityChipText, { color: active ? "#fff" : colors.textSecondary }]}>
                  {f.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <FlatList
        data={priceTemplates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="file-table-outline" size={36} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No price templates yet.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          return (
            <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Pressable
                onPress={() => setExpandedId(expanded ? null : item.id)}
                style={styles.cardTopRow}
              >
                <MaterialCommunityIcons name="file-table-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                    {item.items.length} items · uploaded {format(item.uploadedAt)}
                  </Text>
                </View>
                <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
                </Pressable>
                <MaterialCommunityIcons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>

              {expanded && (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {item.items.map((row) => (
                    <View
                      key={row.id}
                      style={[styles.itemRow, { backgroundColor: colors.backgroundElement }]}
                    >
                      <Text style={[styles.itemProduct, { color: colors.text }]} numberOfLines={1}>
                        {row.product}
                      </Text>
                      <Text style={[styles.itemRate, { color: colors.textSecondary }]}>
                        {formatAmount(row.rate)}{row.unit ? ` / ${row.unit}` : ""}
                      </Text>
                    </View>
                  ))}
                  {item.items.length === 0 && (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      No rows parsed from this file.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShowForm(false)} style={styles.back}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: colors.text }]}>New Price Template</Text>
              <Pressable onPress={handleSave} style={styles.back}>
                <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.formContent}>
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Q1 2026 Standard Rate Card"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                CSV rows (product, rate, unit)
              </Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Paste your CSV content below — one product per line, comma-separated. A header row
                is optional.
              </Text>
              <TextInput
                value={csvText}
                onChangeText={setCsvText}
                placeholder={"product,rate,unit\nParacetamol 500mg,0.35,tablet"}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
                ]}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
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
  facilityChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  facilityChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  facilityChipText: { fontSize: 12, fontWeight: "600" },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardMeta: { fontSize: 11, marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemProduct: { fontSize: 12, fontWeight: "600", flex: 1 },
  itemRate: { fontSize: 12 },
  formContent: { padding: 16 },
  label: { fontSize: 12, fontWeight: "600" },
  hint: { fontSize: 11, marginTop: 4, lineHeight: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 180, fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) },
});
