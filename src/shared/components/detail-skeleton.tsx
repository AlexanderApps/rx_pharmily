import React from "react";
import { View, StyleSheet } from "react-native";
import Skeleton from "@/shared/components/skeleton";

interface DetailSkeletonProps {
  // How many secondary content rows to show below the header block —
  // different detail screens have different amounts of content, so this
  // is tunable rather than a fixed shape.
  rows?: number;
}

// A generic stand-in for "a detail screen is loading its one record" —
// not pixel-matched to any specific screen's real layout, but close
// enough in shape (a title block, a couple of meta lines, a few content
// rows) that it reads as "this is loading," not "this is empty," which
// is the whole point: replacing a premature "not found" flash with
// something that visibly means "wait," not "there's nothing here."
const DetailSkeleton: React.FC<DetailSkeletonProps> = ({ rows = 4 }) => {
  return (
    <View style={styles.container}>
      <Skeleton width="60%" height={22} borderRadius={6} />
      <View style={{ height: 10 }} />
      <Skeleton width="40%" height={14} borderRadius={6} />
      <View style={{ height: 24 }} />

      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={40} height={40} borderRadius={10} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={14} borderRadius={6} />
            <Skeleton width="45%" height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default DetailSkeleton;

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
});
