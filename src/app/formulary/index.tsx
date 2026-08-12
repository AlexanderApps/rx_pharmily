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
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import ListSkeleton from "@/shared/components/list-skeleton";
import LoadingImage from "@/shared/components/loading-image";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { FormularyRequest, FormularyRequestStatus } from "@/features/catalog/types/catalog.types";
import { uploadAppImage } from "@/lib/app-image-storage";

const STATUS_META: Record<
  FormularyRequestStatus,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "warning" | "success" | "error" }
> = {
  pending: { label: "Pending Review", icon: "clock-outline", tone: "warning" },
  approved: { label: "Approved — Awaiting Merge", icon: "check-circle-outline", tone: "success" },
  merged: { label: "Merged into Catalog", icon: "check-decagram-outline", tone: "success" },
  rejected: { label: "Rejected", icon: "close-circle-outline", tone: "error" },
};

export default function FormularyScreen() {
  const { colors } = useTheme();
  const formularyRequests = useCatalogStore((state) => state.formularyRequests);
  const isLoadingFormularyRequests = useCatalogStore((state) => state.isLoadingFormularyRequests);
  const fetchFormularyRequests = useCatalogStore((state) => state.fetchFormularyRequests);
  const submitFormularyRequest = useCatalogStore((state) => state.submitFormularyRequest);

  useEffect(() => {
    fetchFormularyRequests();
  }, []);


  const [showForm, setShowForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const sorted = useMemo(
    () =>
      [...formularyRequests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach an image.");
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
    await submitFormularyRequest({
      productName,
      category: category || undefined,
      defaultUnit: defaultUnit || undefined,
      notes: notes || undefined,
      imageUri,
    });
    setShowForm(false);
    resetForm();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Formulary Requests</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Request a medication be added to the catalog
          </Text>
        </View>
        <Pressable onPress={openNew} style={[styles.newButton, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoadingFormularyRequests && sorted.length === 0 ? (
        <ListSkeleton variant="card" rows={4} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="pill" size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                No formulary requests yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => <RequestCard request={item} />}
        />
      )}

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShowForm(false)} style={styles.back}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </Pressable>
              <Text style={[styles.title, { color: colors.text }]}>New Formulary Request</Text>
              <Pressable onPress={handleSubmit} style={styles.back}>
                <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => "form"}
              renderItem={() => (
                <View style={styles.formContent}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Medication Name <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <TextInput
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="e.g. Azithromycin 250mg"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Category</Text>
                  <TextInput
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g. Medication, Equipment, Lab Supply"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Unit</Text>
                  <TextInput
                    value={defaultUnit}
                    onChangeText={setDefaultUnit}
                    placeholder="e.g. tablet, vial, box"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Notes</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Why should this be added? Any details that help review it."
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }]}
                    multiline
                    textAlignVertical="top"
                  />

                  <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                    Image <Text style={{ color: colors.textSecondary, fontWeight: "400" }}>(optional)</Text>
                  </Text>
                  {imageUri ? (
                    <View style={styles.imagePreviewWrap}>
                      <LoadingImage source={{ uri: imageUri }} style={styles.imagePreview} />
                      <Pressable
                        onPress={() => setImageUri(undefined)}
                        style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="#fff" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handlePickImage}
                      disabled={uploadingImage}
                      style={[styles.imagePickerButton, { borderColor: colors.border, backgroundColor: colors.backgroundElement, opacity: uploadingImage ? 0.6 : 1 }]}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <MaterialCommunityIcons name="camera-plus-outline" size={16} color={colors.textSecondary} />
                      )}
                      <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>
                        {uploadingImage ? "Uploading..." : "Add a photo"}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable onPress={handleSubmit} style={[styles.submitButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.submitButtonText}>Submit Request</Text>
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
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={styles.cardTopRow}>
        {request.imageUri ? (
          <LoadingImage source={{ uri: request.imageUri }} style={styles.cardThumb} />
        ) : (
          <View style={[styles.cardThumb, styles.cardThumbPlaceholder, { backgroundColor: colors.backgroundElement }]}>
            <MaterialCommunityIcons name="pill" size={18} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {request.productName}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {[request.category, request.defaultUnit].filter(Boolean).join(" · ") || "Uncategorized"}
            {" · "}
            {format(request.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: toneColor + "18" }]}>
          <MaterialCommunityIcons name={meta.icon} size={11} color={toneColor} />
          <Text style={[styles.statusPillText, { color: toneColor }]}>{meta.label}</Text>
        </View>
      </View>

      {request.notes ? (
        <Text style={[styles.cardNotes, { color: colors.textSecondary }]}>{request.notes}</Text>
      ) : null}

      {request.reviewComment ? (
        <View style={[styles.reviewBox, { backgroundColor: toneColor + "10" }]}>
          <Text style={[styles.reviewText, { color: toneColor }]}>{request.reviewComment}</Text>
        </View>
      ) : null}
    </View>
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
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardThumb: { width: 40, height: 40, borderRadius: 10 },
  cardThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardMeta: { fontSize: 11, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  cardNotes: { fontSize: 12, lineHeight: 17 },
  reviewBox: { borderRadius: 8, padding: 10 },
  reviewText: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  formContent: { padding: 16 },
  label: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 90 },
  imagePreviewWrap: { marginTop: 8, position: "relative", width: 96 },
  imagePreview: { width: 96, height: 96, borderRadius: 10 },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 6,
  },
  imagePickerText: { fontSize: 13, fontWeight: "600" },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 22 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
