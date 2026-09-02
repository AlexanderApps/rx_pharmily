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
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole, isSuperadminRole } from "@/features/auth/types/auth.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { Product } from "@/features/catalog/types/catalog.types";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

export default function AdminProductsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const isSuperadmin = useAuthStore((state) => isSuperadminRole(state.profile?.accountRole));

  const products = useCatalogStore((state) => state.products);
  const fetchProducts = useCatalogStore((state) => state.fetchProducts);
  const addProduct = useCatalogStore((state) => state.addProduct);
  const updateProduct = useCatalogStore((state) => state.updateProduct);
  const softDeleteProduct = useCatalogStore((state) => state.softDeleteProduct);
  const restoreProduct = useCatalogStore((state) => state.restoreProduct);
  const hardDeleteProduct = useCatalogStore((state) => state.hardDeleteProduct);
  const mergeProducts = useCatalogStore((state) => state.mergeProducts);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<"active" | "deleted" | "all">("active");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const referenceCategories = useReferenceDataStore((state) => state.categories);
  const referenceUnits = useReferenceDataStore((state) => state.units);
  const categoryOptions = useMemo(
    () => referenceCategories.map((c) => ({ id: c.name, label: c.name })),
    [referenceCategories],
  );
  const unitOptions = useMemo(
    () =>
      referenceUnits.map((u) => ({
        id: u.name,
        label: u.abbreviation ? `${u.name} (${u.abbreviation})` : u.name,
      })),
    [referenceUnits],
  );
  const [atcCode, setAtcCode] = useState("");
  const [description, setDescription] = useState("");
  const [mergeTarget, setMergeTarget] = useState<Product | null>(null);
  const [mergeSearch, setMergeSearch] = useState("");

  // Superadmin's "show deleted" toggle needs the deleted rows actually
  // loaded — the default fetch (used everywhere else in the app) filters
  // them out at the query level, not just in this screen's own display.
  useEffect(() => {
    if (isSuperadmin) fetchProducts(productFilter !== "active");
  }, [productFilter, isSuperadmin]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byStatus = products.filter((p) => {
      if (productFilter === "active") return !p.deletedAt;
      if (productFilter === "deleted") return !!p.deletedAt;
      return true;
    });
    const sorted = [...byStatus].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, search, productFilter]);

  const mergeCandidates = useMemo(() => {
    if (!mergeTarget) return [];
    const q = mergeSearch.trim().toLowerCase();
    return products
      .filter((p) => p.id !== mergeTarget.id)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [products, mergeTarget, mergeSearch]);

  const openNew = () => {
    setEditingProduct(null);
    setName("");
    setCategory("");
    setDefaultUnit("");
    setAtcCode("");
    setDescription("");
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category ?? "");
    setDefaultUnit(product.defaultUnit ?? "");
    setAtcCode(product.atcCode ?? "");
    setDescription(product.description ?? "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Give this product a name.");
      return;
    }
    const data = {
      name: name.trim(),
      category: category.trim() || undefined,
      defaultUnit: defaultUnit.trim() || undefined,
      atcCode: atcCode.trim() || undefined,
      description: description.trim() || undefined,
    };
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await addProduct(data);
    }
    setShowForm(false);
  };

  const handleDelete = async (product: Product) => {
    const ok = await confirm({
      title: "Remove this product?",
      message: `"${product.name}" will be hidden from the catalog. A superadmin can restore it or delete it permanently.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await softDeleteProduct(product.id);
    toast.success("Product removed.");
  };

  const handleRestore = async (product: Product) => {
    const ok = await confirm({
      title: "Restore this product?",
      message: `"${product.name}" will be visible in the catalog again.`,
      confirmLabel: "Restore",
    });
    if (!ok) return;
    await restoreProduct(product.id);
    toast.success("Product restored.");
  };

  const handleHardDelete = async (product: Product) => {
    const ok = await confirm({
      title: "Permanently delete?",
      message: `"${product.name}" will be gone for good — this can't be undone, and anything still referencing it (RxRFQ items, price templates, etc.) will lose that link.`,
      confirmLabel: "Delete Permanently",
      destructive: true,
    });
    if (!ok) return;
    await hardDeleteProduct(product.id);
    toast.success("Product permanently deleted.");
  };

  const openMerge = (product: Product) => {
    setMergeTarget(product);
    setMergeSearch("");
  };

  const confirmMerge = async (canonical: Product) => {
    if (!mergeTarget) return;
    const ok = await confirm({
      title: "Merge products?",
      message: `"${mergeTarget.name}" will be hidden from the catalog in favor of "${canonical.name}". This doesn't move existing references to it — do that separately if needed.`,
      confirmLabel: "Merge",
    });
    if (!ok) return;
    await mergeProducts(mergeTarget.id, canonical.id);
    setMergeTarget(null);
    toast.success("Products merged.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader
        title="Product Catalog"
        subtitle={`${products.length} products`}
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

      {/* Search */}
      <View className="flex-row items-center gap-2 px-4 pt-3 pb-1">
        <View
          className="flex-1 flex-row items-center gap-2 rounded-[10px] px-3 py-2"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons name="magnify" size={17} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products or categories..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-sm p-0"
            style={{ color: colors.text }}
          />
        </View>
      </View>

      {isSuperadmin && (
        <StatusFilterTabs
          options={[
            { key: "active", label: "Active" },
            { key: "deleted", label: "Deleted" },
            { key: "all", label: "All" },
          ]}
          selected={productFilter}
          onSelect={(key) => setProductFilter(key as typeof productFilter)}
        />
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <Text
            className="text-center mt-6"
            style={{ color: colors.textSecondary }}
          >
            No matching products.
          </Text>
        }
        renderItem={({ item }) => {
          const isDeleted = !!item.deletedAt;
          return (
            <View
              className="flex-row items-center gap-2 rounded-xl border p-3"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                opacity: isDeleted ? 0.6 : 1,
              }}
            >
              <View className="flex-1">
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {item.name}{" "}
                  {isDeleted && (
                    <Text style={{ color: colors.error }}>(deleted)</Text>
                  )}
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                  {[item.category, item.defaultUnit].filter(Boolean).join(" · ") ||
                    "Uncategorized"}
                </Text>
              </View>
              {isDeleted ? (
                <>
                  <Pressable onPress={() => handleRestore(item)} hitSlop={6} className="p-1">
                    <MaterialCommunityIcons
                      name="backup-restore"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                  {isSuperadmin && (
                    <Pressable onPress={() => handleHardDelete(item)} hitSlop={6} className="p-1">
                      <MaterialCommunityIcons
                        name="delete-forever-outline"
                        size={16}
                        color={colors.error}
                      />
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Pressable onPress={() => openMerge(item)} hitSlop={6} className="p-1">
                    <MaterialCommunityIcons
                      name="call-merge"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable onPress={() => openEdit(item)} hitSlop={6} className="p-1">
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} hitSlop={6} className="p-1">
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={16}
                      color={colors.error}
                    />
                  </Pressable>
                </>
              )}
            </View>
          );
        }}
      />

      {/* Create / Edit form modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/50 justify-center p-6"
        >
          <View
            className="rounded-2xl p-[18px] max-h-[80%]"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>
              {editingProduct ? "Edit Product" : "New Product"}
            </Text>

            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Paracetamol 500mg"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
              }}
            />

            <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>
              Category
            </Text>
            <ReferencePicker
              title="Select Category"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Select a category"
              emptyMessage="No categories set up yet."
            />

            <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>
              Default Unit
            </Text>
            <ReferencePicker
              title="Select Unit"
              options={unitOptions}
              value={defaultUnit}
              onChange={setDefaultUnit}
              placeholder="Select a unit"
              emptyMessage="No units set up yet."
            />

            <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>
              ATC code(s)
            </Text>
            <TextInput
              value={atcCode}
              onChangeText={setAtcCode}
              placeholder="e.g. J01FA10/J01FA09"
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
              }}
            />

            <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Short clinical description..."
              placeholderTextColor={colors.textSecondary}
              multiline
              className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[70px]"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
            />

            <View className="flex-row gap-2.5 mt-[18px]">
              <Pressable
                onPress={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-sm font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Merge modal */}
      <Modal
        visible={!!mergeTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setMergeTarget(null)}
      >
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] max-h-[80%]"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold mb-3" style={{ color: colors.text }}>
              Merge "{mergeTarget?.name}" into...
            </Text>
            <TextInput
              value={mergeSearch}
              onChangeText={setMergeSearch}
              placeholder="Search for the canonical product..."
              placeholderTextColor={colors.textSecondary}
              className="border rounded-lg px-3 py-2.5 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
              }}
              autoFocus
            />
            <FlatList
              data={mergeCandidates}
              keyExtractor={(item) => item.id}
              className="max-h-[300px] mt-2.5"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => confirmMerge(item)}
                  className="rounded-lg p-3 mb-1.5"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: colors.text }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setMergeTarget(null)}
              className="py-2.5 rounded-[10px] items-center mt-2.5"
              style={{ backgroundColor: colors.backgroundElement }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}