import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import { confirm } from "@/shared/hooks/use-confirm";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import LoadingImage from "@/shared/components/loading-image";
import MediscopeNamePlaceholder from "@/features/mediscope/components/mediscope-name-placeholder";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useMediscopeStore } from "@/features/mediscope/hooks/use-mediscope-data";
import { MediscopeStatus } from "@/features/mediscope/types/mediscope.types";
import MediscopeResponseCard from "@/features/mediscope/components/mediscope-response-card";
import PrintButton from "@/shared/components/print-button";
import { buildMediscopeSummaryHtml } from "@/features/mediscope/utils/mediscope-pdf";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const STATUS_META: Record<MediscopeStatus, { label: string; icon: string }> = {
  draft: { label: "Draft", icon: "file-outline" },
  published: { label: "Published", icon: "eye-outline" },
  fulfilled: { label: "Fulfilled", icon: "trophy-outline" },
  closed: { label: "Closed", icon: "lock-outline" },
  cancelled: { label: "Cancelled", icon: "cancel" },
  expired: { label: "Expired", icon: "clock-alert-outline" },
};

// Owner-only management screen. Anyone browsing someone else's request is
// routed to /mediscope/mediscope-market-details instead.
export default function MediscopeDetailsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();

  const requests = useMediscopeStore((state) => state.requests);
  const isLoadingRequests = useMediscopeStore((state) => state.isLoading);
  const responsesByRequest = useMediscopeStore((state) => state.responsesByRequest);
  const fetchResponses = useMediscopeStore((state) => state.fetchResponses);

  useEffect(() => {
    if (id) fetchResponses(id);
  }, [id]);

  const updateRequestStatus = useMediscopeStore((state) => state.updateRequestStatus);
  const deleteRequest = useMediscopeStore((state) => state.deleteRequest);
  const markFulfilled = useMediscopeStore((state) => state.markFulfilled);

  const request = useMemo(() => requests.find((r) => r.id === id), [requests, id]);
  const responses = useMemo(
    () => (id ? responsesByRequest[id] ?? [] : []),
    [responsesByRequest, id],
  );

  if (!request) {
    if (isLoadingRequests) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, padding: 16 }}>
          No MediScope request found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isOwner = request.createdBy === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
            This is a management view
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Only {request.facilityName} can manage this request.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/mediscope/mediscope-market-details",
                params: { id: request.id },
              })
            }
            style={[styles.deleteButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>View request</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_META[request.status];

  const handleMarkFulfilled = async (responseId: string) => {
    const confirmed = await confirm({
      title: "Mark as fulfilled?",
      message: "This response will be marked as the one that fulfilled your request.",
      confirmLabel: "Confirm",
    });
    if (!confirmed) return;
    const ok = await markFulfilled(request.id, responseId);
    toast[ok ? "success" : "error"](ok ? "Marked as fulfilled." : "Couldn't update the request.");
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete this request?",
      message: `"${request.product}" will be permanently removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) return;
    const ok = await deleteRequest(request.id);
    if (ok) {
      toast.success("Request deleted.");
      router.back();
    } else {
      toast.error("Couldn't delete the request.");
    }
  };

  const handleStatusChange = async (status: typeof request.status) => {
    const ok = await updateRequestStatus(request.id, status);
    toast[ok ? "success" : "error"](ok ? "Status updated." : "Couldn't update the status.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {request.product}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {request.code}
          </Text>
        </View>
        {(request.status === "draft" || request.status === "published") && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/mediscope/add-mediscope-request",
                params: { id: request.id },
              })
            }
            style={[styles.headerIconButton, { backgroundColor: colors.backgroundSecondary }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
          </Pressable>
        )}
        <PrintButton
          variant="icon"
          fileName={`MediScope-${request.code}`}
          getHtml={() => buildMediscopeSummaryHtml(request, responses)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {request.imageUrl ? (
          <LoadingImage source={{ uri: request.imageUrl }} style={styles.image} resizeMode="cover" expandable />
        ) : (
          <MediscopeNamePlaceholder product={request.product} style={styles.image} fontSize={22} />
        )}

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: colors.backgroundElement }]}>
            <MaterialCommunityIcons name={statusMeta.icon as any} size={13} color={colors.text} />
            <Text style={[styles.statusPillText, { color: colors.text }]}>{statusMeta.label}</Text>
          </View>
          {request.visibilityScope === "Restricted" && (
            <View style={[styles.statusPill, { backgroundColor: colors.warning + "18" }]}>
              <MaterialCommunityIcons name="lock-outline" size={13} color={colors.warning} />
              <Text style={[styles.statusPillText, { color: colors.warning }]}>Restricted</Text>
            </View>
          )}
        </View>

        <View style={styles.postedByRow}>
          <ClickableAvatar
            entityType="facility"
            entityId={request.facility}
            name={request.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this request"
            size={38}
          />
          <View>
            <Text style={[styles.postedByLabel, { color: colors.textSecondary }]}>Requested by</Text>
            <Text style={[styles.postedByName, { color: colors.text }]}>{request.facilityName}</Text>
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
            <Text style={[styles.value, { color: colors.text }]}>{request.facilityLocation}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Posted</Text>
            <Text style={[styles.value, { color: colors.text }]}>{fmtDate(request.createdAt)}</Text>
          </View>
          {request.submissionDeadline && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Deadline</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {fmtDate(request.submissionDeadline)}
              </Text>
            </View>
          )}
          {request.comment ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Comment</Text>
              <Text style={[styles.value, { color: colors.text, flex: 1, textAlign: "right" }]}>
                {request.comment}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Responses ({responses.length})
        </Text>
        {responses.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No responses yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {responses.map((response) => (
              <Pressable
                key={response.id}
                onPress={() =>
                  request.status !== "fulfilled" ? handleMarkFulfilled(response.id) : undefined
                }
              >
                <MediscopeResponseCard
                  response={response}
                  isFulfilled={request.fulfilledResponseId === response.id}
                />
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage</Text>
        <View style={styles.statusActionsRow}>
          {request.status === "draft" && (
            <Pressable
              onPress={() => handleStatusChange("published")}
              style={[styles.statusActionButton, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="publish" size={15} color="#fff" />
              <Text style={[styles.statusActionText, { color: "#fff" }]}>Publish</Text>
            </Pressable>
          )}
          {request.status === "published" && (
            <Pressable
              onPress={() => handleStatusChange("closed")}
              style={[
                styles.statusActionButton,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <MaterialCommunityIcons name="lock-outline" size={15} color={colors.text} />
              <Text style={[styles.statusActionText, { color: colors.text }]}>Close</Text>
            </Pressable>
          )}
          {(request.status === "draft" || request.status === "published") && (
            <Pressable
              onPress={() => handleStatusChange("cancelled")}
              style={[styles.statusActionButton, { backgroundColor: colors.error + "18" }]}
            >
              <MaterialCommunityIcons name="cancel" size={15} color={colors.error} />
              <Text style={[styles.statusActionText, { color: colors.error }]}>Cancel</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={handleDelete} style={[styles.deleteButton, { borderColor: colors.error }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete request</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 14 },
  image: { width: "100%", height: 180, borderRadius: 14 },
  statusRow: { flexDirection: "row", gap: 8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 12, fontWeight: "600" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  postedByRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  postedByLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  postedByName: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, gap: 8 },
  label: { fontSize: 12 },
  value: { fontSize: 13, fontWeight: "500" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  statusActionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusActionText: { fontSize: 12, fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteButtonText: { fontSize: 13, fontWeight: "600" },
});
