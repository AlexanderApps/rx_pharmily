import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { KycEntityType } from "@/features/profile/types/profile.types";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";
import DocumentViewerModal from "@/features/profile/components/document-viewer-modal";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";

export default function KycReviewScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const usersForKycReview = useProfileStore((state) => state.usersForKycReview);
  const fetchUsersForKycReview = useProfileStore(
    (state) => state.fetchUsersForKycReview,
  );
  const approveKyc = useProfileStore((state) => state.approveKyc);
  const rejectKyc = useProfileStore((state) => state.rejectKyc);
  const fetchKycDocuments = useProfileStore((state) => state.fetchKycDocuments);

  useEffect(() => {
    if (user.id) fetchKycDocuments("user", user.id);
    facilities.forEach((f) => fetchKycDocuments("facility", f.id));
    organizations.forEach((o) => fetchKycDocuments("organization", o.id));
    fetchUsersForKycReview();
    // Deliberately keyed only on the id lists changing shape, not on every
    // KYC-field update within them — otherwise approving one entry would
    // re-trigger a fetch for every entry on the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, facilities.length, organizations.length]);

  const [rejectTarget, setRejectTarget] = useState<{
    type: KycEntityType;
    id: string;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [viewingPath, setViewingPath] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "verified" | "rejected" | "unverified" | "all"
  >("pending");

  const entries = useMemo(
    () => [
      {
        type: "user" as KycEntityType,
        id: user.id,
        label: user.fullName,
        sub: "User",
        kyc: user.kyc,
      },
      ...usersForKycReview.map((u) => ({
        type: "user" as KycEntityType,
        id: u.id,
        label: u.fullName,
        sub: "User",
        kyc: u.kyc,
      })),
      ...facilities.map((f) => ({
        type: "facility" as KycEntityType,
        id: f.id,
        label: f.name,
        sub: "Facility",
        kyc: f.kyc,
      })),
      ...organizations.map((o) => ({
        type: "organization" as KycEntityType,
        id: o.id,
        label: o.name,
        sub: "Organization",
        kyc: o.kyc,
      })),
    ],
    [user, usersForKycReview, facilities, organizations],
  );

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const pendingCount = entries.filter((e) => e.kyc.status === "pending").length;
  const verifiedCount = entries.filter((e) => e.kyc.status === "verified").length;
  const rejectedCount = entries.filter((e) => e.kyc.status === "rejected").length;
  const unverifiedCount = entries.filter((e) => e.kyc.status === "unverified").length;

  const filteredEntries = useMemo(
    () =>
      statusFilter === "all"
        ? entries
        : entries.filter((e) => e.kyc.status === statusFilter),
    [entries, statusFilter],
  );

  const handleApprove = async (
    type: KycEntityType,
    id: string,
    label: string,
  ) => {
    const confirmed = await confirm({
      title: "Approve verification?",
      message: `${label} will be marked as verified.`,
      confirmLabel: "Approve",
    });
    if (!confirmed) return;
    await approveKyc(type, id);
    toast.success(`${label} verified.`);
  };

  const openRejectPrompt = (type: KycEntityType, id: string) => {
    setRejectTarget({ type, id });
    setReasonText("");
  };

  const confirmReject = async () => {
    if (!rejectTarget || !reasonText.trim()) return;
    await rejectKyc(rejectTarget.type, rejectTarget.id, reasonText.trim());
    setRejectTarget(null);
    setReasonText("");
    toast.success("Submission rejected.");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader title="KYC Review" subtitle={`${pendingCount} awaiting review`} />

      <StatusFilterTabs
        options={[
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "verified", label: "Verified", count: verifiedCount },
          { key: "rejected", label: "Rejected", count: rejectedCount },
          { key: "unverified", label: "Unverified", count: unverifiedCount },
          { key: "all", label: "All", count: entries.length },
        ]}
        selected={statusFilter}
        onSelect={(key) => setStatusFilter(key as typeof statusFilter)}
      />

      <ScrollView contentContainerClassName="p-4 gap-2.5">
        {filteredEntries.length === 0 ? (
          <View className="items-center justify-center gap-2.5 pt-16">
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
              Nothing here.
            </Text>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <View
              key={`${entry.type}-${entry.id}`}
              className="rounded-[14px] border p-3.5 gap-1.5"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center gap-2.5">
                <View className="flex-1">
                  <Text className="text-sm font-bold" style={{ color: colors.text }}>
                    {entry.label}
                  </Text>
                  <Text
                    className="text-[11px] mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {entry.sub}
                  </Text>
                </View>
                <KycStatusBadge status={entry.kyc.status} compact />
              </View>

              {entry.kyc.documents.length === 0 ? (
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  No documents submitted
                </Text>
              ) : (
                <View className="gap-1.5">
                  {entry.kyc.documents.map((doc) => (
                    <Pressable
                      key={doc.id}
                      onPress={() => doc.imageUri && setViewingPath(doc.imageUri)}
                      className="flex-row items-center gap-2 rounded-lg px-2.5 py-2"
                      style={{ backgroundColor: colors.backgroundElement }}
                    >
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        className="text-xs flex-1"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {doc.type} — {doc.fileName}
                      </Text>
                      {doc.imageUri && (
                        <MaterialCommunityIcons
                          name="eye-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {entry.kyc.status === "rejected" && entry.kyc.rejectionReason && (
                <Text
                  className="text-xs leading-[17px]"
                  style={{ color: colors.error }}
                >
                  {entry.kyc.rejectionReason}
                </Text>
              )}

              {entry.kyc.status === "pending" && (
                <View className="flex-row gap-2 mt-1">
                  <Pressable
                    onPress={() => handleApprove(entry.type, entry.id, entry.label)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: colors.success + "18" }}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color={colors.success}
                    />
                    <Text
                      className="text-xs font-bold"
                      style={{ color: colors.success }}
                    >
                      Approve
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openRejectPrompt(entry.type, entry.id)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: colors.error + "18" }}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={14}
                      color={colors.error}
                    />
                    <Text className="text-xs font-bold" style={{ color: colors.error }}>
                      Reject
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Reject modal */}
      <Modal visible={!!rejectTarget} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] gap-2.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              Reject verification
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Let them know what needs to be fixed.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              className="min-h-20 border rounded-[10px] p-3 text-sm"
              style={{
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
              multiline
              autoFocus
            />
            <View className="flex-row gap-2.5 mt-1">
              <Pressable
                onPress={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{ backgroundColor: colors.backgroundElement }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmReject}
                disabled={!reasonText.trim()}
                className="flex-1 py-2.5 rounded-[10px] items-center"
                style={{
                  backgroundColor: reasonText.trim()
                    ? colors.error
                    : colors.backgroundElement,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: reasonText.trim() ? "#fff" : colors.textSecondary,
                  }}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <DocumentViewerModal
        storagePath={viewingPath}
        onClose={() => setViewingPath(null)}
      />
    </SafeAreaView>
  );
}