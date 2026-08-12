import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface RequestItem {
  id: string | number;
  medication: string;
  strength: string;
  location?: string;
  status: "responses" | "awaiting" | string;
  responses?: number | string;
  time: string;
}

interface RequestCardRowProps {
  item: RequestItem;
  isLastItem: boolean;
  onPress?: (item: RequestItem) => void;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  colors: {
    text: string;
    textSecondary: string;
    border: string;
    backgroundElement: string;
    secondary: string;
  };
}

export const RequestCardRow = ({
  item,
  isLastItem,
  onPress,
  iconName = "pill",
  colors,
}: RequestCardRowProps) => {
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[
        styles.requestRow,
        !isLastItem && {
          borderBottomColor: colors.border,
          borderBottomWidth: 0.5,
        },
      ]}
    >
      <View style={styles.flexRowRow}>
        {/* Left Icon Block */}
        <View
          style={[
            styles.pillIconBg,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={22}
            color={colors.secondary}
          />
        </View>

        {/* Middle Metadata Block */}
        <View style={styles.requestMetaBlock}>
          <Text style={[styles.medicationName, { color: colors.text }]}>
            {item.medication}
          </Text>
          <Text style={[styles.strengthText, { color: colors.textSecondary }]}>
            {item.strength}
          </Text>
          <View style={styles.locationWrapper}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
            >
              {item.location || "Accra, Greater Accra"}
            </Text>
          </View>
        </View>

        {/* Right Status Block */}
        <View style={styles.statusBlockContainer}>
          {item.status === "responses" ? (
            <View style={[styles.badgeBase, styles.badgeSuccess]}>
              <Text style={styles.badgeTextSuccess}>
                {item.responses} Responses
              </Text>
            </View>
          ) : (
            <View style={[styles.badgeBase, styles.badgeInfo]}>
              <Text style={styles.badgeTextInfo}>Awaiting</Text>
            </View>
          )}
          <Text style={[styles.timeAgoText, { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  requestRow: {
    padding: 16,
  },
  flexRowRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pillIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  requestMetaBlock: {
    flex: 1,
    marginLeft: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
  },
  strengthText: {
    fontSize: 14,
    marginTop: 2,
  },
  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
  },
  statusBlockContainer: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 48,
  },
  badgeBase: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  badgeInfo: {
    backgroundColor: "#DBEAFE",
  },
  badgeTextSuccess: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextInfo: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
  },
  timeAgoText: {
    fontSize: 12,
    marginTop: 8,
  },
});
