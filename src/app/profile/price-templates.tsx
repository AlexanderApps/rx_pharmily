import React, { useEffect, useMemo, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
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
      <ScreenHeader
        title="Price Templates"
        subtitle="Reusable rate cards for RxRFQ responses"
        actions={
          <Pressable onPress={openNew} className="w-[34px] h-[34px] rounded-[10px] items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {myFacilities.length > 1 && (
        <View className="flex-row flex-wrap gap-2 px-4 pt-3">
          {myFacilities.map((f) => {
            const active = f.id === activeFacilityId;
            return (
              <Pressable
                key={f.id}
                onPress={() => setActiveFacilityId(f.id)}
                className="px-3 py-[7px] rounded-full"
                style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
              >
                <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
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
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <EmptyState icon="file-table-outline" message="No price templates yet." />
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          return (
            <View className="rounded-[14px] border p-3.5" style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}>
              <Pressable
                onPress={() => setExpandedId(expanded ? null : item.id)}
                className="flex-row items-center gap-2.5"
              >
                <MaterialCommunityIcons name="file-table-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
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
                      className="flex-row justify-between items-center rounded-lg px-2.5 py-2"
                      style={{ backgroundColor: colors.backgroundElement }}
                    >
                      <Text className="text-xs font-semibold flex-1" style={{ color: colors.text }} numberOfLines={1}>
                        {row.product}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
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
            <View className="flex-row items-center gap-2 px-3 py-3 border-b" style={{ borderBottomColor: colors.border }}>
              <Pressable onPress={() => setShowForm(false)} className="p-1.5">
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
              <Text className="text-base font-bold" style={{ color: colors.text }}>New Price Template</Text>
              <Pressable onPress={handleSave} className="p-1.5">
                <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <View className="p-4">
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Q1 2026 Standard Rate Card"
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-[11px] text-sm mt-1.5"
                style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
              />

              <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>
                CSV rows (product, rate, unit)
              </Text>
              <Text className="text-[11px] mt-1 leading-[15px]" style={{ color: colors.textSecondary }}>
                Paste your CSV content below — one product per line, comma-separated. A header row
                is optional.
              </Text>
              <TextInput
                value={csvText}
                onChangeText={setCsvText}
                placeholder={"product,rate,unit\nParacetamol 500mg,0.35,tablet"}
                placeholderTextColor={colors.textSecondary}
                className="border rounded-lg px-3 py-[11px] text-sm mt-1.5 min-h-[180px]"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
                }}
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
