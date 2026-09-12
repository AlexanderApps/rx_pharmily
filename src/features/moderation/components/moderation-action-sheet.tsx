import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import BottomSheet from "@/shared/components/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import { useModerationStore } from "@/features/moderation/hooks/use-moderation-data";
import { ModerationActionType } from "@/features/moderation/types/moderation.types";
import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";

export interface ModerationActionSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface ModerationActionSheetProps {
  entityType: ProfileUpdateEntityType;
  entityId: string;
  entityName: string;
  isBanned: boolean;
  isSuspended: boolean;
  onActionComplete?: () => void;
}

type Step = "overview" | "ban" | "suspend";

const ACTION_LABELS: Record<ModerationActionType, string> = {
  banned: "Banned",
  unbanned: "Ban lifted",
  suspended: "Suspended",
  unsuspended: "Suspension lifted",
  suspension_expired: "Suspension expired",
};

const ModerationActionSheet = forwardRef<ModerationActionSheetRef, ModerationActionSheetProps>(
  ({ entityType, entityId, entityName, isBanned, isSuspended, onActionComplete }, ref) => {
    const { colors } = useTheme();
    const sheetRef = React.useRef<BottomSheetModal>(null);
    const [step, setStep] = useState<Step>("overview");
    const [reason, setReason] = useState("");
    const [durationDays, setDurationDays] = useState("7");
    const [submitting, setSubmitting] = useState(false);

    const banEntity = useModerationStore((state) => state.banEntity);
    const suspendEntity = useModerationStore((state) => state.suspendEntity);
    const liftRestriction = useModerationStore((state) => state.liftRestriction);
    const fetchHistory = useModerationStore((state) => state.fetchHistory);
    const history = useModerationStore((state) => state.history[`${entityType}:${entityId}`]);

    useImperativeHandle(ref, () => ({
      present: () => {
        setStep("overview");
        setReason("");
        setDurationDays("7");
        fetchHistory(entityType, entityId);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleBan = async () => {
      if (!reason.trim()) {
        toast.error("A reason is required.");
        return;
      }
      const confirmed = await confirm({
        title: `Ban ${entityName}?`,
        message: "This is permanent. They'll lose access immediately and won't be able to sign back in unless the ban is later lifted.",
        confirmLabel: "Ban",
        destructive: true,
      });
      if (!confirmed) return;

      setSubmitting(true);
      const ok = await banEntity(entityType, entityId, reason.trim());
      setSubmitting(false);
      if (ok) {
        toast.success(`${entityName} has been banned.`);
        onActionComplete?.();
        sheetRef.current?.dismiss();
      } else {
        toast.error("Couldn't ban this account. Please try again.");
      }
    };

    const handleSuspend = async () => {
      if (!reason.trim()) {
        toast.error("A reason is required.");
        return;
      }
      const days = parseInt(durationDays, 10);
      if (!days || days < 1) {
        toast.error("Enter a valid number of days.");
        return;
      }
      const confirmed = await confirm({
        title: `Suspend ${entityName}?`,
        message: `They'll lose access for ${days} day${days === 1 ? "" : "s"}, then it lifts automatically.`,
        confirmLabel: "Suspend",
        destructive: true,
      });
      if (!confirmed) return;

      setSubmitting(true);
      const ok = await suspendEntity(entityType, entityId, reason.trim(), days);
      setSubmitting(false);
      if (ok) {
        toast.success(`${entityName} has been suspended for ${days} day${days === 1 ? "" : "s"}.`);
        onActionComplete?.();
        sheetRef.current?.dismiss();
      } else {
        toast.error("Couldn't suspend this account. Please try again.");
      }
    };

    const handleLift = async () => {
      const confirmed = await confirm({
        title: `Restore access for ${entityName}?`,
        message: isBanned ? "This lifts the ban and restores full access." : "This ends the suspension early and restores full access.",
        confirmLabel: "Restore access",
      });
      if (!confirmed) return;

      setSubmitting(true);
      const ok = await liftRestriction(entityType, entityId);
      setSubmitting(false);
      if (ok) {
        toast.success(`Access restored for ${entityName}.`);
        onActionComplete?.();
        sheetRef.current?.dismiss();
      } else {
        toast.error("Couldn't restore access. Please try again.");
      }
    };

    return (
      <BottomSheet ref={sheetRef} snapPoints={["70%", "90%"]}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="px-5 pt-2 pb-10 gap-4">
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              {entityName}
            </Text>

            {step === "overview" && (
              <>
                <View
                  className="flex-row items-center gap-2 px-3.5 py-3 rounded-xl"
                  style={{ backgroundColor: (isBanned || isSuspended ? colors.error : colors.success) + "14" }}
                >
                  <MaterialCommunityIcons
                    name={isBanned ? "account-cancel-outline" : isSuspended ? "account-clock-outline" : "account-check-outline"}
                    size={18}
                    color={isBanned || isSuspended ? colors.error : colors.success}
                  />
                  <Text className="text-sm font-semibold" style={{ color: isBanned || isSuspended ? colors.error : colors.success }}>
                    {isBanned ? "Currently banned" : isSuspended ? "Currently suspended" : "Active — no restrictions"}
                  </Text>
                </View>

                {isBanned || isSuspended ? (
                  <Pressable
                    onPress={handleLift}
                    disabled={submitting}
                    className="py-3.5 rounded-xl items-center"
                    style={{ backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? <ActivityIndicator color="#fff" /> : (
                      <Text className="text-white text-[15px] font-semibold">Restore Access</Text>
                    )}
                  </Pressable>
                ) : (
                  <View className="gap-2.5">
                    <Pressable
                      onPress={() => setStep("suspend")}
                      className="py-3.5 rounded-xl items-center"
                      style={{ backgroundColor: colors.warning }}
                    >
                      <Text className="text-white text-[15px] font-semibold">Suspend Temporarily</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setStep("ban")}
                      className="py-3.5 rounded-xl items-center"
                      style={{ backgroundColor: colors.error }}
                    >
                      <Text className="text-white text-[15px] font-semibold">Ban Permanently</Text>
                    </Pressable>
                  </View>
                )}

                <View className="gap-2.5 mt-2">
                  <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                    History
                  </Text>
                  {!history ? (
                    <ActivityIndicator color={colors.textSecondary} />
                  ) : history.length === 0 ? (
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      No moderation actions on record.
                    </Text>
                  ) : (
                    history.map((event) => (
                      <View key={event.id} className="gap-0.5 pb-2.5" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>
                          {ACTION_LABELS[event.actionType]}
                        </Text>
                        {event.reason && (
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {event.reason}
                          </Text>
                        )}
                        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                          {event.createdAt.toLocaleString()}
                          {event.performedByName ? ` · ${event.performedByName}` : ""}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {step === "ban" && (
              <>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Banning is permanent. Explain why — this is kept on record.
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Reason for banning"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  className="rounded-xl p-3.5 text-sm min-h-[90px]"
                  style={{ backgroundColor: colors.backgroundElement, color: colors.text, textAlignVertical: "top" }}
                />
                <Pressable
                  onPress={handleBan}
                  disabled={submitting}
                  className="py-3.5 rounded-xl items-center"
                  style={{ backgroundColor: colors.error, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : (
                    <Text className="text-white text-[15px] font-semibold">Confirm Ban</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setStep("overview")} className="py-2 items-center">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>Cancel</Text>
                </Pressable>
              </>
            )}

            {step === "suspend" && (
              <>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Suspension lifts automatically after the duration below. Explain why — this is kept on record.
                </Text>
                <View className="gap-1.5">
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>Duration (days)</Text>
                  <TextInput
                    value={durationDays}
                    onChangeText={setDurationDays}
                    keyboardType="number-pad"
                    className="rounded-xl px-3.5 py-3 text-sm"
                    style={{ backgroundColor: colors.backgroundElement, color: colors.text }}
                  />
                </View>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Reason for suspending"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  className="rounded-xl p-3.5 text-sm min-h-[90px]"
                  style={{ backgroundColor: colors.backgroundElement, color: colors.text, textAlignVertical: "top" }}
                />
                <Pressable
                  onPress={handleSuspend}
                  disabled={submitting}
                  className="py-3.5 rounded-xl items-center"
                  style={{ backgroundColor: colors.warning, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : (
                    <Text className="text-white text-[15px] font-semibold">Confirm Suspension</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setStep("overview")} className="py-2 items-center">
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </BottomSheet>
    );
  },
);

ModerationActionSheet.displayName = "ModerationActionSheet";

export default ModerationActionSheet;
