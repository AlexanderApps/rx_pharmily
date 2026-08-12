import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { AdMedia, MAX_AD_MEDIA_FILE_SIZE_BYTES } from "@/features/ads/types/ads.types";
import { uploadAdMedia } from "@/lib/ad-media-storage";

const MAX_IMAGES = 6;

interface AdMediaPickerProps {
  media: AdMedia[];
  onChange: (media: AdMedia[]) => void;
}

let nextMediaId = 1;

const AdMediaPicker: React.FC<AdMediaPickerProps> = ({ media, onChange }) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const hasVideo = media.some((m) => m.type === "video");

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to attach images or a video.",
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    if (hasVideo) {
      Alert.alert("Remove video first", "An ad can have images or one video, not both.");
      return;
    }
    if (!(await requestPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_IMAGES - media.length),
      quality: 0.9,
    });
    if (result.canceled) return;
    await addAssets(result.assets, "image");
  };

  const pickVideo = async () => {
    if (media.length > 0) {
      Alert.alert(
        "Remove attachments first",
        "An ad can have one video, or images, not both.",
      );
      return;
    }
    if (!(await requestPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.9,
    });
    if (result.canceled) return;
    await addAssets(result.assets, "video");
  };

  const addAssets = async (
    assets: ImagePicker.ImagePickerAsset[],
    type: "image" | "video",
  ) => {
    const toUpload: typeof assets = [];
    let rejectedCount = 0;

    for (const asset of assets) {
      const sizeBytes = asset.fileSize ?? 0;
      if (sizeBytes > MAX_AD_MEDIA_FILE_SIZE_BYTES) {
        rejectedCount++;
        continue;
      }
      toUpload.push(asset);
    }

    if (rejectedCount > 0) {
      Alert.alert(
        "File too large",
        `${rejectedCount} file(s) were over the 20MB limit and weren't added.`,
      );
    }

    if (toUpload.length === 0) return;

    setUploading(true);
    const accepted: AdMedia[] = [];
    let uploadFailures = 0;
    for (const asset of toUpload) {
      const fileName = asset.fileName ?? `${type}-${Date.now()}.${type === "video" ? "mp4" : "jpg"}`;
      const result = await uploadAdMedia(asset.uri, fileName);
      if (!result.ok) {
        uploadFailures++;
        continue;
      }
      accepted.push({
        id: `am${nextMediaId++}`,
        type,
        uri: result.url,
        sizeBytes: asset.fileSize ?? 0,
        width: asset.width,
        height: asset.height,
        durationMs: asset.duration ?? undefined,
      });
    }
    setUploading(false);

    if (uploadFailures > 0) {
      Alert.alert("Upload failed", `${uploadFailures} file(s) couldn't be uploaded.`);
    }

    if (accepted.length > 0) {
      onChange([...media, ...accepted].slice(0, type === "video" ? 1 : MAX_IMAGES));
    }
  };

  const removeMedia = (id: string) => {
    onChange(media.filter((m) => m.id !== id));
  };

  return (
    <View style={styles.wrap}>
      {media.length > 0 && (
        <View style={styles.thumbRow}>
          {media.map((item) => (
            <View key={item.id} style={styles.thumbWrap}>
              {item.type === "image" ? (
                <LoadingImage source={{ uri: item.uri }} style={styles.thumb} />
              ) : (
                <View
                  style={[
                    styles.thumb,
                    styles.videoThumb,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="play-circle-outline"
                    size={22}
                    color={colors.text}
                  />
                </View>
              )}
              <Pressable
                onPress={() => removeMedia(item.id)}
                style={[styles.removeButton, { backgroundColor: colors.error }]}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={pickImages}
          disabled={hasVideo || uploading}
          style={[
            styles.actionButton,
            { backgroundColor: colors.backgroundElement, opacity: hasVideo || uploading ? 0.5 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            name="image-multiple-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Photos</Text>
        </Pressable>

        <Pressable
          onPress={pickVideo}
          disabled={media.length > 0 || uploading}
          style={[
            styles.actionButton,
            { backgroundColor: colors.backgroundElement, opacity: media.length > 0 || uploading ? 0.5 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="video-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Video</Text>
        </Pressable>

        {uploading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Up to 20MB per file</Text>
        )}
      </View>
    </View>
  );
};

export default AdMediaPicker;

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumbWrap: { width: 72, height: 72 },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  videoThumb: { alignItems: "center", justifyContent: "center" },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: { fontSize: 12, fontWeight: "600" },
  hint: { fontSize: 11, marginLeft: 4 },
});
