import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
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
  const updateRequestStatus = useMediscopeStore((state) => state.updateRequestStatus);
  const deleteRequest = useMediscopeStore((state) => state.deleteRequest);
  const markFulfilled = useMediscopeStore((state) => state.markFulfilled);

  useEffect(() => {
    if (id) fetchResponses(id);
  }, [id]);

  const request = useMemo(() => requests.find((r) => r.id === id), [requests, id]);
  const responses = useMemo(
    () => (id ? (responsesByRequest[id] ?? []) : []),
    [responsesByRequest, id],
  );

  if (!request) {
    if (isLoadingRequests) {
      return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Text className="p-4" style={{ color: colors.text }}>
          No MediScope request found for id: {id}
        </Text>
      </SafeAreaView>
    );
  }

  const isOwner = request.createdBy === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="p-4 gap-3">
          <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
            This is a management view
          </Text>
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            Only {request.facilityName} can manage this request.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: "/mediscope/mediscope-market-details",
                params: { id: request.id },
              })
            }
            className="flex-row items-center justify-center py-3 rounded-[10px] border"
            style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
          >
            <Text className="text-white text-sm font-semibold">View request</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = STATUS_META[request.status];

  const handleMarkFulfilled = async (responseId: string) => {
    const confirmed = await confirm({
      title: "Mark as fulfilled?",
      message:
        "This response will be marked as the one that fulfilled your request.",
      confirmLabel: "Confirm",
    });
    if (!confirmed) return;
    const ok = await markFulfilled(request.id, responseId);
    toast[ok ? "success" : "error"](
      ok ? "Marked as fulfilled." : "Couldn't update the request.",
    );
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
    toast[ok ? "success" : "error"](
      ok ? "Status updated." : "Couldn't update the status.",
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <ScreenHeader
        title={request.product}
        subtitle={request.code}
        actions={
          <>
            {(request.status === "draft" || request.status === "published") && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/mediscope/add-mediscope-request",
                    params: { id: request.id },
                  })
                }
                className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={colors.text}
                />
              </Pressable>
            )}
            <PrintButton
              variant="icon"
              fileName={`MediScope-${request.code}`}
              getHtml={() => buildMediscopeSummaryHtml(request, responses)}
            />
          </>
        }
      />

      <ScrollView contentContainerClassName="p-4 gap-3.5">
        {request.imageUrl ? (
          <LoadingImage
            source={{ uri: request.imageUrl }}
            style={{ width: "100%", height: 180, borderRadius: 14 }}
            resizeMode="cover"
            expandable
          />
        ) : (
          <MediscopeNamePlaceholder
            product={request.product}
            className="w-full h-[180px] rounded-[14px]"
            fontSize={22}
          />
        )}

        {/* Status pills */}
        <View className="flex-row gap-2">
          <View
            className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: colors.backgroundElement }}
          >
            <MaterialCommunityIcons
              name={statusMeta.icon as any}
              size={13}
              color={colors.text}
            />
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {statusMeta.label}
            </Text>
          </View>
          {request.visibilityScope === "Restricted" && (
            <View
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: colors.warning + "18" }}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={13}
                color={colors.warning}
              />
              <Text className="text-xs font-semibold" style={{ color: colors.warning }}>
                Restricted
              </Text>
            </View>
          )}
        </View>

        {/* Posted by */}
        <View className="flex-row items-center gap-2.5 mb-3.5">
          <ClickableAvatar
            entityType="facility"
            entityId={request.facility}
            name={request.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this request"
            size={38}
          />
          <View>
            <Text
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              Requested by
            </Text>
            <Text className="text-sm font-bold mt-0.5" style={{ color: colors.text }}>
              {request.facilityName}
            </Text>
          </View>
        </View>

        {/* Info card */}
        <View
          className="rounded-[14px] border p-4 gap-2"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row justify-between py-0.5 gap-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Location
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {request.facilityLocation}
            </Text>
          </View>
          <View className="flex-row justify-between py-0.5 gap-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Posted
            </Text>
            <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
              {fmtDate(request.createdAt)}
            </Text>
          </View>
          {request.submissionDeadline && (
            <View className="flex-row justify-between py-0.5 gap-2">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Deadline
              </Text>
              <Text className="text-[13px] font-medium" style={{ color: colors.text }}>
                {fmtDate(request.submissionDeadline)}
              </Text>
            </View>
          )}
          {request.comment ? (
            <View className="flex-row justify-between py-0.5 gap-2">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Comment
              </Text>
              <Text
                className="text-[13px] font-medium flex-1 text-right"
                style={{ color: colors.text }}
              >
                {request.comment}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Responses */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Responses ({responses.length})
        </Text>
        {responses.length === 0 ? (
          <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
            No responses yet.
          </Text>
        ) : (
          <View className="gap-2">
            {responses.map((response) => (
              <Pressable
                key={response.id}
                onPress={() =>
                  request.status !== "fulfilled"
                    ? handleMarkFulfilled(response.id)
                    : undefined
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

        {/* Manage */}
        <Text className="text-sm font-bold" style={{ color: colors.text }}>
          Manage
        </Text>
        <View className="flex-row gap-2 flex-wrap">
          {request.status === "draft" && (
            <Pressable
              onPress={() => handleStatusChange("published")}
              className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: colors.primary }}
            >
              <MaterialCommunityIcons name="publish" size={15} color="#fff" />
              <Text className="text-xs font-semibold text-white">Publish</Text>
            </Pressable>
          )}
          {request.status === "published" && (
            <Pressable
              onPress={() => handleStatusChange("closed")}
              className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] border"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={15}
                color={colors.text}
              />
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                Close
              </Text>
            </Pressable>
          )}
          {(request.status === "draft" || request.status === "published") && (
            <Pressable
              onPress={() => handleStatusChange("cancelled")}
              className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-[10px]"
              style={{ backgroundColor: colors.error + "18" }}
            >
              <MaterialCommunityIcons name="cancel" size={15} color={colors.error} />
              <Text className="text-xs font-semibold" style={{ color: colors.error }}>
                Cancel
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={handleDelete}
          className="flex-row items-center justify-center gap-1.5 py-3 rounded-[10px] border"
          style={{ borderColor: colors.error }}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={colors.error}
          />
          <Text className="text-[13px] font-semibold" style={{ color: colors.error }}>
            Delete request
          </Text>
        </Pressable>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}