import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
      className="p-4"
      style={!isLastItem ? { borderBottomColor: colors.border, borderBottomWidth: 0.5 } : undefined}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Pill Icon Box */}
        <View
          className="w-12 h-12 rounded-xl justify-center items-center"
          style={{ backgroundColor: colors.backgroundElement }}
        >
          <MaterialCommunityIcons
            name="hospital-box-outline"
            size={22}
            color={colors.secondary}
          />
        </View>

        {/* Info Block */}
        <View className="flex-1 ml-3 pr-1">
          <Text
            className="text-base font-semibold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {donation.facilityName}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
            {donation.itemCount} {donation.itemCount === 1 ? "item" : "items"}{" "}
            available
          </Text>

          <View className="flex-row items-center mt-1.5">
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text
              className="text-[13px] ml-1"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {donation.location}
            </Text>
          </View>
        </View>

        {/* Right Action/Status Block */}
        <View className="items-end justify-between min-h-12">
          {showActions ? (
            /* Creator Status Badge */
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: statusConfig.bg }}
            >
              <Text className="text-xs font-semibold" style={{ color: statusConfig.text }}>
                {statusConfig.label}
              </Text>
            </View>
          ) : (
            /* Market View Generic Badge */
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: colors.info + "20" }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.info }}>
                Available
              </Text>
            </View>
          )}

          <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Mini Actions Row for Creator */}
      {showActions && (onEdit || onDelete) && (
        <View className="flex-row justify-end mt-3 gap-4">
          {onEdit && (
            <TouchableOpacity className="flex-row items-center gap-1" onPress={onEdit}>
              <MaterialCommunityIcons
                name="pencil"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                className="text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              className="flex-row items-center gap-1"
              onPress={onDelete}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={14}
                color={colors.error}
              />
              <Text className="text-xs font-medium" style={{ color: colors.error }}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default DonationCard;

