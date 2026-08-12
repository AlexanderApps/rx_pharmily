import React from "react";
import { Image, ImageProps, Modal, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface ImageViewerModalProps {
  visible: boolean;
  source: ImageProps["source"];
  onClose: () => void;
}

// Full-screen, uncropped view of an image — resizeMode="contain" here
// specifically, unlike the "cover" fit most thumbnails/previews use
// elsewhere, since the whole point is showing what "cover" cropped off.
// Dismissible by the close button or by tapping anywhere on the dark
// backdrop outside the image itself, not just one fixed way out.
const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ visible, source, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.imageWrap} onPress={() => {}}>
          <Image source={source} style={styles.image} resizeMode="contain" />
        </Pressable>

        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ImageViewerModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    width: "100%",
    height: "80%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
});
