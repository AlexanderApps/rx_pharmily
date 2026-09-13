import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { ContentModerationType } from "@/features/content-moderation/types/content-moderation.types";

interface ModerationNoticeProps {
  contentType: ContentModerationType;
  isRemoved: boolean;
  removedReason?: string;
}

const CONTENT_LABEL: Record<ContentModerationType, string> = {
  rxrfq: "RFQ",
  rxrfq_response: "response",
  mediscope_request: "MediScope request",
  mediscope_response: "response",
  job: "job listing",
  job_application: "application",
  donation: "donation listing",
  donation_response: "claim",
};

// Read-only, deliberately — moderation itself (removing/restoring) is
// an admin tool, consolidated in app/admin/content-moderation.tsx
// (search by code/id, remove with a required reason), not scattered
// across 6 public-facing detail screens. This component's only job is
// telling whoever's looking at removed content that it's removed and
// why — that's user-facing information, not an admin action, so it
// stays here regardless of who's viewing.
export default function ModerationControl({
  contentType,
  isRemoved,
  removedReason,
}: ModerationNoticeProps) {
  const { colors } = useTheme();

  if (!isRemoved) return null;

  const label = CONTENT_LABEL[contentType];

  return (
    <View
      className="flex-row items-start gap-2.5 p-3.5 rounded-xl"
      style={{ backgroundColor: colors.error + "14" }}
    >
      <MaterialCommunityIcons name="eye-off-outline" size={18} color={colors.error} style={{ marginTop: 1 }} />
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold" style={{ color: colors.error }}>
          This {label} has been removed by an admin
        </Text>
        {removedReason && (
          <Text className="text-xs" style={{ color: colors.error }}>
            {removedReason}
          </Text>
        )}
      </View>
    </View>
  );
}
