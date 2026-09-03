import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import SubmitButton from "@/shared/components/submit-button";
import { toast } from "@/shared/hooks/use-toast";
import { useRxLinkStore } from "@/features/rxlink/hooks/use-rxlink-data";
import { RxLinkImageDraft, RxLinkImageType } from "@/features/rxlink/types/rxlink.types";

const MAX_IMAGES = 6;

export default function NewRxLinkRequestScreen() {
  const { colors } = useTheme();
  const submitRequest = useRxLinkStore((state) => state.submitRequest);

  const [imageType, setImageType] = useState<RxLinkImageType>("prescription");
  const [images, setImages] = useState<RxLinkImageDraft[]>([]);
  const [comment, setComment] = useState("");

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_IMAGES - images.length),
      quality: 0.9,
    });
    if (result.canceled) return;

    const drafts: RxLinkImageDraft[] = result.assets.map((asset) => ({
      localUri: asset.uri,
      fileName: asset.fileName ?? `rxlink-${Date.now()}.jpg`,
      imageType,
    }));
    setImages((prev) => [...prev, ...drafts].slice(0, MAX_IMAGES));
  };

  const removeImage = (localUri: string) => {
    setImages((prev) => prev.filter((img) => img.localUri !== localUri));
  };

  // Changing the toggle after photos are already staged re-tags them
  // too, so the whole submission stays consistent with what the person
  // last selected — avoids a request where some images say prescription
  // and others say medication for no reason the person intended.
  const handleSetImageType = (next: RxLinkImageType) => {
    setImageType(next);
    setImages((prev) => prev.map((img) => ({ ...img, imageType: next })));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error("Add at least one photo.");
      return;
    }
    const id = await submitRequest({ comment, images });
    if (id) {
      toast.success("Request sent. An admin will get back to you.");
      router.replace({ pathname: "/rxlink/request-details", params: { id } });
    } else {
      toast.error("Couldn't send the request.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScreenHeader title="New RxLink Request" />

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View
            className="flex-row items-start gap-2.5 rounded-xl p-3"
            style={{ backgroundColor: colors.primary + "10" }}
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color={colors.primary} />
            <Text className="flex-1 text-xs leading-[17px]" style={{ color: colors.text }}>
              Only pharmacy admins can see what you upload here. It's never shared publicly or
              with other users.
            </Text>
          </View>

          <View>
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
              What are you sharing?
            </Text>
            <View className="flex-row rounded-xl border p-1" style={{ borderColor: colors.border }}>
              {(["prescription", "medication"] as RxLinkImageType[]).map((type) => {
                const active = imageType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => handleSetImageType(type)}
                    className="flex-1 items-center py-2 rounded-[9px]"
                    style={{ backgroundColor: active ? colors.primary : "transparent" }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: active ? "#fff" : colors.textSecondary }}
                    >
                      {type === "prescription" ? "Prescription" : "Medication photo"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
              Photos ({images.length}/{MAX_IMAGES})
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              {images.map((img) => (
                <View key={img.localUri} className="w-[86px] h-[86px]">
                  <Image
                    source={{ uri: img.localUri }}
                    style={{ width: 86, height: 86, borderRadius: 10 }}
                  />
                  <Pressable
                    onPress={() => removeImage(img.localUri)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.error }}
                    hitSlop={6}
                  >
                    <MaterialCommunityIcons name="close" size={13} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <Pressable
                  onPress={pickImages}
                  className="w-[86px] h-[86px] rounded-[10px] border border-dashed items-center justify-center gap-1"
                  style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border }}
                >
                  <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.textSecondary} />
                  <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>
                    Add
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <View>
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
              Anything else? (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="e.g. looking for the generic version, need it urgently, etc."
              placeholderTextColor={colors.textSecondary}
              multiline
              className="min-h-24 border rounded-[10px] p-3 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
            />
          </View>

          <SubmitButton
            label="Send Request"
            onPress={handleSubmit}
            disabled={images.length === 0}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
