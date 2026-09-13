import React, { useState, useImperativeHandle, forwardRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";
import { toast } from "@/shared/hooks/use-toast";
import { uploadOwnershipTransferDocument } from "@/lib/ownership-transfer-storage";
import { useOwnershipTransferStore } from "@/features/ownership-transfer/hooks/use-ownership-transfer-data";
import { OwnershipTransferEntityType } from "@/features/ownership-transfer/types/ownership-transfer.types";
import { SupportingDocument } from "@/features/profile-updates/types/profile-update.types";

interface OwnershipTransferRequestModalProps {
  entityType: OwnershipTransferEntityType;
  entityId: string;
  entityName: string;
  onSubmitted: () => void;
}

const OwnershipTransferRequestModal = forwardRef<BottomSheetModal, OwnershipTransferRequestModalProps>(
  ({ entityType, entityId, entityName, onSubmitted }, ref) => {
    const { colors } = useTheme();
    const createDraftRequest = useOwnershipTransferStore((state) => state.createDraftRequest);
    const finalizeRequest = useOwnershipTransferStore((state) => state.finalizeRequest);

    const [reason, setReason] = useState("");
    const [documents, setDocuments] = useState<SupportingDocument[]>([]);
    const [draftRequestId, setDraftRequestId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
      setReason("");
      setDocuments([]);
      setDraftRequestId(null);
    };

    // Lazy — only actually creates the draft row the first time someone
    // attaches a document, not the moment the sheet opens, so simply
    // opening this form and closing it again without attaching anything
    // never creates a row at all.
    const ensureDraftRequest = async (): Promise<string | null> => {
      if (draftRequestId) return draftRequestId;
      const result = await createDraftRequest(entityType, entityId);
      if (!result.ok || !result.requestId) {
        toast.error(result.error ?? "Couldn't start your request. Please try again.");
        return null;
      }
      setDraftRequestId(result.requestId);
      return result.requestId;
    };

    const handleAddDocument = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to attach a supporting document.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      const fileName = asset.fileName ?? `document-${Date.now()}.jpg`;

      setUploading(true);
      const requestId = await ensureDraftRequest();
      if (!requestId) {
        setUploading(false);
        return;
      }
      const uploadResult = await uploadOwnershipTransferDocument(asset.uri, requestId, fileName);
      setUploading(false);

      if (!uploadResult.ok) {
        Alert.alert("Upload failed", uploadResult.error);
        return;
      }
      setDocuments((prev) => [...prev, { name: fileName, uri: uploadResult.path }]);
    };

    const handleRemoveDocument = (name: string) => {
      setDocuments((prev) => prev.filter((d) => d.name !== name));
    };

    const handleSubmit = async () => {
      if (!reason.trim()) {
        toast.error("Explain why you should be the owner of this account.");
        return;
      }
      if (documents.length === 0) {
        toast.error("Attach at least one supporting document.");
        return;
      }
      const requestId = await ensureDraftRequest();
      if (!requestId) return;

      setSubmitting(true);
      const ok = await finalizeRequest({ requestId, reason: reason.trim(), supportingDocuments: documents });
      setSubmitting(false);

      if (!ok) {
        toast.error("Couldn't submit your request. Please try again.");
        return;
      }
      toast.success("Ownership request submitted for review.");
      resetForm();
      onSubmitted();
    };

    return (
      <BottomSheet
        ref={ref}
        title="Request Ownership"
        snapPoints={["85%", "95%"]}
        showHandle
        cornerRadius={20}
        padding={0}
        enablePanDownToClose
        onChange={(index: number) => {
          if (index === -1) resetForm();
        }}
        backgroundColor={colors.backgroundSecondary}
      >
        <BottomSheetScrollView keyboardShouldPersistTaps="handled">
          <View className="px-5 pt-5 pb-10 gap-5">
            <Text className="text-xs leading-[17px]" style={{ color: colors.textSecondary }}>
              Requesting ownership of <Text style={{ fontWeight: "700", color: colors.text }}>{entityName}</Text>.
              An admin reviews this request and either approves it — immediately making you the owner — or rejects it with a reason.
            </Text>

            <View className="gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Why should you be the owner?
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. I am the new pharmacy manager; the previous owner left the company"
                placeholderTextColor={colors.textSecondary}
                multiline
                className="rounded-xl p-3.5 text-sm min-h-[100px]"
                style={{ backgroundColor: colors.backgroundElement, color: colors.text, textAlignVertical: "top" }}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Supporting Documents
              </Text>
              {documents.map((doc) => (
                <View
                  key={doc.name}
                  className="flex-row items-center gap-2 rounded-[10px] p-2.5"
                  style={{ backgroundColor: colors.backgroundElement }}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} />
                  <Text className="text-sm flex-1" style={{ color: colors.text }} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Pressable onPress={() => handleRemoveDocument(doc.name)} hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={handleAddDocument}
                disabled={uploading}
                className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed"
                style={{ borderColor: colors.border }}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="paperclip" size={16} color={colors.primary} />
                    <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                      Attach Document
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Unmissable, deliberately — placed directly above the
                submit action, not buried in a terms-and-conditions
                link, since this is a real deterrent, not boilerplate. */}
            <View
              className="flex-row items-start gap-2.5 p-3.5 rounded-xl"
              style={{ backgroundColor: colors.error + "14" }}
            >
              <MaterialCommunityIcons name="alert-outline" size={18} color={colors.error} style={{ marginTop: 1 }} />
              <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.error }}>
                Submitting a false ownership claim is treated as fraud and can result in your account being permanently banned.
              </Text>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              className="py-3.5 rounded-xl items-center"
              style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
            >
              <Text className="text-white text-[15px] font-semibold">
                {submitting ? "Submitting..." : "Submit Request"}
              </Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

export default OwnershipTransferRequestModal;
