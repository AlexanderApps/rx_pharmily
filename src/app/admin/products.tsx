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
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole, isSuperadminRole } from "@/features/auth/types/auth.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { Product } from "@/features/catalog/types/catalog.types";

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
  const [showDeleted, setShowDeleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [atcCode, setAtcCode] = useState("");
  const [description, setDescription] = useState("");

  const [mergeTarget, setMergeTarget] = useState<Product | null>(null);
  const [mergeSearch, setMergeSearch] = useState("");

  // Superadmin's "show deleted" toggle needs the deleted rows actually
  // loaded — the default fetch (used everywhere else in the app) filters
  // them out at the query level, not just in this screen's own display.
  useEffect(() => {
    if (isSuperadmin) fetchProducts(showDeleted);
  }, [showDeleted, isSuperadmin]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Product Catalog</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {products.length} products
          </Text>
        </View>
        <Pressable onPress={openNew} style={[styles.newButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
          <MaterialCommunityIcons name="magnify" size={17} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products or categories..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        {isSuperadmin && (
          <Pressable
            onPress={() => setShowDeleted((v) => !v)}
            style={[
              styles.deletedToggle,
              { backgroundColor: showDeleted ? colors.error + "18" : colors.backgroundElement },
            ]}
          >
            <MaterialCommunityIcons
              name={showDeleted ? "eye-off-outline" : "trash-can-outline"}
              size={14}
              color={showDeleted ? colors.error : colors.textSecondary}
            />
            <Text style={[styles.deletedToggleText, { color: showDeleted ? colors.error : colors.textSecondary }]}>
              {showDeleted ? "Hide deleted" : "Show deleted"}
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 24 }}>
            No matching products.
          </Text>
        }
        renderItem={({ item }) => {
          const isDeleted = !!item.deletedAt;
          return (
            <View
              style={[
                styles.row,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, opacity: isDeleted ? 0.6 : 1 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.name} {isDeleted && <Text style={{ color: colors.error }}>(deleted)</Text>}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {[item.category, item.defaultUnit].filter(Boolean).join(" · ") || "Uncategorized"}
                </Text>
              </View>
              {isDeleted ? (
                <>
                  <Pressable onPress={() => handleRestore(item)} hitSlop={6} style={styles.iconAction}>
                    <MaterialCommunityIcons name="backup-restore" size={16} color={colors.textSecondary} />
                  </Pressable>
                  {isSuperadmin && (
                    <Pressable onPress={() => handleHardDelete(item)} hitSlop={6} style={styles.iconAction}>
                      <MaterialCommunityIcons name="delete-forever-outline" size={16} color={colors.error} />
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  <Pressable onPress={() => openMerge(item)} hitSlop={6} style={styles.iconAction}>
                    <MaterialCommunityIcons name="call-merge" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => openEdit(item)} hitSlop={6} style={styles.iconAction}>
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} hitSlop={6} style={styles.iconAction}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
                  </Pressable>
                </>
              )}
            </View>
          );
        }}
      />

      <Modal visible={showForm} transparent animationType="fade" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingProduct ? "Edit Product" : "New Product"}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Paracetamol 500mg"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Category</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Medication"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Default Unit</Text>
            <TextInput
              value={defaultUnit}
              onChangeText={setDefaultUnit}
              placeholder="e.g. tablet"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>ATC code(s)</Text>
            <TextInput
              value={atcCode}
              onChangeText={setAtcCode}
              placeholder="e.g. J01FA10/J01FA09"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Short clinical description..."
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[
                styles.input,
                { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border, minHeight: 70, textAlignVertical: "top" },
              ]}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowForm(false)}
                style={[styles.modalButton, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!mergeTarget} transparent animationType="fade" onRequestClose={() => setMergeTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Merge "{mergeTarget?.name}" into...
            </Text>
            <TextInput
              value={mergeSearch}
              onChangeText={setMergeSearch}
              placeholder="Search for the canonical product..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
              autoFocus
            />
            <FlatList
              data={mergeCandidates}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300, marginTop: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => confirmMerge(item)}
                  style={[styles.mergeRow, { backgroundColor: colors.backgroundElement }]}
                >
                  <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setMergeTarget(null)}
              style={[styles.modalButton, { backgroundColor: colors.backgroundElement, marginTop: 10 }]}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
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
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  deletedToggle: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 10, height: 36 },
  deletedToggleText: { fontSize: 11, fontWeight: "600" },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  listContent: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  rowTitle: { fontSize: 13, fontWeight: "600" },
  rowMeta: { fontSize: 11, marginTop: 2 },
  iconAction: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard: { borderRadius: 16, padding: 18, maxHeight: "80%" },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 6 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  modalButton: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  modalButtonText: { fontSize: 14, fontWeight: "600" },
  mergeRow: { borderRadius: 8, padding: 12, marginBottom: 6 },
});
