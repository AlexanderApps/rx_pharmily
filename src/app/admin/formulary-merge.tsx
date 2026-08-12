import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from "react-native";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import LoadingImage from "@/shared/components/loading-image";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";

export default function FormularyMergeScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const { id } = useLocalSearchParams<{ id: string }>();

  const formularyRequests = useCatalogStore((state) => state.formularyRequests);
  const isLoadingFormularyRequests = useCatalogStore((state) => state.isLoadingFormularyRequests);
  const fetchFormularyRequests = useCatalogStore((state) => state.fetchFormularyRequests);
  const mergeFormularyRequest = useCatalogStore((state) => state.mergeFormularyRequest);

  useEffect(() => {
    fetchFormularyRequests();
  }, []);

  const request = useMemo(() => formularyRequests.find((r) => r.id === id), [formularyRequests, id]);

  // Pre-filled from the request as submitted, but every field here is
  // editable — this is the actual cleanup step (fixing casing, expanding
  // abbreviations like "Tab" into a proper name, adding metadata the
  // requester wouldn't have known to include) before anything reaches
  // the shared catalog.
  const [name, setName] = useState(request?.productName ?? "");
  const [category, setCategory] = useState(request?.category ?? "");
  const [defaultUnit, setDefaultUnit] = useState(request?.defaultUnit ?? "");
  const [atcCode, setAtcCode] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) {
      setName(request.productName);
      setCategory(request.category ?? "");
      setDefaultUnit(request.defaultUnit ?? "");
    }
  }, [request?.id]);

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  if (!request) {
    if (isLoadingFormularyRequests) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textSecondary }}>Request not found.</Text>
      </SafeAreaView>
    );
  }

  if (request.status !== "approved") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <MaterialCommunityIcons name="information-outline" size={28} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10, textAlign: "center" }}>
          {request.status === "merged"
            ? "This request has already been merged into the catalog."
            : "This request needs to be approved before it can be merged."}
        </Text>
      </SafeAreaView>
    );
  }

  const canSave = name.trim().length > 0;

  const handleMerge = async () => {
    if (!canSave) return;
    const ok = await confirm({
      title: "Add to catalog?",
      message: `"${name.trim()}" will be created as a new product. This can't easily be undone from here.`,
      confirmLabel: "Merge",
    });
    if (!ok) return;

    setSaving(true);
    await mergeFormularyRequest(request.id, {
      name: name.trim(),
      category: category.trim() || undefined,
      defaultUnit: defaultUnit.trim() || undefined,
      atcCode: atcCode.trim() || undefined,
      description: description.trim() || undefined,
    });
    setSaving(false);
    toast.success("Merged into catalog.");
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Merge to Catalog</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.originalCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.originalLabel, { color: colors.textSecondary }]}>AS REQUESTED</Text>
          <View style={styles.originalRow}>
            {request.imageUri ? (
              <LoadingImage source={{ uri: request.imageUri }} style={styles.originalThumb} />
            ) : (
              <View style={[styles.originalThumb, { backgroundColor: colors.backgroundElement, alignItems: "center", justifyContent: "center" }]}>
                <MaterialCommunityIcons name="pill" size={16} color={colors.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.originalName, { color: colors.text }]}>{request.productName}</Text>
              <Text style={[styles.originalMeta, { color: colors.textSecondary }]}>
                {[request.category, request.defaultUnit].filter(Boolean).join(" · ") || "No category/unit given"}
              </Text>
            </View>
          </View>
          {request.notes ? (
            <Text style={[styles.originalNotes, { color: colors.textSecondary }]}>"{request.notes}"</Text>
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CLEANED-UP CATALOG ENTRY</Text>

        <Field label="Product name" value={name} onChangeText={setName} colors={colors} placeholder="e.g. Azithromycin 500mg Tablet" />
        <Field label="Category" value={category} onChangeText={setCategory} colors={colors} placeholder="e.g. Antibiotic" />
        <Field label="Default unit" value={defaultUnit} onChangeText={setDefaultUnit} colors={colors} placeholder="e.g. Tablet, Vial, Box" />
        <Field
          label="ATC code(s)"
          value={atcCode}
          onChangeText={setAtcCode}
          colors={colors}
          placeholder="e.g. J01FA10 or J01FA10/J01FA09"
          hint="Separate multiple codes with a slash."
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          colors={colors}
          placeholder="Short clinical description..."
          multiline
        />

        <Pressable
          onPress={handleMerge}
          disabled={!canSave || saving}
          style={[
            styles.mergeButton,
            { backgroundColor: canSave ? colors.primary : colors.backgroundElement, opacity: saving ? 0.6 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={canSave ? "#fff" : colors.textSecondary} />
          <Text style={[styles.mergeButtonText, { color: canSave ? "#fff" : colors.textSecondary }]}>
            {saving ? "Merging..." : "Merge into Catalog"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  placeholder,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: any;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        style={[
          styles.fieldInput,
          multiline && styles.fieldInputMultiline,
          { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border },
        ]}
      />
      {hint ? <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 40 },
  originalCard: { borderRadius: 14, padding: 14, marginBottom: 20, gap: 8 },
  originalLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  originalRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  originalThumb: { width: 36, height: 36, borderRadius: 8 },
  originalName: { fontSize: 14, fontWeight: "700" },
  originalMeta: { fontSize: 11, marginTop: 2 },
  originalNotes: { fontSize: 12, fontStyle: "italic", lineHeight: 17 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  fieldInputMultiline: { minHeight: 80, textAlignVertical: "top" },
  fieldHint: { fontSize: 11, marginTop: 4 },
  mergeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  mergeButtonText: { fontSize: 14, fontWeight: "700" },
});
