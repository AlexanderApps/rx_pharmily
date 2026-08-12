import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { KycEntityType } from "@/features/profile/types/profile.types";
import KycStatusBadge from "@/features/profile/components/kyc-status-badge";
import DocumentViewerModal from "@/features/profile/components/document-viewer-modal";

export default function KycReviewScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const organizations = useProfileStore((state) => state.organizations);
  const usersForKycReview = useProfileStore((state) => state.usersForKycReview);
  const fetchUsersForKycReview = useProfileStore((state) => state.fetchUsersForKycReview);
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

  const [rejectTarget, setRejectTarget] = useState<{ type: KycEntityType; id: string } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [viewingPath, setViewingPath] = useState<string | null>(null);

  const entries = useMemo(
    () => [
      { type: "user" as KycEntityType, id: user.id, label: user.fullName, sub: "User", kyc: user.kyc },
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

  const handleApprove = async (type: KycEntityType, id: string, label: string) => {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>KYC Review</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {pendingCount} awaiting review
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {entries.map((entry) => (
          <View
            key={`${entry.type}-${entry.id}`}
            style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          >
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryLabel, { color: colors.text }]}>{entry.label}</Text>
                <Text style={[styles.entrySub, { color: colors.textSecondary }]}>{entry.sub}</Text>
              </View>
              <KycStatusBadge status={entry.kyc.status} compact />
            </View>

            {entry.kyc.documents.length === 0 ? (
              <Text style={[styles.docCount, { color: colors.textSecondary }]}>No documents submitted</Text>
            ) : (
              <View style={{ gap: 6 }}>
                {entry.kyc.documents.map((doc) => (
                  <Pressable
                    key={doc.id}
                    onPress={() => doc.imageUri && setViewingPath(doc.imageUri)}
                    style={[styles.docRow, { backgroundColor: colors.backgroundElement }]}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.docRowText, { color: colors.text }]} numberOfLines={1}>
                      {doc.type} — {doc.fileName}
                    </Text>
                    {doc.imageUri && (
                      <MaterialCommunityIcons name="eye-outline" size={14} color={colors.textSecondary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {entry.kyc.status === "rejected" && entry.kyc.rejectionReason && (
              <Text style={[styles.rejectionText, { color: colors.error }]}>{entry.kyc.rejectionReason}</Text>
            )}

            {entry.kyc.status === "pending" && (
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleApprove(entry.type, entry.id, entry.label)}
                  style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
                >
                  <MaterialCommunityIcons name="check" size={14} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                </Pressable>
                <Pressable
                  onPress={() => openRejectPrompt(entry.type, entry.id)}
                  style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
                >
                  <MaterialCommunityIcons name="close" size={14} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!rejectTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reject verification</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Let them know what needs to be fixed.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.modalInput,
                { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border },
              ]}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setRejectTarget(null)}
                style={[styles.modalButton, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmReject}
                disabled={!reasonText.trim()}
                style={[
                  styles.modalButton,
                  { backgroundColor: reasonText.trim() ? colors.error : colors.backgroundElement },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: reasonText.trim() ? "#fff" : colors.textSecondary },
                  ]}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <DocumentViewerModal storagePath={viewingPath} onClose={() => setViewingPath(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  content: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  entryLabel: { fontSize: 14, fontWeight: "700" },
  entrySub: { fontSize: 11, marginTop: 1 },
  docCount: { fontSize: 12 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  docRowText: { fontSize: 12, flex: 1 },
  rejectionText: { fontSize: 12, lineHeight: 17 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard: { borderRadius: 16, padding: 18, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSubtitle: { fontSize: 12 },
  modalInput: { minHeight: 80, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalButton: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  modalButtonText: { fontSize: 14, fontWeight: "600" },
});
