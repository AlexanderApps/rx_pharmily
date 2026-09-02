import React, { forwardRef, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
      <View className="flex-row justify-between items-center px-5 py-4 border-b" style={{ borderBottomColor: colors.border }}>
        <Text className="text-[17px] font-bold" style={{ color: colors.text }}>RFQ Actions</Text>
        <TouchableOpacity
          onPress={() =>
            (ref as React.RefObject<BottomSheetModal>).current?.dismiss()
          }
          className="p-1"
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-4 pb-[30px] gap-2.5">
        {confirming ? (
          <View className="items-center gap-2 pt-2.5">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-1"
              style={{ backgroundColor: colors.error + "18" }}
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={28}
                color={colors.error}
              />
            </View>
            <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
              {confirming.label}?
            </Text>
            <Text
              className="text-[13px] text-center px-2.5 leading-[19px]"
              style={{ color: colors.textSecondary }}
            >
              {confirming.description} This action cannot be undone.
            </Text>
            <View className="flex-row gap-2.5 w-full mt-4">
              <TouchableOpacity
                className="flex-1 rounded-[10px] border py-[13px] items-center"
                style={{
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                }}
                onPress={() => setConfirming(null)}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.text }}
                >
                  Go Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-[10px] py-[13px] items-center"
                style={{ backgroundColor: colors.error }}
                onPress={handleConfirm}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.backgroundSecondary }}
                >
                  {confirming.label}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : actions.length === 0 ? (
          <View className="items-center gap-2 py-[30px]">
            <MaterialCommunityIcons
              name="information-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text className="text-[13px] text-center px-5" style={{ color: colors.textSecondary }}>
              No further actions are available for this RFQ's current status.
            </Text>
          </View>
        ) : (
          actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              className="flex-row items-center gap-3 rounded-xl border p-3.5"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.backgroundElement,
              }}
              onPress={() => handlePress(action)}
              activeOpacity={0.7}
            >
              <View
                className="w-[38px] h-[38px] rounded-[10px] items-center justify-center"
                style={{
                  backgroundColor: action.destructive
                    ? colors.error + "18"
                    : colors.backgroundSecondary,
                }}
              >
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={20}
                  color={action.destructive ? colors.error : colors.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: action.destructive ? colors.error : colors.text }}
                >
                  {action.label}
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textSecondary }}
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

export default RxRfqStatusActionsSheet;

