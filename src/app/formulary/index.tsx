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
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { toast } from "@/shared/hooks/use-toast";
import ListSkeleton from "@/shared/components/list-skeleton";
import LoadingImage from "@/shared/components/loading-image";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import {
  FormularyRequest,
  FormularyRequestStatus,
} from "@/features/catalog/types/catalog.types";
import { uploadAppImage } from "@/lib/app-image-storage";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";

const STATUS_META: Record<
  FormularyRequestStatus,
  {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    tone: "warning" | "success" | "error";
  }
> = {
  pending: { label: "Pending Review", icon: "clock-outline", tone: "warning" },
  approved: {
    label: "Approved — Awaiting Merge",
    icon: "check-circle-outline",
    tone: "success",
  },
  merged: {
    label: "Merged into Catalog",
    icon: "check-decagram-outline",
    tone: "success",
  },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

export default function FormularyScreen() {
  const { colors } = useTheme();
  const formularyRequests = useCatalogStore((state) => state.formularyRequests);
  const isLoadingFormularyRequests = useCatalogStore(
    (state) => state.isLoadingFormularyRequests,
  );
  const fetchFormularyRequests = useCatalogStore(
    (state) => state.fetchFormularyRequests,
  );
  const submitFormularyRequest = useCatalogStore(
    (state) => state.submitFormularyRequest,
  );
  const referenceCategories = useReferenceDataStore((state) => state.categories);
  const referenceUnits = useReferenceDataStore((state) => state.units);
  // category/default_unit are still plain text columns (see
  // 20260824000000_reference_lookup_tables.sql's own note on this) —
  // using name as both id and label means the picker's onChange
  // returns the display name directly, matching what those columns
  // already expect, rather than a uuid that would break every other
  // screen reading request.category as display text.
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
    fetchFormularyRequests();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sorted = useMemo(
    () =>
      [...formularyRequests].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [formularyRequests],
  );

  const resetForm = () => {
    setProductName("");
    setCategory("");
    setDefaultUnit("");
    setNotes("");
    setImageUri(undefined);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to attach an image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? `formulary-${Date.now()}.jpg`;
    setUploadingImage(true);
    const uploadResult = await uploadAppImage(asset.uri, "formulary", fileName);
    setUploadingImage(false);
    if (!uploadResult.ok) {
      Alert.alert("Upload failed", uploadResult.error);
      return;
    }
    setImageUri(uploadResult.url);
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      Alert.alert("Missing name", "Give the medication a name.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    const success = await submitFormularyRequest({
      productName,
      category: category || undefined,
      defaultUnit: defaultUnit || undefined,
      notes: notes || undefined,
      imageUri,
    });
    setIsSubmitting(false);
    if (!success) {
      toast.error("Couldn't submit the request. Try again.");
      return;
    }
    toast.success("Formulary request submitted.");
    setShowForm(false);
    resetForm();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader
        title="Formulary Requests"
        subtitle="Request a medication be added to the catalog"
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


      {isLoadingFormularyRequests && sorted.length === 0 ? (
        <ListSkeleton variant="card" rows={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 grow"
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState icon="pill" message="No formulary requests yet." />
          }
          renderItem={({ item }) => <RequestCard request={item} />}
        />
      )}

      {/* New request modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View
              className="flex-row items-center gap-2 px-3 py-3 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <Pressable onPress={() => setShowForm(false)} className="p-1.5">
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
              <Text className="text-base font-bold flex-1" style={{ color: colors.text }}>
                New Formulary Request
              </Text>
              <Pressable onPress={handleSubmit} disabled={isSubmitting} className="p-1.5">
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
                )}
              </Pressable>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => "form"}
              renderItem={() => (
                <View className="p-4">
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    Medication Name <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <TextInput
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="e.g. Azithromycin 250mg"
                    placeholderTextColor={colors.textSecondary}
                    className="border rounded-lg px-3 py-2.5 text-sm mt-1.5"
                    style={{
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                  />

                  <Text
                    className="text-xs font-semibold mt-4"
                    style={{ color: colors.text }}
                  >
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

                  <Text
                    className="text-xs font-semibold mt-4"
                    style={{ color: colors.text }}
                  >
                    Unit
                  </Text>
                  <ReferencePicker
                    title="Select Unit"
                    options={unitOptions}
                    value={defaultUnit}
                    onChange={setDefaultUnit}
                    placeholder="Select a unit"
                    emptyMessage="No units set up yet."
                  />

                  <Text
                    className="text-xs font-semibold mt-4"
                    style={{ color: colors.text }}
                  >
                    Notes
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Why should this be added? Any details that help review it."
                    placeholderTextColor={colors.textSecondary}
                    className="border rounded-lg px-3 py-2.5 text-sm mt-1.5 min-h-[90px]"
                    style={{
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.border,
                      color: colors.text,
                      textAlignVertical: "top",
                    }}
                    multiline
                  />

                  <Text
                    className="text-xs font-semibold mt-4"
                    style={{ color: colors.text }}
                  >
                    Image{" "}
                    <Text
                      className="font-normal"
                      style={{ color: colors.textSecondary }}
                    >
                      (optional)
                    </Text>
                  </Text>

                  {imageUri ? (
                    <View className="mt-2 relative w-24">
                      <LoadingImage
                        source={{ uri: imageUri }}
                        style={{ width: 96, height: 96, borderRadius: 10 }}
                      />
                      <Pressable
                        onPress={() => setImageUri(undefined)}
                        className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.error }}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handlePickImage}
                      disabled={uploadingImage}
                      className="flex-row items-center justify-center gap-2 py-3.5 rounded-[10px] border border-dashed mt-1.5"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundElement,
                        opacity: uploadingImage ? 0.6 : 1,
                      }}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <MaterialCommunityIcons
                          name="camera-plus-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      )}
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: colors.textSecondary }}
                      >
                        {uploadingImage ? "Uploading..." : "Add a photo"}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-row items-center justify-center gap-2 py-3.5 rounded-[10px] mt-[22px]"
                    style={{ backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
                    <Text className="text-white text-[15px] font-semibold">
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function RequestCard({ request }: { request: FormularyRequest }) {
  const { colors } = useTheme();
  const meta = STATUS_META[request.status];
  const toneColor = colors[meta.tone];

  return (
    <View
      className="rounded-[14px] border p-3.5 gap-2"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center gap-2.5">
        {request.imageUri ? (
          <LoadingImage
            source={{ uri: request.imageUri }}
            style={{ width: 40, height: 40, borderRadius: 10 }}
          />
        ) : (
          <View
            className="w-10 h-10 rounded-[10px] items-center justify-center"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons
              name="pill"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        )}
        <View className="flex-1">
          <Text
            className="text-sm font-bold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {request.productName}
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
            {[request.category, request.defaultUnit].filter(Boolean).join(" · ") ||
              "Uncategorized"}
            {" · "}
            {format(request.createdAt)}
          </Text>
        </View>
        <View
          className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
          style={{ backgroundColor: toneColor + "18" }}
        >
          <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
          <Text className="text-[10px] font-bold" style={{ color: toneColor }}>
            {meta.label}
          </Text>
        </View>
      </View>

      {request.notes ? (
        <Text className="text-xs leading-[17px]" style={{ color: colors.textSecondary }}>
          {request.notes}
        </Text>
      ) : null}

      {request.reviewComment ? (
        <View
          className="rounded-lg p-2.5"
          style={{ backgroundColor: toneColor + "10" }}
        >
          <Text
            className="text-xs leading-[17px] font-medium"
            style={{ color: toneColor }}
          >
            {request.reviewComment}
          </Text>
        </View>
      ) : null}
    </View>
  );
}