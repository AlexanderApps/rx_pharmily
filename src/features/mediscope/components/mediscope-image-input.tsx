import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
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
      <View style={styles.previewWrap}>
        <LoadingImage source={{ uri: imageUrl }} style={styles.preview} />
        <Pressable
          onPress={() => onChange(undefined)}
          style={[styles.removeButton, { backgroundColor: colors.error }]}
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
      style={[styles.picker, { backgroundColor: colors.backgroundElement, borderColor: colors.border, opacity: uploading ? 0.6 : 1 }]}
    >
      {uploading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <MaterialCommunityIcons name="camera-plus-outline" size={20} color={colors.textSecondary} />
      )}
      <Text style={[styles.pickerText, { color: colors.textSecondary }]}>
        {uploading ? "Uploading..." : "Attach a photo (optional)"}
      </Text>
    </Pressable>
  );
};

export default MediscopeImageInput;

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 16,
  },
  pickerText: { fontSize: 13, fontWeight: "500" },
  previewWrap: { width: 120, height: 120 },
  preview: { width: 120, height: 120, borderRadius: 10 },
  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
