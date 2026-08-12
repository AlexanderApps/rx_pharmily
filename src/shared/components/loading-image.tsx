import React, { useRef, useState } from "react";
import { Animated, ImageProps, ImageStyle, Pressable, StyleProp, StyleSheet, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Skeleton from "@/shared/components/skeleton";
import ImageViewerModal from "@/shared/components/image-viewer-modal";

interface LoadingImageProps extends Omit<ImageProps, "style" | "source"> {
  source: ImageProps["source"];
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
  // Adds a small expand button in the corner that opens the same image,
  // uncropped, in a full-screen modal — for spots where the thumbnail's
  // own fit (usually "cover") can visibly crop content the person might
  // want to see in full. Off by default: most thumbnails (list rows,
  // small avatars) don't need this, and it only makes sense to opt in
  // where the image is content worth seeing uncropped.
  expandable?: boolean;
}

// A skeleton sits behind the image until it actually finishes loading,
// then the image fades in over it — rather than either a blank gap where
// nothing has rendered yet, or the image abruptly popping in once the
// network request resolves. Falls straight to just rendering the image
// if it fails to load; no point holding a skeleton up forever for a
// broken/missing image.
const LoadingImage: React.FC<LoadingImageProps> = ({
  source,
  style,
  borderRadius = 0,
  expandable = false,
  onLoad,
  onError,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  const flatStyle: ImageStyle = StyleSheet.flatten(style) ?? {};

  return (
    <View style={[{ overflow: "hidden", borderRadius }, flatStyle]}>
      {!loaded && !failed && (
        <Skeleton
          width="100%"
          height="100%"
          borderRadius={borderRadius}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      <Animated.Image
        source={source}
        style={[{ width: "100%", height: "100%", opacity }, flatStyle]}
        onLoad={(e) => {
          setLoaded(true);
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }).start();
          onLoad?.(e);
        }}
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
        {...rest}
      />

      {expandable && loaded && !failed && (
        <Pressable
          onPress={() => setExpanded(true)}
          hitSlop={6}
          style={styles.expandButton}
        >
          <MaterialCommunityIcons name="arrow-expand" size={14} color="#fff" />
        </Pressable>
      )}

      {expandable && (
        <ImageViewerModal
          visible={expanded}
          source={source}
          onClose={() => setExpanded(false)}
        />
      )}
    </View>
  );
};

export default LoadingImage;

const styles = StyleSheet.create({
  expandButton: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});
