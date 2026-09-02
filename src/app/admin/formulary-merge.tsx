import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import LoadingImage from "@/shared/components/loading-image";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

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

  const request = useMemo(
    () => formularyRequests.find((r) => r.id === id),
    [formularyRequests, id],
  );

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
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={3} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.textSecondary }}>Request not found.</Text>
      </SafeAreaView>
    );
  }

  if (request.status !== "approved") {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center p-6"
        style={{ backgroundColor: colors.background }}
      >
        <MaterialCommunityIcons name="information-outline" size={28} color={colors.textSecondary} />
        <Text className="mt-2.5 text-center" style={{ color: colors.textSecondary }}>
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader title="Merge to Catalog" />

      <ScrollView contentContainerClassName="p-4 pb-10">
        {/* Original request card */}
        <View
          className="rounded-[14px] p-3.5 mb-5 gap-2"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text
            className="text-[10px] font-bold tracking-wide uppercase"
            style={{ color: colors.textSecondary }}
          >
            As requested
          </Text>
          <View className="flex-row items-center gap-2.5">
            {request.imageUri ? (
              <LoadingImage
                source={{ uri: request.imageUri }}
                style={{ width: 36, height: 36, borderRadius: 8 }}
              />
            ) : (
              <View
                className="w-9 h-9 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <MaterialCommunityIcons name="pill" size={16} color={colors.textSecondary} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {request.productName}
              </Text>
              <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                {[request.category, request.defaultUnit].filter(Boolean).join(" · ") ||
                  "No category/unit given"}
              </Text>
            </View>
          </View>
          {request.notes ? (
            <Text
              className="text-xs italic leading-[17px]"
              style={{ color: colors.textSecondary }}
            >
              "{request.notes}"
            </Text>
          ) : null}
        </View>

        <Text
          className="text-[11px] font-bold tracking-wide uppercase mb-3"
          style={{ color: colors.textSecondary }}
        >
          Cleaned-up catalog entry
        </Text>

        <Field
          label="Product name"
          value={name}
          onChangeText={setName}
          colors={colors}
          placeholder="e.g. Azithromycin 500mg Tablet"
        />
        <View className="mb-3.5">
          <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.text }}>
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
        </View>
        <View className="mb-3.5">
          <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.text }}>
            Default unit
          </Text>
          <ReferencePicker
            title="Select Unit"
            options={unitOptions}
            value={defaultUnit}
            onChange={setDefaultUnit}
            placeholder="Select a unit"
            emptyMessage="No units set up yet."
          />
        </View>
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
          className="flex-row items-center justify-center gap-2 rounded-xl py-3.5 mt-2"
          style={{
            backgroundColor: canSave ? colors.primary : colors.backgroundElement,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={18}
            color={canSave ? "#fff" : colors.textSecondary}
          />
          <Text
            className="text-sm font-bold"
            style={{ color: canSave ? "#fff" : colors.textSecondary }}
          >
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
    <View className="mb-3.5">
      <Text className="text-xs font-semibold mb-1.5" style={{ color: colors.text }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        className={`border rounded-[10px] px-3 py-2.5 text-sm ${multiline ? "min-h-20" : ""}`}
        style={{
          backgroundColor: colors.backgroundElement,
          color: colors.text,
          borderColor: colors.border,
          ...(multiline ? { textAlignVertical: "top" as const } : {}),
        }}
      />
      {hint ? (
        <Text className="text-[11px] mt-1" style={{ color: colors.textSecondary }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}