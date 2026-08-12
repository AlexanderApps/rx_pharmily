import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
        compact && styles.cardCompact,
      ]}
    >
      <View
        style={[styles.iconWrap, { backgroundColor: colors.backgroundSecondary }]}
      >
        <MaterialCommunityIcons
          name={meta.icon as any}
          size={18}
          color={colors.primary}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.entityTypeLabel, { color: colors.textSecondary }]}
          >
            {meta.label} · {entity.code}
          </Text>
          <View
            style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {entity.status}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {entity.title}
        </Text>
        {entity.subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
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

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    minWidth: 230,
    maxWidth: 280,
  },
  cardCompact: {
    minWidth: 0,
    maxWidth: undefined,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  entityTypeLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  statusPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  statusText: { fontSize: 9, fontWeight: "700", textTransform: "capitalize" },
  title: { fontSize: 13, fontWeight: "600" },
  subtitle: { fontSize: 11 },
});
