import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import {
  UnitOfMeasurement,
  MedicationCategory,
  Region,
  Incoterm,
  Currency,
  JobCategory,
  RxRfqCategory,
} from "@/features/reference-data/types/reference-data.types";

type TabKey = "units" | "categories" | "regions" | "incoterms" | "currencies" | "jobCategories" | "rxrfqCategories";
type EditingItem = UnitOfMeasurement | MedicationCategory | Region | Incoterm | Currency | JobCategory | RxRfqCategory;

const TABS: { key: TabKey; label: string }[] = [
  { key: "units", label: "Units" },
  { key: "categories", label: "Categories" },
  { key: "regions", label: "Regions" },
  { key: "incoterms", label: "Incoterms" },
  { key: "currencies", label: "Currencies" },
  { key: "jobCategories", label: "Job Categories" },
  { key: "rxrfqCategories", label: "RFQ Categories" },
];

export default function AdminReferenceDataScreen() {
  const { colors } = useTheme();
  // "admin and super admin" per the requirement — isAdminRole already
  // covers both tiers (same as this table's own RLS, which uses
  // is_admin(), itself account_role in ('admin', 'superadmin')).
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const units = useReferenceDataStore((state) => state.units);
  const categories = useReferenceDataStore((state) => state.categories);
  const regions = useReferenceDataStore((state) => state.regions);
  const fetchAll = useReferenceDataStore((state) => state.fetchAll);
  const addUnit = useReferenceDataStore((state) => state.addUnit);
  const updateUnit = useReferenceDataStore((state) => state.updateUnit);
  const deleteUnit = useReferenceDataStore((state) => state.deleteUnit);
  const addCategory = useReferenceDataStore((state) => state.addCategory);
  const updateCategory = useReferenceDataStore((state) => state.updateCategory);
  const deleteCategory = useReferenceDataStore((state) => state.deleteCategory);
  const addRegion = useReferenceDataStore((state) => state.addRegion);
  const updateRegion = useReferenceDataStore((state) => state.updateRegion);
  const deleteRegion = useReferenceDataStore((state) => state.deleteRegion);
  const incoterms = useReferenceDataStore((state) => state.incoterms);
  const addIncoterm = useReferenceDataStore((state) => state.addIncoterm);
  const updateIncoterm = useReferenceDataStore((state) => state.updateIncoterm);
  const deleteIncoterm = useReferenceDataStore((state) => state.deleteIncoterm);
  const currencies = useReferenceDataStore((state) => state.currencies);
  const addCurrency = useReferenceDataStore((state) => state.addCurrency);
  const updateCurrency = useReferenceDataStore((state) => state.updateCurrency);
  const deleteCurrency = useReferenceDataStore((state) => state.deleteCurrency);
  const jobCategories = useReferenceDataStore((state) => state.jobCategories);
  const addJobCategory = useReferenceDataStore((state) => state.addJobCategory);
  const updateJobCategory = useReferenceDataStore((state) => state.updateJobCategory);
  const deleteJobCategory = useReferenceDataStore((state) => state.deleteJobCategory);
  const rxrfqCategories = useReferenceDataStore((state) => state.rxrfqCategories);
  const addRxRfqCategory = useReferenceDataStore((state) => state.addRxRfqCategory);
  const updateRxRfqCategory = useReferenceDataStore((state) => state.updateRxRfqCategory);
  const deleteRxRfqCategory = useReferenceDataStore((state) => state.deleteRxRfqCategory);

  useEffect(() => {
    fetchAll();
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>("units");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingItem | null>(null);
  const [nameInput, setNameInput] = useState(""); // also doubles as "code" for incoterms
  const [secondaryInput, setSecondaryInput] = useState(""); // abbreviation, description, or "label" for incoterms
  const [tertiaryInput, setTertiaryInput] = useState(""); // incoterms' description only
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  // Explicit per-tab rather than a "name" in item heuristic — Currency
  // also happens to have a name field, but its title should combine
  // code+name (matching how incoterms' own label already does), not
  // just show the bare name alone.
  const getItemTitle = (item: EditingItem) => {
    if (activeTab === "incoterms") return (item as Incoterm).label;
    if (activeTab === "currencies") {
      const currency = item as Currency;
      return `${currency.code} — ${currency.name}`;
    }
    return (item as UnitOfMeasurement | MedicationCategory | Region | JobCategory | RxRfqCategory).name;
  };

  const activeList =
    activeTab === "units"
      ? units
      : activeTab === "categories"
        ? categories
        : activeTab === "regions"
          ? regions
          : activeTab === "incoterms"
            ? incoterms
            : activeTab === "currencies"
              ? currencies
              : activeTab === "jobCategories"
                ? jobCategories
                : rxrfqCategories;
  const secondaryLabel =
    activeTab === "units"
      ? "Abbreviation (optional)"
      : activeTab === "categories" || activeTab === "jobCategories" || activeTab === "rxrfqCategories"
        ? "Description (optional)"
        : activeTab === "incoterms" || activeTab === "currencies"
          ? activeTab === "incoterms"
            ? "Label"
            : "Name"
          : null;

  const openAdd = () => {
    setEditing(null);
    setNameInput("");
    setSecondaryInput("");
    setTertiaryInput("");
    setShowForm(true);
  };

  const openEdit = (item: EditingItem) => {
    setEditing(item);
    if (activeTab === "incoterms") {
      const incoterm = item as Incoterm;
      setNameInput(incoterm.code);
      setSecondaryInput(incoterm.label);
      setTertiaryInput(incoterm.description ?? "");
    } else if (activeTab === "currencies") {
      const currency = item as Currency;
      setNameInput(currency.code);
      setSecondaryInput(currency.name);
      setTertiaryInput(currency.symbol ?? "");
    } else {
      setNameInput((item as UnitOfMeasurement | MedicationCategory | Region | JobCategory | RxRfqCategory).name);
      setSecondaryInput(
        activeTab === "units"
          ? (item as UnitOfMeasurement).abbreviation ?? ""
          : activeTab === "categories" || activeTab === "jobCategories" || activeTab === "rxrfqCategories"
            ? (item as MedicationCategory | JobCategory | RxRfqCategory).description ?? ""
            : "",
      );
      setTertiaryInput("");
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    const isCodeShape = activeTab === "incoterms" || activeTab === "currencies";
    if (!nameInput.trim()) {
      toast.error(isCodeShape ? "Enter a code." : "Enter a name.");
      return;
    }
    if (isCodeShape && !secondaryInput.trim()) {
      toast.error(activeTab === "incoterms" ? "Enter a label." : "Enter a name.");
      return;
    }
    setIsSubmitting(true);
    let success = false;
    if (activeTab === "units") {
      success = editing
        ? await updateUnit(editing.id, nameInput, secondaryInput)
        : await addUnit(nameInput, secondaryInput);
    } else if (activeTab === "categories") {
      success = editing
        ? await updateCategory(editing.id, nameInput, secondaryInput)
        : await addCategory(nameInput, secondaryInput);
    } else if (activeTab === "incoterms") {
      success = editing
        ? await updateIncoterm(editing.id, nameInput, secondaryInput, tertiaryInput)
        : await addIncoterm(nameInput, secondaryInput, tertiaryInput);
    } else if (activeTab === "currencies") {
      success = editing
        ? await updateCurrency(editing.id, nameInput, secondaryInput, tertiaryInput)
        : await addCurrency(nameInput, secondaryInput, tertiaryInput);
    } else if (activeTab === "jobCategories") {
      success = editing
        ? await updateJobCategory(editing.id, nameInput, secondaryInput)
        : await addJobCategory(nameInput, secondaryInput);
    } else if (activeTab === "rxrfqCategories") {
      success = editing
        ? await updateRxRfqCategory(editing.id, nameInput, secondaryInput)
        : await addRxRfqCategory(nameInput, secondaryInput);
    } else {
      success = editing ? await updateRegion(editing.id, nameInput) : await addRegion(nameInput);
    }
    setIsSubmitting(false);
    if (!success) {
      toast.error(editing ? "Couldn't save changes." : "Couldn't add this entry.");
      return;
    }
    toast.success(editing ? "Saved." : "Added.");
    setShowForm(false);
  };

  const handleDelete = async (item: EditingItem) => {
    const ok = await confirm({
      title: `Delete "${getItemTitle(item)}"?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const deleteFn =
      activeTab === "units"
        ? deleteUnit
        : activeTab === "categories"
          ? deleteCategory
          : activeTab === "incoterms"
            ? deleteIncoterm
            : activeTab === "currencies"
              ? deleteCurrency
              : activeTab === "jobCategories"
                ? deleteJobCategory
                : activeTab === "rxrfqCategories"
                  ? deleteRxRfqCategory
                  : deleteRegion;
    const success = await deleteFn(item.id);
    toast[success ? "success" : "error"](success ? "Deleted." : "Couldn't delete this entry.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader
        title="Reference Data"
        subtitle="Units, categories, regions, incoterms, and currencies used across the catalog"
        actions={
          <Pressable
            onPress={openAdd}
            className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 pt-3 pb-1">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="px-3.5 py-1.5 rounded-full border"
              style={{
                backgroundColor: active ? colors.primary : "transparent",
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text className="text-[13px] font-semibold" style={{ color: active ? "#fff" : colors.text }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={activeList}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 grow"
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState icon="format-list-bulleted" message="No entries yet." />
        }
        renderItem={({ item }) => (
          <View
            className="flex-row items-center gap-2.5 rounded-xl border p-3.5"
            style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {getItemTitle(item)}
              </Text>
              {"abbreviation" in item && item.abbreviation && (
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {item.abbreviation}
                </Text>
              )}
              {"symbol" in item && item.symbol && (
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {item.symbol}
                </Text>
              )}
              {"description" in item && item.description && (
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <Pressable onPress={() => openEdit(item)} className="p-2">
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} className="p-2">
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      />

      {/* Add/edit modal */}
      <Modal visible={showForm} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] gap-2.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {editing ? "Edit" : "Add"}{" "}
              {activeTab === "units"
                ? "Unit"
                : activeTab === "categories"
                  ? "Category"
                  : activeTab === "incoterms"
                    ? "Incoterm"
                    : activeTab === "currencies"
                      ? "Currency"
                      : activeTab === "jobCategories"
                        ? "Job Category"
                        : activeTab === "rxrfqCategories"
                          ? "RFQ Category"
                          : "Region"}
            </Text>

            <Text className="text-xs font-semibold mt-1.5" style={{ color: colors.text }}>
              {activeTab === "incoterms" || activeTab === "currencies" ? "Code" : "Name"}
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={activeTab === "incoterms" ? "e.g. FOB" : activeTab === "currencies" ? "e.g. USD" : "Name"}
              placeholderTextColor={colors.textSecondary}
              className="border rounded-[10px] px-3 py-2.5 text-sm"
              style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
              autoCapitalize={activeTab === "incoterms" || activeTab === "currencies" ? "characters" : "sentences"}
              autoFocus
            />

            {secondaryLabel && (
              <>
                <Text className="text-xs font-semibold mt-1.5" style={{ color: colors.text }}>{secondaryLabel}</Text>
                <TextInput
                  value={secondaryInput}
                  onChangeText={setSecondaryInput}
                  placeholder={
                    activeTab === "units"
                      ? "e.g. TAB"
                      : activeTab === "incoterms"
                        ? "e.g. FOB — Free On Board"
                        : activeTab === "currencies"
                          ? "e.g. US Dollar"
                          : activeTab === "jobCategories"
                            ? "e.g. Requires an active facility license"
                            : activeTab === "rxrfqCategories"
                              ? "e.g. Consumable medical supplies"
                              : "e.g. Used for treating infections"
                  }
                  placeholderTextColor={colors.textSecondary}
                  className="border rounded-[10px] px-3 py-2.5 text-sm"
                  style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
                  multiline={activeTab === "categories" || activeTab === "jobCategories" || activeTab === "rxrfqCategories"}
                />
              </>
            )}

            {activeTab === "incoterms" && (
              <>
                <Text className="text-xs font-semibold mt-1.5" style={{ color: colors.text }}>Description (optional)</Text>
                <TextInput
                  value={tertiaryInput}
                  onChangeText={setTertiaryInput}
                  placeholder="What this term means for delivery and risk"
                  placeholderTextColor={colors.textSecondary}
                  className="border rounded-[10px] px-3 py-2.5 text-sm"
                  style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
                  multiline
                />
              </>
            )}

            {activeTab === "currencies" && (
              <>
                <Text className="text-xs font-semibold mt-1.5" style={{ color: colors.text }}>Symbol (optional)</Text>
                <TextInput
                  value={tertiaryInput}
                  onChangeText={setTertiaryInput}
                  placeholder="e.g. $"
                  placeholderTextColor={colors.textSecondary}
                  className="border rounded-[10px] px-3 py-2.5 text-sm"
                  style={{ backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }}
                />
              </>
            )}

            <View className="flex-row gap-2.5 mt-2">
              <Pressable
                onPress={() => setShowForm(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement, opacity: isSubmitting ? 0.6 : 1 }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={isSubmitting || !nameInput.trim()}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{
                  backgroundColor: nameInput.trim() && !isSubmitting ? colors.primary : colors.backgroundElement,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: nameInput.trim() && !isSubmitting ? "#fff" : colors.textSecondary }}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
