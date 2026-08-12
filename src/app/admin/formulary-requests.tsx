import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Modal, TextInput } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import LoadingImage from "@/shared/components/loading-image";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { FormularyRequest } from "@/features/catalog/types/catalog.types";

export default function AdminFormularyRequestsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));
  const formularyRequests = useCatalogStore((state) => state.formularyRequests);
  const fetchFormularyRequests = useCatalogStore((state) => state.fetchFormularyRequests);

  useEffect(() => {
    fetchFormularyRequests();
  }, []);

  const approveFormularyRequest = useCatalogStore((state) => state.approveFormularyRequest);
  const rejectFormularyRequest = useCatalogStore((state) => state.rejectFormularyRequest);

  const [rejectTarget, setRejectTarget] = useState<FormularyRequest | null>(null);
  const [reasonText, setReasonText] = useState("");

  if (!isAdmin) {
    return <Redirect href="/(tabs)/account" />;
  }

  const pending = useMemo(
    () =>
      formularyRequests
        .filter((r) => r.status === "pending")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [formularyRequests],
  );
  // Approved-but-not-yet-merged requests need their own visibility — this
  // is a real actionable queue (someone still needs to open the editable
  // copy and merge it), not just a decided/archived request.
  const awaitingMerge = useMemo(
    () =>
      formularyRequests
        .filter((r) => r.status === "approved")
        .sort((a, b) => new Date(a.reviewedAt ?? a.createdAt).getTime() - new Date(b.reviewedAt ?? b.createdAt).getTime()),
    [formularyRequests],
  );
  const decided = useMemo(
    () =>
      formularyRequests
        .filter((r) => r.status === "rejected" || r.status === "merged")
        .sort((a, b) => new Date(b.reviewedAt ?? b.createdAt).getTime() - new Date(a.reviewedAt ?? a.createdAt).getTime()),
    [formularyRequests],
  );

  const handleApprove = async (request: FormularyRequest) => {
    const ok = await confirm({
      title: "Approve this request?",
      message: `"${request.productName}" will be approved, but not added to the catalog yet — you'll still need to open it and merge it in.`,
      confirmLabel: "Approve",
    });
    if (!ok) return;
    await approveFormularyRequest(request.id);
    toast.success("Request approved.");
  };

  const openReject = (request: FormularyRequest) => {
    setRejectTarget(request);
    setReasonText("");
  };

  const confirmReject = () => {
    if (!rejectTarget || !reasonText.trim()) return;
    rejectFormularyRequest(rejectTarget.id, reasonText.trim());
    setRejectTarget(null);
    setReasonText("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Formulary Requests</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {pending.length} awaiting review{awaitingMerge.length > 0 ? ` · ${awaitingMerge.length} awaiting merge` : ""}
          </Text>
        </View>
      </View>

      <FlatList
        data={[...pending, ...awaitingMerge, ...decided]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          pending.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PENDING</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="pill" size={36} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No requests yet.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <>
            {index === pending.length && awaitingMerge.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                AWAITING MERGE
              </Text>
            )}
            {index === pending.length + awaitingMerge.length && decided.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                DECIDED
              </Text>
            )}
            <RequestCard
              request={item}
              onApprove={handleApprove}
              onReject={openReject}
              onOpenMerge={() => router.push({ pathname: "/admin/formulary-merge", params: { id: item.id } })}
            />
          </>        )}
      />

      <Modal visible={!!rejectTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reject this request</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Let the requester know why — this comment is shown to them.
            </Text>
            <TextInput
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Reason..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.modalInput, { backgroundColor: colors.backgroundElement, color: colors.text, borderColor: colors.border }]}
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
                <Text style={[styles.modalButtonText, { color: reasonText.trim() ? "#fff" : colors.textSecondary }]}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RequestCard({
  request,
  onApprove,
  onReject,
  onOpenMerge,
}: {
  request: FormularyRequest;
  onApprove: (r: FormularyRequest) => void;
  onReject: (r: FormularyRequest) => void;
  onOpenMerge: () => void;
}) {
  const { colors } = useTheme();
  const isPending = request.status === "pending";
  const isAwaitingMerge = request.status === "approved";
  const statusColor =
    request.status === "merged"
      ? colors.success
      : request.status === "approved"
        ? colors.primary
        : request.status === "rejected"
          ? colors.error
          : colors.warning;
  const statusLabel =
    request.status === "merged" ? "Merged" : request.status === "approved" ? "Approved" : request.status === "rejected" ? "Rejected" : "Pending";

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={styles.cardTopRow}>
        {request.imageUri ? (
          <LoadingImage source={{ uri: request.imageUri }} style={styles.cardThumb} />
        ) : (
          <View style={[styles.cardThumb, styles.cardThumbPlaceholder, { backgroundColor: colors.backgroundElement }]}>
            <MaterialCommunityIcons name="pill" size={18} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {request.productName}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {[request.category, request.defaultUnit].filter(Boolean).join(" · ") || "Uncategorized"}
            {" · "}
            {format(request.createdAt)}
          </Text>
        </View>
        {!isPending && (
          <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        )}
      </View>

      {request.notes ? (
        <Text style={[styles.cardNotes, { color: colors.textSecondary }]}>{request.notes}</Text>
      ) : null}

      {request.reviewComment ? (
        <Text style={[styles.reviewComment, { color: statusColor }]}>{request.reviewComment}</Text>
      ) : null}

      {isPending && (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onApprove(request)}
            style={[styles.actionButton, { backgroundColor: colors.success + "18" }]}
          >
            <MaterialCommunityIcons name="check" size={14} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>Approve</Text>
          </Pressable>
          <Pressable
            onPress={() => onReject(request)}
            style={[styles.actionButton, { backgroundColor: colors.error + "18" }]}
          >
            <MaterialCommunityIcons name="close" size={14} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Reject</Text>
          </Pressable>
        </View>
      )}

      {isAwaitingMerge && (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={onOpenMerge}
            style={[styles.actionButton, { backgroundColor: colors.primary + "18" }]}
          >
            <MaterialCommunityIcons name="pencil-plus-outline" size={14} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Open & Merge to Catalog</Text>
          </Pressable>
        </View>
      )}
    </View>
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
  listContent: { padding: 16, flexGrow: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardThumb: { width: 40, height: 40, borderRadius: 10 },
  cardThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardMeta: { fontSize: 11, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  cardNotes: { fontSize: 12, lineHeight: 17 },
  reviewComment: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCard: { borderRadius: 16, padding: 18, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSubtitle: { fontSize: 12 },
  modalInput: { minHeight: 80, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalButton: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  modalButtonText: { fontSize: 14, fontWeight: "600" },
});
