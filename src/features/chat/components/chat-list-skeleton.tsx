import React from "react";
import { View } from "react-native";
import Skeleton from "@/shared/components/skeleton";

const ChatListSkeleton: React.FC = () => {
  return (
    <View className="px-4 pt-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row items-center gap-3 py-2.5">
          <Skeleton width={44} height={44} borderRadius={22} />
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Skeleton width="45%" height={13} />
              <Skeleton width={32} height={11} />
            </View>
            <Skeleton width="65%" height={12} className="mt-1.5" />
          </View>
        </View>
      ))}
    </View>
  );
};

export default ChatListSkeleton;