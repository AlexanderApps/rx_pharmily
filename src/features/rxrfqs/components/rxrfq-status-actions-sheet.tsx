import React, { forwardRef, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import BottomSheet from "@/shared/components/bottom-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RxRfqStatusType } from "@/features/rxrfqs/types/rxrfqs.types";

export interface RxRfqStatusAction {
  key: string;
  label: string;
  description: string;
  icon: string;
  destructive?: boolean;
  targetStatus?: RxRfqStatusType;
}

interface RxRfqStatusActionsSheetProps {
  status: RxRfqStatusType;
  responseCount: number;
  onClose: () => void;
  onAction: (action: RxRfqStatusAction) => void;
}

const getActionsForStatus = (
  status: RxRfqStatusType,
  responseCount: number,
): RxRfqStatusAction[] => {
  switch (status) {
    case "draft":
      return [
        {
          key: "publish",
          label: "Publish RFQ",
          description:
            "Make this RFQ visible to vendors based on your visibility rules.",
          icon: "earth",
          targetStatus: "published",
        },
        {
          key: "cancel",
          label: "Delete Draft",
          description: "Permanently remove this draft RFQ.",
          icon: "trash-can-outline",
          destructive: true,
          targetStatus: "cancelled",
        },
      ];
    case "published":
      return [
        {
          key: "close",
          label: "Close Submissions",
          description:
            "Stop accepting new vendor responses. Existing responses remain visible.",
          icon: "lock-outline",
          targetStatus: "closed",
        },
        {
          key: "cancel",
          label: "Cancel RFQ",
          description:
            "Withdraw this RFQ. Vendors will be notified and can no longer respond.",
          icon: "close-circle-outline",
          destructive: true,
          targetStatus: "cancelled",
        },
      ];
    case "closed":
      return [
        ...(responseCount > 0
          ? [
              {
                key: "award",
                label: "Award Vendor",
                description: "Select a winning response to award this RFQ.",
                icon: "trophy-outline",
              } as RxRfqStatusAction,
            ]
          : []),
        {
          key: "reopen",
          label: "Reopen for Submissions",
          description: "Allow vendors to submit or update responses again.",
          icon: "lock-open-outline",
          targetStatus: "published",
        },
        {
          key: "cancel",
          label: "Cancel RFQ",
          description: "Withdraw this RFQ without awarding a vendor.",
          icon: "close-circle-outline",
          destructive: true,
          targetStatus: "cancelled",
        },
      ];
    case "expired":
      return [
        {
          key: "extend",
          label: "Extend & Republish",
          description: "Extend the deadline to continue accepting responses.",
          icon: "calendar-refresh-outline",
          targetStatus: "published",
        },
        {
          key: "close",
          label: "Close Submissions",
          description: "Mark this RFQ as closed without extending.",
          icon: "lock-outline",
          targetStatus: "closed",
        },
        {
          key: "cancel",
          label: "Cancel RFQ",
          description: "Withdraw this RFQ.",
          icon: "close-circle-outline",
          destructive: true,
          targetStatus: "cancelled",
        },
      ];
    case "awarded":
    case "cancelled":
    default:
      return [];
  }
};

const RxRfqStatusActionsSheet = forwardRef<
  BottomSheetModal,
  RxRfqStatusActionsSheetProps
>(({ status, responseCount, onClose, onAction }, ref) => {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ["60%", "75%"], []);
  const [confirming, setConfirming] = useState<RxRfqStatusAction | null>(null);

  const actions = getActionsForStatus(status, responseCount);

  const handleBottomSheetChange = (index: number) => {
    if (index === -1) {
      setConfirming(null);
      onClose();
    }
  };

  const handlePress = (action: RxRfqStatusAction) => {
    if (action.destructive) {
      setConfirming(action);
      return;
    }
    onAction(action);
  };

  const handleConfirm = () => {
    if (confirming) onAction(confirming);
    setConfirming(null);
  };

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      showHandle
      cornerRadius={20}
      padding={0}
      enablePanDownToClose
      onChange={handleBottomSheetChange}
      backgroundColor={colors.backgroundSecondary}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>RFQ Actions</Text>
        <TouchableOpacity
          onPress={() =>
            (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
          }
          style={styles.closeButton}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {confirming ? (
          <View style={styles.confirmBlock}>
            <View
              style={[
                styles.confirmIcon,
                { backgroundColor: colors.error + "18" },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={28}
                color={colors.error}
              />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              {confirming.label}?
            </Text>
            <Text
              style={[
                styles.confirmDescription,
                { color: colors.textSecondary },
              ]}
            >
              {confirming.description} This action cannot be undone.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[
                  styles.confirmCancelButton,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setConfirming(null)}
              >
                <Text
                  style={[styles.confirmCancelText, { color: colors.text }]}
                >
                  Go Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmDestructiveButton,
                  { backgroundColor: colors.error },
                ]}
                onPress={handleConfirm}
              >
                <Text
                  style={[
                    styles.confirmDestructiveText,
                    { color: colors.backgroundSecondary },
                  ]}
                >
                  {confirming.label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : actions.length === 0 ? (
          <View style={styles.emptyBlock}>
            <MaterialCommunityIcons
              name="information-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No further actions are available for this RFQ's current status.
            </Text>
          </View>
        ) : (
          actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.actionRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  {
                    backgroundColor: action.destructive
                      ? colors.error + "18"
                      : colors.backgroundSecondary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={20}
                  color={action.destructive ? colors.error : colors.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.actionLabel,
                    { color: action.destructive ? colors.error : colors.text },
                  ]}
                >
                  {action.label}
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {action.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))
        )}
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: "700" },
  closeButton: { padding: 4 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 10,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 14, fontWeight: "600" },
  actionDescription: { fontSize: 12, marginTop: 2 },

  emptyBlock: { alignItems: "center", gap: 8, paddingVertical: 30 },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },

  confirmBlock: { alignItems: "center", gap: 8, paddingTop: 10 },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  confirmTitle: { fontSize: 17, fontWeight: "700" },
  confirmDescription: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 19,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 16,
  },
  confirmCancelButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 14, fontWeight: "600" },
  confirmDestructiveButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmDestructiveText: { fontSize: 14, fontWeight: "600" },
});

export default RxRfqStatusActionsSheet;
