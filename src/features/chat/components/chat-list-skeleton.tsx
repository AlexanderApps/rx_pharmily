import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "@/shared/components/skeleton";

const ChatListSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={styles.body}>
            <View style={styles.topLine}>
              <Skeleton width="45%" height={13} />
              <Skeleton width={32} height={11} />
            </View>
            <Skeleton width="65%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default ChatListSkeleton;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  body: { flex: 1 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
