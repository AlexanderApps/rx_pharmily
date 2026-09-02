import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Text,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "@/shared/hooks/use-theme";
import { AdMedia } from "@/features/ads/types/ads.types";
import LoadingImage from "@/shared/components/loading-image";

interface AdMediaCarouselProps {
  media: AdMedia[];
}

const CAROUSEL_HEIGHT = 220;

const SingleVideoAttachment: React.FC<{ uri: string }> = ({ uri }) => {
  const { colors } = useTheme();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundElement }}>
      <VideoView
        player={player}
        style={{ width: "100%", height: CAROUSEL_HEIGHT }}
        nativeControls
        allowsFullscreen
        contentFit="cover"
      />
    </View>
  );
};

const AdMediaCarousel: React.FC<AdMediaCarouselProps> = ({ media }) => {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  // Measured from the actual rendered container rather than guessed from
  // screen width — a guess drifts from the real width whenever this sits in
  // a different padding context, which is what breaks paging/swipe.
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth((prev) => (Math.abs(prev - width) > 1 ? width : prev));
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: containerWidth,
      offset: containerWidth * index,
      index,
    }),
    [containerWidth],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerWidth === 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
      setActiveIndex((prev) => (prev !== index ? index : prev));
    },
    [containerWidth],
  );

  const imageStyle = useMemo(
    () => [{ height: CAROUSEL_HEIGHT, borderRadius: 12 }, { width: containerWidth, backgroundColor: colors.backgroundElement }],
    [containerWidth, colors.backgroundElement],
  );

  if (media.length === 0) return null;

  if (media.length === 1 && media[0].type === "video") {
    return <SingleVideoAttachment uri={media[0].uri} />;
  }

  return (
    <View onLayout={handleLayout}>
      {containerWidth > 0 && (
        <FlatList
          data={media}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={containerWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          bounces={false}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => (
            <View style={{ width: containerWidth }}>
              <LoadingImage source={{ uri: item.uri }} style={imageStyle} resizeMode="cover" expandable />
            </View>
          )}
        />
      )}

      {media.length > 1 && (
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-[5px]">
            {media.map((_, index) => (
              <View
                key={index}
                className="h-1.5 rounded-[3px]"
                style={{
                  backgroundColor: index === activeIndex ? colors.primary : colors.border,
                  width: index === activeIndex ? 16 : 6,
                }}
              />
            ))}
          </View>
          <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
            {activeIndex + 1}/{media.length}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AdMediaCarousel;

