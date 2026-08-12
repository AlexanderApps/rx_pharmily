import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { DonationCardData } from "@/features/donations/types/donation.types";

interface DonationCardProps {
  donation: DonationCardData;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean; // Controls status/action privacy visibility
  isLastItem?: boolean; // Controls bottom border rendering inside a list wrapper
}

const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
  isLastItem = false,
}) => {
  const { colors } = useTheme();

  const formatDate = (date: Date): string => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Status mapping for Creator views
  const getStatusBadgeConfig = () => {
    switch (donation.status) {
      case "opened":
        return {
          bg: colors.success + "20",
          text: colors.success,
          label: `${donation.itemCount} Items`,
        };
      case "hidden":
        return {
          bg: colors.warning + "20",
          text: colors.warning,
          label: "Hidden",
        };
      case "closed":
      default:
        return {
          bg: colors.error + "20",
          text: colors.error,
          label: "Closed",
        };
    }
  };

  const statusConfig = getStatusBadgeConfig();
  const formattedDate = formatDate(donation.createdAt);

  return (
    <TouchableOpacity
      style={[
        styles.requestRow,
        !isLastItem && {
          borderBottomColor: colors.border,
          borderBottomWidth: 0.5,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.flexRowRow}>
        {/* Pill Icon Box */}
        <View
          style={[
            styles.pillIconBg,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <MaterialCommunityIcons
            name="hospital-box-outline"
            size={22}
            color={colors.secondary}
          />
        </View>

        {/* Info Block */}
        <View style={styles.requestMetaBlock}>
          <Text
            style={[styles.facilityName, { color: colors.text }]}
            numberOfLines={1}
          >
            {donation.facilityName}
          </Text>
          <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
            {donation.itemCount} {donation.itemCount === 1 ? "item" : "items"}{" "}
            available
          </Text>

          <View style={styles.locationWrapper}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.locationText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {donation.location}
            </Text>
          </View>
        </View>

        {/* Right Action/Status Block */}
        <View style={styles.statusBlockContainer}>
          {showActions ? (
            /* Creator Status Badge */
            <View
              style={[styles.badgeBase, { backgroundColor: statusConfig.bg }]}
            >
              <Text style={[styles.badgeText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          ) : (
            /* Market View Generic Badge */
            <View
              style={[
                styles.badgeBase,
                { backgroundColor: colors.info + "20" },
              ]}
            >
              <Text style={[styles.badgeTextInfo, { color: colors.info }]}>
                Available
              </Text>
            </View>
          )}

          <Text style={[styles.timeAgoText, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Mini Actions Row for Creator */}
      {showActions && (onEdit || onDelete) && (
        <View style={styles.miniActionsRow}>
          {onEdit && (
            <TouchableOpacity style={styles.miniActionButton} onPress={onEdit}>
              <MaterialCommunityIcons
                name="pencil"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.miniActionLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.miniActionButton}
              onPress={onDelete}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={14}
                color={colors.error}
              />
              <Text style={[styles.miniActionLabel, { color: colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
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
    paddingRight: 4,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemCountText: {
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
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextInfo: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeAgoText: {
    fontSize: 12,
    marginTop: 8,
  },
  miniActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 16,
  },
  miniActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniActionLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default DonationCard;
