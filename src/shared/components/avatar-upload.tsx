import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { uploadAppImage } from "@/lib/app-image-storage";
import LoadingImage from "@/shared/components/loading-image";

interface AvatarUploadProps {
  imageUri?: string;
  onImageSelected: (url: string) => void;
  fallbackColor: string;
  /** Initials for a user, or a MaterialCommunityIcons name for a facility/org logo. */
  fallbackContent: string | React.ReactNode;
  size?: number;
  /** Storage folder label — "avatars" for users, "logos" for facilities/orgs. */
  uploadContext: string;
}

const MAX_AVATAR_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB — generous for a profile photo/logo, small enough to catch an accidental full-res upload

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  imageUri,
  onImageSelected,
  fallbackColor,
  fallbackContent,
  size = 72,
  uploadContext,
}) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Allow photo library access to set a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const sizeBytes = asset.fileSize ?? 0;
    if (sizeBytes > MAX_AVATAR_FILE_SIZE_BYTES) {
      toast.error("That image is over the 8MB limit — try a smaller one.");
      return;
    }

    const fileName = asset.fileName ?? `${uploadContext}-${Date.now()}.jpg`;
    setUploading(true);
    const uploadResult = await uploadAppImage(asset.uri, uploadContext, fileName);
    setUploading(false);

    if (!uploadResult.ok) {
      toast.error("Couldn't upload the image. Please try again.");
      return;
    }
    onImageSelected(uploadResult.url);
  };

  return (
    <Pressable onPress={handlePick} disabled={uploading}>
      <View
        className="items-center justify-center overflow-hidden"
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fallbackColor }}
      >
        {imageUri ? (
          <LoadingImage
            source={{ uri: imageUri }}
            style={{ width: size, height: size }}
            borderRadius={size / 2}
          />
        ) : typeof fallbackContent === "string" ? (
          <Text style={{ color: "#fff", fontSize: size * 0.32, fontWeight: "700" }}>{fallbackContent}</Text>
        ) : (
          fallbackContent
        )}

        {uploading && (
          <View
            className="absolute inset-0 items-center justify-center bg-[rgba(0,0,0,0.4)]"
            style={{ borderRadius: size / 2 }}
          >
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </View>

      <View
        className="absolute -right-0.5 -bottom-0.5 w-[26px] h-[26px] rounded-full border-2 items-center justify-center"
        style={{ backgroundColor: colors.primary, borderColor: colors.background }}
      >
        <MaterialCommunityIcons name="camera-outline" size={size * 0.18} color="#fff" />
      </View>
    </Pressable>
  );
};

export default AvatarUpload;

