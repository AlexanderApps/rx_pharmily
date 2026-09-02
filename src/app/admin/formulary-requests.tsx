import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Modal, TextInput } from "react-native";
import { router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
import ScreenHeader from "@/shared/components/screen-header";
import { confirm } from "@/shared/hooks/use-confirm";
import { toast } from "@/shared/hooks/use-toast";
import LoadingImage from "@/shared/components/loading-image";
import StatusFilterTabs from "@/shared/components/status-filter-tabs";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { isAdminRole } from "@/features/auth/types/auth.types";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { FormularyRequest } from "@/features/catalog/types/catalog.types";

export default function AdminFormularyRequestsScreen() {
  const { colors } = useTheme();
  const isAdmin = useAuthStore((state) => isAdminRole(state.profile?.accountRole));

  const formularyRequests = useCatalogStore((state) => state.formularyRequests);
  const fetchFormularyRequests = useCatalogStore((state) => state.fetchFormularyRequests);
  const approveFormularyRequest = useCatalogStore((state) => state.approveFormularyRequest);
  const rejectFormularyRequest = useCatalogStore((state) => state.rejectFormularyRequest);

  useEffect(() => {
    fetchFormularyRequests();
  }, []);

  const [rejectTarget, setRejectTarget] = useState<FormularyRequest | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "merged" | "all"
  >("pending");

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
        .sort(
          (a, b) =>
            new Date(a.reviewedAt ?? a.createdAt).getTime() -
            new Date(b.reviewedAt ?? b.createdAt).getTime(),
        ),
    [formularyRequests],
  );

  const rejected = useMemo(
    () =>
      formularyRequests
        .filter((r) => r.status === "rejected")
        .sort(
          (a, b) =>
            new Date(b.reviewedAt ?? b.createdAt).getTime() -
            new Date(a.reviewedAt ?? a.createdAt).getTime(),
        ),
    [formularyRequests],
  );

  const merged = useMemo(
    () =>
      formularyRequests
        .filter((r) => r.status === "merged")
        .sort(
          (a, b) =>
            new Date(b.reviewedAt ?? b.createdAt).getTime() -
            new Date(a.reviewedAt ?? a.createdAt).getTime(),
        ),
    [formularyRequests],
  );

  const filteredRequests = useMemo(() => {
    switch (statusFilter) {
      case "pending":
        return pending;
      case "approved":
        return awaitingMerge;
      case "rejected":
        return rejected;
      case "merged":
        return merged;
      default:
        return [...pending, ...awaitingMerge, ...rejected, ...merged];
    }
  }, [statusFilter, pending, awaitingMerge, rejected, merged]);

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader
        title="Formulary Requests"
        subtitle={`${pending.length} awaiting review${awaitingMerge.length > 0 ? ` · ${awaitingMerge.length} awaiting merge` : ""}`}
      />

      <StatusFilterTabs
        options={[
          { key: "pending", label: "Pending", count: pending.length },
          { key: "approved", label: "Awaiting Merge", count: awaitingMerge.length },
          { key: "rejected", label: "Rejected", count: rejected.length },
          { key: "merged", label: "Merged", count: merged.length },
          { key: "all", label: "All", count: formularyRequests.length },
        ]}
        selected={statusFilter}
        onSelect={(key) => setStatusFilter(key as typeof statusFilter)}
      />

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 grow"
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListEmptyComponent={
          <EmptyState icon="pill" message="No requests here." />
        }
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onApprove={handleApprove}
            onReject={openReject}
            onOpenMerge={() =>
              router.push({ pathname: "/admin/formulary-merge", params: { id: item.id } })
            }
          />
        )}
      />

      {/* Reject modal */}
      <Modal visible={!!rejectTarget} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View
            className="rounded-2xl p-[18px] gap-2.5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base font-bold" style={{ color: colors.text }}>
              Reject this request
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Let the requester know why — this comment is shown to them.
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
                  backgroundColor: reasonText.trim() ? colors.error : colors.backgroundElement,
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
    request.status === "merged"
      ? "Merged"
      : request.status === "approved"
        ? "Approved"
        : request.status === "rejected"
          ? "Rejected"
          : "Pending";

  return (
    <View
      className="rounded-[14px] border p-3.5 gap-2"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center gap-2.5">
        {request.imageUri ? (
          <LoadingImage
            source={{ uri: request.imageUri }}
            style={{ width: 40, height: 40, borderRadius: 10 }}
          />
        ) : (
          <View
            className="w-10 h-10 rounded-[10px] items-center justify-center"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons name="pill" size={18} color={colors.textSecondary} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
            {request.productName}
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
            {[request.category, request.defaultUnit].filter(Boolean).join(" · ") || "Uncategorized"}
            {" · "}
            {format(request.createdAt)}
          </Text>
        </View>
        {!isPending && (
          <View
            className="px-2 py-1 rounded-lg"
            style={{ backgroundColor: statusColor + "18" }}
          >
            <Text className="text-[10px] font-bold" style={{ color: statusColor }}>
              {statusLabel}
            </Text>
          </View>
        )}
      </View>

      {request.notes ? (
        <Text className="text-xs leading-[17px]" style={{ color: colors.textSecondary }}>
          {request.notes}
        </Text>
      ) : null}

      {request.reviewComment ? (
        <Text
          className="text-xs leading-[17px] font-medium"
          style={{ color: statusColor }}
        >
          {request.reviewComment}
        </Text>
      ) : null}

      {isPending && (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => onApprove(request)}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.success + "18" }}
          >
            <MaterialCommunityIcons name="check" size={14} color={colors.success} />
            <Text className="text-xs font-bold" style={{ color: colors.success }}>
              Approve
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onReject(request)}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.error + "18" }}
          >
            <MaterialCommunityIcons name="close" size={14} color={colors.error} />
            <Text className="text-xs font-bold" style={{ color: colors.error }}>
              Reject
            </Text>
          </Pressable>
        </View>
      )}

      {isAwaitingMerge && (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onOpenMerge}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.primary + "18" }}
          >
            <MaterialCommunityIcons
              name="pencil-plus-outline"
              size={14}
              color={colors.primary}
            />
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              Open & Merge to Catalog
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}