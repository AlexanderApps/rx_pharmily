import React from "react";
import { Image, ImageProps, Modal, Pressable } from "react-native";
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
      <Pressable className="flex-1 items-center justify-center bg-[rgba(0,0,0,0.92)]" onPress={onClose}>
        <Pressable className="w-full h-[80%]" onPress={() => {}}>
          <Image source={source} className="w-full h-full" resizeMode="contain" />
        </Pressable>

        <Pressable
          onPress={onClose}
          className="absolute top-[50px] right-5 w-[38px] h-[38px] rounded-full items-center justify-center bg-[rgba(255,255,255,0.15)]"
          hitSlop={10}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ImageViewerModal;

