import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import {
  MAX_MEDIA_FILE_SIZE_BYTES,
  PostMedia,
} from "@/features/posts/types/posts.types";
import { uploadPostMedia } from "@/lib/post-media-storage";

const MAX_IMAGES = 8;

interface MediaPickerProps {
  media: PostMedia[];
  onChange: (media: PostMedia[]) => void;
}

let nextMediaId = 1;

function formatMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ media, onChange }) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const hasVideo = media.some((m) => m.type === "video");

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to attach images or video.",
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    if (hasVideo) {
      Alert.alert("Remove video first", "A post can have images or one video, not both.");
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
        "A post can have one video, or images, not both.",
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
    const rejected: string[] = [];

    for (const asset of assets) {
      const sizeBytes = asset.fileSize ?? 0;
      if (sizeBytes > MAX_MEDIA_FILE_SIZE_BYTES) {
        rejected.push(asset.fileName ?? formatMB(sizeBytes));
        continue;
      }
      toUpload.push(asset);
    }

    if (rejected.length > 0) {
      Alert.alert(
        "File too large",
        `${rejected.length} file(s) were over the 20MB limit and weren't added.`,
      );
    }

    if (toUpload.length === 0) return;

    setUploading(true);
    const accepted: PostMedia[] = [];
    let uploadFailures = 0;
    for (const asset of toUpload) {
      const fileName = asset.fileName ?? `${type}-${Date.now()}.${type === "video" ? "mp4" : "jpg"}`;
      const result = await uploadPostMedia(asset.uri, fileName);
      if (!result.ok) {
        uploadFailures++;
        continue;
      }
      accepted.push({
        id: `m${nextMediaId++}`,
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
    <View className="gap-2.5">
      {media.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {media.map((item) => (
            <View key={item.id} className="w-[72px] h-[72px]">
              {item.type === "image" ? (
                <LoadingImage source={{ uri: item.uri }} style={{ width: 72, height: 72, borderRadius: 10 }} />
              ) : (
                <View className="w-[72px] h-[72px] rounded-[10px] items-center justify-center" style={{ backgroundColor: colors.backgroundElement }}>
                  <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.text} />
                </View>
              )}
              <Pressable
                onPress={() => removeMedia(item.id)}
                className="absolute -top-[5px] -right-[5px] w-[18px] h-[18px] rounded-full items-center justify-center"
                style={{ backgroundColor: colors.error }}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-2 flex-wrap">
        <Pressable
          onPress={pickImages}
          disabled={hasVideo || uploading}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ backgroundColor: colors.backgroundElement, opacity: hasVideo || uploading ? 0.5 : 1 }}
        >
          <MaterialCommunityIcons name="image-multiple-outline" size={16} color={colors.textSecondary} />
          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
            Photos
          </Text>
        </Pressable>

        <Pressable
          onPress={pickVideo}
          disabled={media.length > 0 || uploading}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ backgroundColor: colors.backgroundElement, opacity: media.length > 0 || uploading ? 0.5 : 1 }}
        >
          <MaterialCommunityIcons name="video-outline" size={16} color={colors.textSecondary} />
          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
            Video
          </Text>
        </Pressable>

        {uploading ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Text className="text-[11px] ml-1" style={{ color: colors.textSecondary }}>
            Up to 20MB per file
          </Text>
        )}
      </View>
    </View>
  );
};

export default MediaPicker;

