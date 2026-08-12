import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "@/shared/components/skeleton";

const ROW_WIDTHS = [140, 190, 110, 160, 130];

const ChatThreadSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {ROW_WIDTHS.map((width, i) => (
        <View
          key={i}
          style={[styles.row, { justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }]}
        >
          <Skeleton width={width} height={38} borderRadius={18} />
        </View>
      ))}
    </View>
  );
};

export default ChatThreadSkeleton;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 10, paddingBottom: 12, gap: 10 },
  row: { flexDirection: "row" },
});
