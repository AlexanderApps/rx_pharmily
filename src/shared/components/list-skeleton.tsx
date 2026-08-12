import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "@/shared/components/skeleton";

interface ListSkeletonProps {
  rows?: number;
  // Card-style rows (formulary requests, RFQ cards) are taller and don't
  // have a leading avatar circle the way a simple list row does — this
  // switches between the two shapes rather than trying to be one
  // generic shape that fits neither well.
  variant?: "row" | "card";
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 5, variant = "row" }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, i) =>
        variant === "card" ? (
          <View key={i} style={styles.card}>
            <Skeleton width="55%" height={14} borderRadius={6} />
            <View style={{ height: 8 }} />
            <Skeleton width="80%" height={12} borderRadius={6} />
            <View style={{ height: 6 }} />
            <Skeleton width="35%" height={12} borderRadius={6} />
          </View>
        ) : (
          <View key={i} style={styles.row}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={13} borderRadius={6} />
              <Skeleton width="40%" height={11} borderRadius={6} />
            </View>
          </View>
        ),
      )}
    </View>
  );
};

export default ListSkeleton;

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  card: { borderRadius: 12, padding: 14 },
});
