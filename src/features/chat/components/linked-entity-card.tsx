import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { ChatLinkedEntity } from "@/features/chat/types/chat.types";

const ENTITY_META: Record<
  ChatLinkedEntity["type"],
  { icon: string; label: string }
> = {
  rfq: { icon: "file-document-outline", label: "RFQ" },
  mediscope: { icon: "heart-search", label: "Mediscope" },
  donation: { icon: "heart-outline", label: "Donation" },
};

function navigateToEntity(entity: ChatLinkedEntity) {
  switch (entity.type) {
    case "rfq":
      router.push({
        pathname: "/rfqs/rxrfq-details-screen",
        params: { id: entity.id },
      });
      return;
    case "mediscope":
      // Mediscope doesn't have a per-item detail screen yet — land on the
      // feature's home screen rather than a broken deep link.
      router.push("/mediscope");
      return;
    case "donation":
      router.push("/donations");
      return;
  }
}

interface LinkedEntityCardProps {
  entity: ChatLinkedEntity;
  compact?: boolean;
}

const LinkedEntityCard: React.FC<LinkedEntityCardProps> = ({
  entity,
  compact = false,
}) => {
  const { colors } = useTheme();
  const meta = ENTITY_META[entity.type];
  const statusColor =
    entity.status === "published" || entity.status === "awarded"
      ? colors.success
      : entity.status === "expired" || entity.status === "cancelled"
        ? colors.error
        : colors.warning;

  return (
    <Pressable
      onPress={() => navigateToEntity(entity)}
      className={`flex-row items-center gap-2.5 border rounded-xl p-2.5 active:opacity-75 ${
        compact ? "" : "min-w-[230px] max-w-[280px]"
      }`}
      style={{
        backgroundColor: colors.backgroundElement,
        borderColor: colors.border,
      }}
    >
      <View
        className="w-[34px] h-[34px] rounded-[9px] items-center justify-center"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        <MaterialCommunityIcons
          name={meta.icon as any}
          size={18}
          color={colors.primary}
        />
      </View>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-1.5">
          <Text
            className="text-[10px] font-semibold uppercase"
            style={{ color: colors.textSecondary }}
          >
            {meta.label} · {entity.code}
          </Text>
          <View
            className="px-1.5 py-px rounded-[5px]"
            style={{ backgroundColor: statusColor + "18" }}
          >
            <Text
              className="text-[9px] font-bold capitalize"
              style={{ color: statusColor }}
            >
              {entity.status}
            </Text>
          </View>
        </View>

        <Text
          className="text-[13px] font-semibold"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {entity.title}
        </Text>

        {entity.subtitle ? (
          <Text
            className="text-[11px]"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {entity.subtitle}
          </Text>
        ) : null}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
};

export default LinkedEntityCard;