import React, { useMemo, useRef } from "react";
import { View, Text, Pressable, ScrollView, Share, Platform} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { format } from "timeago.js";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import LoadingImage from "@/shared/components/loading-image";
import MediscopeNamePlaceholder from "@/features/mediscope/components/mediscope-name-placeholder";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useMediscopeStore } from "@/features/mediscope/hooks/use-mediscope-data";
import { MediscopeResponseFormData } from "@/features/mediscope/types/mediscope.types";
import MediscopeResponseSheet from "@/features/mediscope/components/mediscope-response-sheet";
import PrintButton from "@/shared/components/print-button";
import { buildMediscopeSummaryHtml } from "@/features/mediscope/utils/mediscope-pdf";

// Public view — anyone browsing the market lands here. Owners are routed to
// /mediscope/mediscope-details for management instead.
export default function MediscopeMarketDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const requests = useMediscopeStore((state) => state.requests);
  const isLoadingRequests = useMediscopeStore((state) => state.isLoading);
  const responsesByRequest = useMediscopeStore((state) => state.responsesByRequest);
  const addResponse = useMediscopeStore((state) => state.addResponse);

  const responseSheetRef = useRef<BottomSheetModal>(null);

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

  const canRespond = request.status === "published";

  const handleSubmitResponse = async (data: MediscopeResponseFormData) => {
    const ok = await addResponse(data);
    if (ok) {
      toast.success("Response submitted.");
      responseSheetRef.current?.dismiss();
    } else {
      toast.error("Couldn't submit your response. Please try again.");
    }
    return ok;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Looking for: ${request.product} — posted by ${request.facilityName}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Navbar */}
      <View
        className="flex-row items-center px-4 py-3 border-b gap-3"
        style={{ borderBottomColor: colors.border }}
      >
        {Platform.OS !== "web" && (
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 justify-center items-center"
          hitSlop={8}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-[15px] font-medium" style={{ color: colors.text }}>
            {request.code}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            {format(request.createdAt)}
          </Text>
        </View>
        <PrintButton
          variant="icon"
          fileName={`MediScope-${request.code}`}
          getHtml={() => buildMediscopeSummaryHtml(request, responses)}
        />
        <Pressable
          onPress={handleShare}
          className="w-9 h-9 justify-center items-center"
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-4 pt-4">
        {request.imageUrl ? (
          <LoadingImage
            source={{ uri: request.imageUrl }}
            style={{ width: "100%", height: 200, borderRadius: 16, marginBottom: 14 }}
            resizeMode="cover"
            expandable
          />
        ) : (
          <MediscopeNamePlaceholder
            product={request.product}
            className="w-full h-[200px] rounded-2xl mb-3.5"
            fontSize={24}
          />
        )}

        <Text className="text-[19px] font-bold mb-3" style={{ color: colors.text }}>
          {request.product}
        </Text>

        {/* Facility hero */}
        <View className="flex-row items-center gap-2.5 mb-3.5">
          <ClickableAvatar
            entityType="facility"
            entityId={request.facility}
            name={request.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this request"
            size={44}
          />
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {request.facilityName}
            </Text>
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {request.facilityLocation}
              </Text>
            </View>
          </View>
        </View>

        {request.comment ? (
          <Text
            className="text-sm leading-5 mb-3.5"
            style={{ color: colors.textSecondary }}
          >
            {request.comment}
          </Text>
        ) : null}

        {request.submissionDeadline && (
          <View
            className="flex-row items-center gap-1.5 rounded-[10px] px-3 py-2.5"
            style={{ backgroundColor: colors.warning + "14" }}
          >
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={14}
              color={colors.warning}
            />
            <Text className="text-xs font-semibold" style={{ color: colors.warning }}>
              Responses needed by{" "}
              {new Date(request.submissionDeadline).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        <View className={canRespond ? "h-[100px]" : "h-6"} />
      </ScrollView>

      {canRespond && (
        <View className="absolute bottom-6 left-4 right-4">
          <Pressable
            onPress={() => responseSheetRef.current?.present()}
            className="h-12 rounded-[14px] flex-row items-center justify-center gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialCommunityIcons name="reply-outline" size={18} color="#fff" />
            <Text className="text-white text-[15px] font-semibold">Respond</Text>
          </Pressable>
        </View>
      )}

      <MediscopeResponseSheet
        ref={responseSheetRef}
        requestId={request.id}
        productName={request.product}
        onSubmit={handleSubmitResponse}
        onClose={() => {}}
      />
    </SafeAreaView>
  );
}