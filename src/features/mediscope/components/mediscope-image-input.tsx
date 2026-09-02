import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { uploadAppImage } from "@/lib/app-image-storage";

interface MediscopeImageInputProps {
  imageUrl?: string;
  onChange: (uri: string | undefined) => void;
}

const MediscopeImageInput: React.FC<MediscopeImageInputProps> = ({
  imageUrl,
  onChange,
}) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? `mediscope-${Date.now()}.jpg`;
    setUploading(true);
    const uploadResult = await uploadAppImage(asset.uri, "mediscope", fileName);
    setUploading(false);

    if (!uploadResult.ok) {
      Alert.alert("Upload failed", uploadResult.error);
      return;
    }
    onChange(uploadResult.url);
  };

  if (imageUrl) {
    return (
      <View className="w-[120px] h-[120px]">
        <LoadingImage source={{ uri: imageUrl }} style={{ width: 120, height: 120, borderRadius: 10 }} />
        <Pressable
          onPress={() => onChange(undefined)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.error }}
          hitSlop={6}
        >
          <MaterialCommunityIcons name="close" size={13} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={pickImage}
      disabled={uploading}
      className="flex-row items-center justify-center gap-2 border border-dashed rounded-[10px] py-4"
      style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, opacity: uploading ? 0.6 : 1 }}
    >
      {uploading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <MaterialCommunityIcons name="camera-plus-outline" size={20} color={colors.textSecondary} />
      )}
      <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
        {uploading ? "Uploading..." : "Attach a photo (optional)"}
      </Text>
    </Pressable>
  );
};

export default MediscopeImageInput;

