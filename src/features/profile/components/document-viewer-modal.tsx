import React, { useEffect, useState } from "react";
import { View, Text, Modal, Pressable, ActivityIndicator } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import LoadingImage from "@/shared/components/loading-image";
import { getKycDocumentSignedUrl } from "@/lib/kyc-storage";

interface DocumentViewerModalProps {
  storagePath: string | null;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ storagePath, onClose }) => {
  const { colors } = useTheme();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!storagePath) {
      setSignedUrl(null);
      return;
    }
    setLoading(true);
    setError(false);
    getKycDocumentSignedUrl(storagePath).then((url) => {
      setSignedUrl(url);
      setError(!url);
      setLoading(false);
    });
  }, [storagePath]);

  return (
    <Modal visible={!!storagePath} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center p-5" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        <View className="w-full max-w-[420px] rounded-2xl overflow-hidden" style={{ aspectRatio: 3 / 4, backgroundColor: colors.backgroundSecondary }}>
          <Pressable
            onPress={onClose}
            className="absolute top-2.5 right-2.5 z-[1] w-[30px] h-[30px] rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(128,128,128,0.35)" }}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.text} />
          </Pressable>

          {loading && (
            <View className="flex-1 items-center justify-center gap-2.5">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-[13px]" style={{ color: colors.textSecondary }}>Loading document...</Text>
            </View>
          )}

          {!loading && error && (
            <View className="flex-1 items-center justify-center gap-2.5">
              <MaterialCommunityIcons name="file-alert-outline" size={32} color={colors.error} />
              <Text className="text-[13px]" style={{ color: colors.error }}>Couldn't load this document.</Text>
            </View>
          )}

          {!loading && !error && signedUrl && (
            <LoadingImage source={{ uri: signedUrl }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DocumentViewerModal;

