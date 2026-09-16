import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Redirect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useModerationStore } from "@/features/moderation/hooks/use-moderation-data";
import { ModerationActionType } from "@/features/moderation/types/moderation.types";
import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";

const ACTION_LABELS: Record<ModerationActionType, string> = {
  banned: "Banned",
  unbanned: "Ban lifted",
  suspended: "Suspended",
  unsuspended: "Suspension lifted",
  suspension_expired: "Suspension expired",
};

// Which of this screen's action cards is currently expanded, if any —
// "restore" never actually expands a form (there's no input needed to
// lift a restriction), it goes straight to a confirm() dialog. This is
// deliberately the one piece of state a future action (e.g. ownership
// transfer) would extend, not restructure — add a new value here, a
// new card below, and the rest of the screen's layout is untouched.
type ExpandedAction = "suspend" | "ban" | null;

export default function AdminModerationDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { entityType, entityId } = useLocalSearchParams<{ entityType: ProfileUpdateEntityType; entityId: string }>();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const [expandedAction, setExpandedAction] = useState<ExpandedAction>(null);
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [submitting, setSubmitting] = useState(false);
  // Independent of expandedAction (which is action cards, mutually
  // exclusive) — these are purely informational, so there's no reason
  // they can't both be open, or open alongside an action card, at once.
  const [showDetails, setShowDetails] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const allUsers = useProfileStore((state) => state.allUsers);
  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const fetchAllUsers = useProfileStore((state) => state.fetchAllUsers);
  const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
  const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);

  const banEntity = useModerationStore((state) => state.banEntity);
  const suspendEntity = useModerationStore((state) => state.suspendEntity);
  const liftRestriction = useModerationStore((state) => state.liftRestriction);
  const fetchHistory = useModerationStore((state) => state.fetchHistory);
  const history = useModerationStore((state) => state.history[`${entityType}:${entityId}`]);
  const fetchEntityDetails = useModerationStore((state) => state.fetchEntityDetails);
  const isLoadingDetails = useModerationStore((state) => state.isLoadingDetails);
  const details = useModerationStore((state) => state.entityDetails[`${entityType}:${entityId}`]);
  const fetchEntityActivity = useModerationStore((state) => state.fetchEntityActivity);
  const isLoadingActivity = useModerationStore((state) => state.isLoadingActivity);
  const activity = useModerationStore((state) => state.entityActivity[`${entityType}:${entityId}`]);

  useEffect(() => {
    if (!isAdmin || !entityType || !entityId) return;
    // Looked up from the store by id rather than passed through as a
    // route param — this screen is reachable by deep link (not just
    // from the list screen it's usually opened from), so it needs to
    // be able to resolve the entity's current name/status on its own
    // rather than trusting whatever a caller happened to pass in.
    if (entityType === "user") fetchAllUsers();
    else if (entityType === "facility") fetchFacilities();
    else fetchOrganizations();
    fetchHistory(entityType, entityId);
  }, [isAdmin, entityType, entityId]);

  const entity = useMemo(() => {
    if (!entityType || !entityId) return null;
    if (entityType === "user") {
      const u = allUsers.find((u) => u.id === entityId);
      return u ? { name: u.fullName || u.email, isBanned: u.isBanned, isSuspended: u.isSuspended } : null;
    }
    if (entityType === "facility") {
      const f = facilities.find((f) => f.id === entityId);
      return f ? { name: f.name, isBanned: f.isBanned, isSuspended: f.isSuspended } : null;
    }
    const o = organizations.find((o) => o.id === entityId);
    return o ? { name: o.name, isBanned: o.isBanned, isSuspended: o.isSuspended } : null;
  }, [entityType, entityId, allUsers, facilities, organizations]);

  if (!isAdmin) return <Redirect href="/(tabs)" />;
  if (!entityType || !entityId) return <Redirect href="/admin/moderation" />;

  const resetForm = () => {
    setExpandedAction(null);
    setReason("");
    setDurationDays("7");
  };

  const handleBan = async () => {
    if (!entity) return;
    if (!reason.trim()) {
      toast.error("A reason is required.");
      return;
    }
    const confirmed = await confirm({
      title: `Ban ${entity.name}?`,
      message: "This is permanent. They'll lose access immediately and won't be able to sign back in unless the ban is later lifted.",
      confirmLabel: "Ban",
      destructive: true,
    });
    if (!confirmed) return;

    setSubmitting(true);
    const ok = await banEntity(entityType, entityId, reason.trim());
    setSubmitting(false);
    if (ok) {
      toast.success(`${entity.name} has been banned.`);
      resetForm();
    } else {
      toast.error("Couldn't ban this account. Please try again.");
    }
  };

  const handleSuspend = async () => {
    if (!entity) return;
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
      title: `Suspend ${entity.name}?`,
      message: `They'll lose access for ${days} day${days === 1 ? "" : "s"}, then it lifts automatically.`,
      confirmLabel: "Suspend",
      destructive: true,
    });
    if (!confirmed) return;

    setSubmitting(true);
    const ok = await suspendEntity(entityType, entityId, reason.trim(), days);
    setSubmitting(false);
    if (ok) {
      toast.success(`${entity.name} has been suspended for ${days} day${days === 1 ? "" : "s"}.`);
      resetForm();
    } else {
      toast.error("Couldn't suspend this account. Please try again.");
    }
  };

  const handleLift = async () => {
    if (!entity) return;
    const confirmed = await confirm({
      title: `Restore access for ${entity.name}?`,
      message: entity.isBanned ? "This lifts the ban and restores full access." : "This ends the suspension early and restores full access.",
      confirmLabel: "Restore access",
    });
    if (!confirmed) return;

    setSubmitting(true);
    const ok = await liftRestriction(entityType, entityId);
    setSubmitting(false);
    if (ok) {
      toast.success(`Access restored for ${entity.name}.`);
    } else {
      toast.error("Couldn't restore access. Please try again.");
    }
  };

  const handleToggleDetails = () => {
    const next = !showDetails;
    setShowDetails(next);
    if (next && !details) fetchEntityDetails(entityType, entityId);
  };

  const handleToggleActivity = () => {
    const next = !showActivity;
    setShowActivity(next);
    if (next && !activity) fetchEntityActivity(entityType, entityId);
  };

  if (!entity) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <ScreenHeader title="Account Moderation" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  const isRestricted = entity.isBanned || entity.isSuspended;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title={entity.name} subtitle="Account moderation" onBack={() => router.back()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View
          className="flex-row items-center gap-2 px-3.5 py-3 rounded-xl"
          style={{ backgroundColor: (isRestricted ? colors.error : colors.success) + "14" }}
        >
          <MaterialCommunityIcons
            name={entity.isBanned ? "account-cancel-outline" : entity.isSuspended ? "account-clock-outline" : "account-check-outline"}
            size={18}
            color={isRestricted ? colors.error : colors.success}
          />
          <Text className="text-sm font-semibold" style={{ color: isRestricted ? colors.error : colors.success }}>
            {entity.isBanned ? "Currently banned" : entity.isSuspended ? "Currently suspended" : "Active — no restrictions"}
          </Text>
        </View>

        {/* Informational, lazy-loaded — fetched only the first time each
            is expanded, not on mount, since most visits to this screen
            are to take a quick action, not review every detail. */}
        <View className="gap-3">
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundElement }}>
            <Pressable onPress={handleToggleDetails} className="flex-row items-center gap-3 p-4">
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.textSecondary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Details</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Contact info, KYC record, and more</Text>
              </View>
              <MaterialCommunityIcons name={showDetails ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
            </Pressable>
            {showDetails && (
              <View className="gap-2 px-4 pb-4">
                {isLoadingDetails && !details ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : details ? (
                  [
                    { label: "Email", value: details.email },
                    { label: "Phone", value: details.phone },
                    { label: "Role", value: details.role },
                    { label: "Title", value: details.title },
                    { label: "License number", value: details.licenseNumber },
                    { label: "Bio", value: details.bio },
                    { label: "Region", value: details.region },
                    { label: "Type", value: details.facilityType ?? details.organizationType },
                    { label: "Location", value: details.location ?? details.headquartersLocation },
                    { label: "Address", value: details.address },
                    { label: "Registration number", value: details.registrationNumber },
                    { label: "Organization", value: details.organizationName },
                    { label: "Admin", value: details.adminName },
                    { label: "Created", value: details.createdAt.toLocaleDateString() },
                    { label: "KYC submitted", value: details.kycSubmittedAt?.toLocaleString() },
                    { label: "KYC reviewed", value: details.kycReviewedAt?.toLocaleString() },
                    { label: "KYC reviewed by", value: details.kycReviewedByName },
                    { label: "KYC rejection reason", value: details.kycRejectionReason },
                    { label: "Terms accepted", value: details.termsAcceptedAt?.toLocaleString() },
                  ]
                    .filter((row) => row.value)
                    .map((row) => (
                      <View key={row.label} className="flex-row justify-between gap-3">
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>{row.label}</Text>
                        <Text className="text-xs font-medium flex-1 text-right" style={{ color: colors.text }} numberOfLines={2}>
                          {row.value}
                        </Text>
                      </View>
                    ))
                ) : (
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>Couldn't load details.</Text>
                )}
              </View>
            )}
          </View>

          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundElement }}>
            <Pressable onPress={handleToggleActivity} className="flex-row items-center gap-3 p-4">
              <MaterialCommunityIcons name="chart-box-outline" size={20} color={colors.textSecondary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Activity</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>What this account has posted</Text>
              </View>
              <MaterialCommunityIcons name={showActivity ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
            </Pressable>
            {showActivity && (
              <View className="gap-3 px-4 pb-4">
                {isLoadingActivity && !activity ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : activity && activity.length > 0 ? (
                  activity.map((item) => (
                    <View key={item.label} className="gap-1">
                      <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                        {item.label} ({item.count})
                      </Text>
                      {item.recentTitles.length > 0 && (
                        <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={3}>
                          {item.recentTitles.join(", ")}
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>Couldn't load activity.</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Actions — each card is self-contained (icon, title,
            description, its own expandable form or direct confirm).
            Future actions (e.g. changing account ownership) are
            additional cards here, not a restructure of this section. */}
        <View className="gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
            Actions
          </Text>

          {isRestricted ? (
            <Pressable
              onPress={handleLift}
              disabled={submitting}
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.backgroundElement, opacity: submitting ? 0.6 : 1 }}
            >
              <MaterialCommunityIcons name="account-check-outline" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>Restore Access</Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {entity.isBanned ? "Lift the ban and restore full access" : "End the suspension early"}
                </Text>
              </View>
              {submitting && <ActivityIndicator color={colors.textSecondary} />}
            </Pressable>
          ) : (
            <>
              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundElement }}>
                <Pressable
                  onPress={() => setExpandedAction(expandedAction === "suspend" ? null : "suspend")}
                  className="flex-row items-center gap-3 p-4"
                >
                  <MaterialCommunityIcons name="account-clock-outline" size={20} color={colors.warning} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>Suspend Temporarily</Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Lifts automatically after a set number of days</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedAction === "suspend" ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
                {expandedAction === "suspend" && (
                  <View className="gap-2.5 px-4 pb-4">
                    <View className="gap-1.5">
                      <Text className="text-xs font-semibold" style={{ color: colors.text }}>Duration (days)</Text>
                      <TextInput
                        value={durationDays}
                        onChangeText={setDurationDays}
                        keyboardType="number-pad"
                        className="rounded-xl px-3.5 py-3 text-sm"
                        style={{ backgroundColor: colors.background, color: colors.text }}
                      />
                    </View>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Reason for suspending"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      className="rounded-xl p-3.5 text-sm min-h-[90px]"
                      style={{ backgroundColor: colors.background, color: colors.text, textAlignVertical: "top" }}
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
                  </View>
                )}
              </View>

              <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.backgroundElement }}>
                <Pressable
                  onPress={() => setExpandedAction(expandedAction === "ban" ? null : "ban")}
                  className="flex-row items-center gap-3 p-4"
                >
                  <MaterialCommunityIcons name="account-cancel-outline" size={20} color={colors.error} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>Ban Permanently</Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Only reversible by manually restoring access</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={expandedAction === "ban" ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
                {expandedAction === "ban" && (
                  <View className="gap-2.5 px-4 pb-4">
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Reason for banning"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      className="rounded-xl p-3.5 text-sm min-h-[90px]"
                      style={{ backgroundColor: colors.background, color: colors.text, textAlignVertical: "top" }}
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
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        <View className="gap-2.5">
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
      </ScrollView>
    </SafeAreaView>
  );
}
