import React, {
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BsScrollView as BottomSheetScrollView } from "@/shared/components/bs/bs-primitives";
import ReferencePicker from "@/shared/components/forms/reference-picker";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { toast } from "@/shared/hooks/use-toast";
import { checkPhoneNumber } from "@/shared/utils/phone-number";
import { uploadProfileUpdateDocument } from "@/lib/profile-update-storage";
import { useProfileUpdateStore } from "@/features/profile-updates/hooks/use-profile-update-data";
import {
  LOCKED_FIELDS,
  ProfileUpdateEntityType,
  SupportingDocument,
} from "@/features/profile-updates/types/profile-update.types";

interface ProfileUpdateRequestModalProps {
  entityType: ProfileUpdateEntityType;
  entityId: string;
  // Current values for every field in LOCKED_FIELDS[entityType], keyed
  // by the same field keys — what the form pre-fills with and diffs
  // against at submit time.
  currentValues: Record<string, string | null>;
  onSubmitted: () => void;
}

const ProfileUpdateRequestModal = forwardRef<BottomSheetModal, ProfileUpdateRequestModalProps>(
  ({ entityType, entityId, currentValues, onSubmitted }, ref) => {
    const { colors } = useTheme();
    const submitRequest = useProfileUpdateStore((state) => state.submitRequest);
    const referenceRegions = useReferenceDataStore((state) => state.regions);
    const regionOptions = useMemo(
      () => referenceRegions.map((r) => ({ id: r.name, label: r.name })),
      [referenceRegions],
    );

    const fields = LOCKED_FIELDS[entityType];
    const [formValues, setFormValues] = useState<Record<string, string>>(() =>
      Object.fromEntries(fields.map((f) => [f.key, currentValues[f.key] ?? ""])),
    );
    const [documents, setDocuments] = useState<SupportingDocument[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Phone is the one field where a supporting document doesn't add
    // anything — see handleSubmit's own comment for the full reasoning.
    // Computed reactively (not just at submit time) so the hint text
    // below accurately reflects what's actually required given what the
    // person has changed so far, not a generic "always attach a
    // document" instruction that wouldn't apply here.
    const isPhoneOnlyChange = useMemo(() => {
      const changedKeys = fields.filter((f) => formValues[f.key].trim() !== (currentValues[f.key] ?? "")).map((f) => f.key);
      return changedKeys.length === 1 && changedKeys[0] === "phone";
    }, [fields, formValues, currentValues]);

    const resetForm = () => {
      setFormValues(Object.fromEntries(fields.map((f) => [f.key, currentValues[f.key] ?? ""])));
      setDocuments([]);
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
      const uploadResult = await uploadProfileUpdateDocument(asset.uri, entityType, entityId, fileName);
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
      // Only the fields that actually differ from their current value
      // go into the request — matching the DB's own "only the fields
      // actually being changed" contract for the changes column, and
      // meaning a reviewer's diff view never shows a field "changing"
      // to the same value it already had.
      const changes: Record<string, string | null> = {};
      const previousValues: Record<string, string | null> = {};
      for (const field of fields) {
        const newValue = formValues[field.key].trim();
        const oldValue = currentValues[field.key] ?? "";
        if (newValue !== oldValue) {
          changes[field.key] = newValue || null;
          previousValues[field.key] = currentValues[field.key] ?? null;
        }
      }

      if (Object.keys(changes).length === 0) {
        toast.error("Change at least one field before submitting.");
        return;
      }
      // Normalize phone to E.164 here — this is what admin approval
      // then merges onto the entity's own row, and what the phone
      // verification Edge Function later sends to Prelude, so it needs
      // to already be in exactly the form Prelude expects, not
      // whatever format the person happened to type.
      if (typeof changes.phone === "string") {
        const phoneCheck = checkPhoneNumber(changes.phone);
        if (!phoneCheck.ok) {
          toast.error(phoneCheck.error ?? "Invalid phone number");
          return;
        }
        changes.phone = phoneCheck.e164!;
      }
      // Phone is the one field where a supporting document doesn't add
      // anything: ownership gets proven separately, after admin
      // approval, via an actual OTP round trip (see
      // features/profile/components/phone-verification-sheet.tsx) —
      // not by an uploaded document the admin has to take on faith. A
      // request that also changes other fields alongside phone still
      // needs a document for those.
      if (!isPhoneOnlyChange && documents.length === 0) {
        toast.error("Attach at least one supporting document.");
        return;
      }

      setSubmitting(true);
      const ok = await submitRequest({
        entityType,
        entityId,
        changes,
        previousValues,
        supportingDocuments: documents,
      });
      setSubmitting(false);

      if (!ok) {
        toast.error("Couldn't submit your request. Please try again.");
        return;
      }
      toast.success("Request submitted for review.");
      resetForm();
      onSubmitted();
    };

    return (
      <BottomSheet
        ref={ref}
        title="Request Profile Update"
        snapPoints={["90%", "95%"]}
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
              {isPhoneOnlyChange
                ? "These fields are locked after verification. Changes here are reviewed by an admin before taking effect. Since you're only changing phone, no supporting document is needed — you'll verify the new number directly once it's approved."
                : "These fields are locked after verification. Changes here are reviewed by an admin before taking effect — attach at least one supporting document (e.g. an updated license or registration certificate)."}
            </Text>

            {fields.map((field) => (
              <View key={field.key} className="gap-2">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {field.label}
                </Text>
                {field.kind === "picker" ? (
                  <View className="flex-row flex-wrap gap-2">
                    {(field.options ?? []).map((option) => {
                      const active = formValues[field.key] === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setFormValues((prev) => ({ ...prev, [field.key]: option }))}
                          className="px-3 py-2 rounded-full"
                          style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: active ? "#fff" : colors.textSecondary }}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : field.kind === "region" ? (
                  <ReferencePicker
                    title="Select Region"
                    options={regionOptions}
                    value={formValues[field.key]}
                    onChange={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))}
                    placeholder="Select a region"
                    emptyMessage="No regions set up yet."
                    searchable={false}
                  />
                ) : (
                  <TextInput
                    value={formValues[field.key]}
                    onChangeText={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))}
                    keyboardType={field.keyboardType}
                    className="border rounded-lg px-3 py-2.5 text-sm"
                    style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
                  />
                )}
              </View>
            ))}

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

export default ProfileUpdateRequestModal;
