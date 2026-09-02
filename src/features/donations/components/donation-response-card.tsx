import React from "react";
import { View, Text, Pressable } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { DonationResponse } from "@/features/donations/types/donation.types";

interface DonationResponseCardProps {
  response: DonationResponse;
  isOwner?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const STATUS_META: Record<
  DonationResponse["status"],
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: "success" | "warning" | "error" }
> = {
  pending: { label: "Pending", icon: "clock-outline", tone: "warning" },
  approved: { label: "Approved", icon: "check-circle-outline", tone: "success" },
  rejected: { label: "Declined", icon: "close-circle-outline", tone: "error" },
};

const DonationResponseCard: React.FC<DonationResponseCardProps> = ({
  response,
  isOwner = false,
  onApprove,
  onReject,
}) => {
  const { colors } = useTheme();
  const statusMeta = STATUS_META[response.status];
  const statusColor = colors[statusMeta.tone];

  return (
    <View
      className="rounded-xl border p-3 gap-2"
      style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-semibold flex-1" style={{ color: colors.text }} numberOfLines={1}>
          {response.responderFacility}
        </Text>
        <View className="flex-row items-center gap-1 px-2 py-[3px] rounded-md" style={{ backgroundColor: statusColor + "18" }}>
          <MaterialCommunityIcons name={statusMeta.icon} size={12} color={statusColor} />
          <Text className="text-[10px] font-bold" style={{ color: statusColor }}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        {response.items.map((item) => (
          <View key={item.id} className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons name="tray-full" size={13} color={colors.textSecondary} />
            <Text className="text-xs flex-1" style={{ color: colors.text }} numberOfLines={1}>
              {item.requestedQuantity} × {item.product}
            </Text>
          </View>
        ))}
      </View>

      {response.comment ? (
        <Text className="text-xs leading-[17px] italic" style={{ color: colors.textSecondary }}>{response.comment}</Text>
      ) : null}

      <View className="flex-row justify-between items-center mt-0.5">
        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
          {format(response.createdAt)}
        </Text>

        {isOwner && response.status === "pending" && (onApprove || onReject) && (
          <View className="flex-row gap-2">
            {onReject && (
              <Pressable
                onPress={onReject}
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: colors.error + "18" }}
              >
                <MaterialCommunityIcons name="close" size={13} color={colors.error} />
                <Text className="text-[11px] font-bold" style={{ color: colors.error }}>Decline</Text>
              </Pressable>
            )}
            {onApprove && (
              <Pressable
                onPress={onApprove}
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: colors.success + "18" }}
              >
                <MaterialCommunityIcons name="check" size={13} color={colors.success} />
                <Text className="text-[11px] font-bold" style={{ color: colors.success }}>Approve</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default DonationResponseCard;

