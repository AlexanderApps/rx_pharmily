import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  KycDocumentType,
  KycEntityType,
  KycRecord,
} from "@/features/profile/types/profile.types";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";
import DocumentViewerModal from "@/features/profile/components/document-viewer-modal";
import { uploadKycDocumentImage } from "@/lib/kyc-storage";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";

interface KycSectionProps {
  entityType: KycEntityType;
  entityId: string;
  kyc: KycRecord;
  documentTypes: KycDocumentType[];
  onAddDocument: (type: KycDocumentType, fileName: string, imageUri?: string) => void;
  onRemoveDocument: (documentId: string) => void;
  onSubmit: () => void | Promise<boolean>;
}

const KycSection: React.FC<KycSectionProps> = ({
  entityType,
  entityId,
  kyc,
  documentTypes,
  onAddDocument,
  onRemoveDocument,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<KycDocumentType>(documentTypes[0]);
  const [uploading, setUploading] = useState(false);
  const [viewingPath, setViewingPath] = useState<string | null>(null);

  const canEdit = kyc.status === "unverified" || kyc.status === "rejected";

  const handleAddDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach a document photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const fileName = asset.fileName ?? `${selectedType}.jpg`;

    setUploading(true);
    const uploadResult = await uploadKycDocumentImage(asset.uri, entityType, entityId, fileName);
    setUploading(false);

    if (!uploadResult.ok) {
      Alert.alert("Upload failed", uploadResult.error);
      return;
    }
    // Stores the storage path, not the local device URI — the path is
    // what a reviewer on a different device can actually resolve to a
    // signed, viewable URL later (see DocumentViewerModal).
    onAddDocument(selectedType, fileName, uploadResult.path);
  };

  const handleSubmit = async () => {
    if (kyc.documents.length === 0) {
      Alert.alert("Add a document first", "Attach at least one document before submitting.");
      return;
    }
    const confirmed = await confirm({
      title: "Submit for verification?",
      message: "Your documents will be sent for review. You'll be notified once a decision is made.",
      confirmLabel: "Submit",
    });
    if (!confirmed) return;
    const result = await onSubmit();
    if (result === false) {
      toast.error("Couldn't submit for verification. Please try again.");
    } else {
      toast.success("Submitted for verification.");
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Verification</Text>
        <KycStatusBadge status={kyc.status} />
      </View>

      {kyc.status === "rejected" && kyc.rejectionReason && (
        <View style={[styles.reasonBox, { backgroundColor: colors.error + "12" }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={[styles.reasonText, { color: colors.error }]}>{kyc.rejectionReason}</Text>
        </View>
      )}

      {kyc.status === "verified" && kyc.reviewedAt && (
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Verified {new Date(kyc.reviewedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
          {kyc.reviewedBy ? ` by ${kyc.reviewedBy}` : ""}
        </Text>
      )}

      {kyc.status === "pending" && (
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Submitted for review — this usually takes 1–2 business days.
        </Text>
      )}

      {kyc.documents.length > 0 && (
        <View style={{ gap: 8 }}>
          {kyc.documents.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => doc.imageUri && setViewingPath(doc.imageUri)}
              style={[styles.docRow, { backgroundColor: colors.backgroundElement }]}
            >
              <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.docType, { color: colors.text }]}>{doc.type}</Text>
                <Text style={[styles.docFileName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {doc.fileName}
                </Text>
              </View>
              {doc.imageUri && (
                <MaterialCommunityIcons name="eye-outline" size={16} color={colors.textSecondary} />
              )}
              {canEdit && (
                <Pressable onPress={() => onRemoveDocument(doc.id)} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {canEdit && (
        <>
          <View style={styles.chipRow}>
            {documentTypes.map((type) => {
              const active = selectedType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? colors.primary : colors.backgroundElement },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleAddDocument}
            disabled={uploading}
            style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.backgroundElement, opacity: uploading ? 0.6 : 1 }]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <MaterialCommunityIcons name="camera-plus-outline" size={16} color={colors.textSecondary} />
            )}
            <Text style={[styles.addButtonText, { color: colors.textSecondary }]}>
              {uploading ? "Uploading..." : `Add ${selectedType} Photo`}
            </Text>
          </Pressable>

          <Pressable onPress={handleSubmit} style={[styles.submitButton, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#fff" />
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          </Pressable>
        </>
      )}

      <DocumentViewerModal
        storagePath={viewingPath}
        onClose={() => setViewingPath(null)}
      />
    </View>
  );
};

export default KycSection;

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "700" },
  reasonBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 10 },
  reasonText: { fontSize: 12, flex: 1, lineHeight: 17 },
  metaText: { fontSize: 12 },
  docRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, padding: 10 },
  docType: { fontSize: 13, fontWeight: "600" },
  docFileName: { fontSize: 11, marginTop: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: "600" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addButtonText: { fontSize: 13, fontWeight: "600" },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
