import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "timeago.js";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useTheme } from "@/shared/hooks/use-theme";

interface RequestCardRowProps {
  item: RxRfqCardData;
  isLastItem: boolean;
  onPress?: (item: RxRfqCardData) => void;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const RequestCardRow = ({
  item,
  isLastItem,
  onPress,
  iconName = "office-building",
}: RequestCardRowProps) => {
  const { colors } = useTheme();
  const hasResponses = item.responseCount > 0;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[
        styles.row,
        !isLastItem && {
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Icon */}
        <View
          style={[
            styles.iconBlock,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={22}
            color={colors.secondary}
          />
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.facilityName}
          </Text>
          <Text
            style={[styles.code, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.code}
          </Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.facilityLocation}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusBlock}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: hasResponses
                  ? colors.success + "20"
                  : colors.info + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: hasResponses ? colors.success : colors.info },
              ]}
            >
              {hasResponses ? `${item.responseCount} responses` : "Awaiting"}
            </Text>
          </View>
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {format(item.publishedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    padding: 16,
  },
  inner: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBlock: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  meta: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
  },
  code: {
    fontSize: 13,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
  },
  statusBlock: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 48,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  timeAgo: {
    fontSize: 12,
  },
});
