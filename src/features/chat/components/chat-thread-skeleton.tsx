import React from "react";
import { View } from "react-native";
import Skeleton from "@/shared/components/skeleton";

const ROW_WIDTHS = [140, 190, 110, 160, 130];

const ChatThreadSkeleton: React.FC = () => {
  return (
    <View className="flex-1 justify-end px-2.5 pb-3 gap-2.5">
      {ROW_WIDTHS.map((width, i) => (
        <View
          key={i}
          className={`flex-row ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton width={width} height={38} borderRadius={18} />
        </View>
      ))}
    </View>
  );
};

export default ChatThreadSkeleton;