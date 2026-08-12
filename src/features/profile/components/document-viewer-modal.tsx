import React, { useEffect, useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from "react-native";
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
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={18} color={colors.text} />
          </Pressable>

          {loading && (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading document...</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.stateWrap}>
              <MaterialCommunityIcons name="file-alert-outline" size={32} color={colors.error} />
              <Text style={[styles.stateText, { color: colors.error }]}>Couldn't load this document.</Text>
            </View>
          )}

          {!loading && !error && signedUrl && (
            <LoadingImage source={{ uri: signedUrl }} style={styles.image} resizeMode="contain" />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DocumentViewerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.35)",
  },
  stateWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  stateText: { fontSize: 13 },
  image: { width: "100%", height: "100%" },
});
