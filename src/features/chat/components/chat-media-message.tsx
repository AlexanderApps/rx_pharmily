import React from "react";
import { View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useTheme } from "@/shared/hooks/use-theme";
import { ChatMedia } from "@/features/chat/types/chat.types";
import LoadingImage from "@/shared/components/loading-image";

interface ChatMediaMessageProps {
  media: ChatMedia;
}

// Split out so useVideoPlayer (a hook) only runs when a video is actually
// being rendered — same pattern used in Posts'/Ads' media carousels.
const ChatVideoMessage: React.FC<{ uri: string }> = ({ uri }) => {
  const { colors } = useTheme();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View
      className="w-[220px] h-[220px] rounded-[14px] overflow-hidden"
      style={{ backgroundColor: colors.backgroundElement }}
    >
      <VideoView
        player={player}
        className="w-[220px] h-[220px] rounded-[14px]"
        nativeControls
        contentFit="cover"
        fullscreenOptions={{ enable: true }}
      />
    </View>
  );
};

const ChatMediaMessage: React.FC<ChatMediaMessageProps> = ({ media }) => {
  if (media.type === "video") {
    return <ChatVideoMessage uri={media.uri} />;
  }

  return (
    <LoadingImage
      source={{ uri: media.uri }}
      style={{ width: 220, height: 220, borderRadius: 14 }}
      borderRadius={14}
      resizeMode="cover"
      expandable
    />
  );
};

export default ChatMediaMessage;