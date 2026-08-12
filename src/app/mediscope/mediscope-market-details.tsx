import React, { useMemo, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Share } from "react-native";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.navbarMeta}>
          <Text style={[styles.navbarCode, { color: colors.text }]}>{request.code}</Text>
          <Text style={[styles.navbarTime, { color: colors.textSecondary }]}>
            {format(request.createdAt)}
          </Text>
        </View>
        <PrintButton
          variant="icon"
          fileName={`MediScope-${request.code}`}
          getHtml={() => buildMediscopeSummaryHtml(request, responses)}
        />
        <Pressable onPress={handleShare} style={styles.shareBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {request.imageUrl ? (
          <LoadingImage source={{ uri: request.imageUrl }} style={styles.image} resizeMode="cover" expandable />
        ) : (
          <MediscopeNamePlaceholder product={request.product} style={styles.image} fontSize={24} />
        )}

        <Text style={[styles.productTitle, { color: colors.text }]}>{request.product}</Text>

        <View style={styles.hero}>
          <ClickableAvatar
            entityType="facility"
            entityId={request.facility}
            name={request.facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this request"
            size={44}
          />
          <View style={styles.heroMeta}>
            <Text style={[styles.heroName, { color: colors.text }]}>{request.facilityName}</Text>
            <View style={styles.heroLocationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.heroLocation, { color: colors.textSecondary }]}>
                {request.facilityLocation}
              </Text>
            </View>
          </View>
        </View>

        {request.comment ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {request.comment}
          </Text>
        ) : null}

        {request.submissionDeadline && (
          <View
            style={[styles.deadlineBanner, { backgroundColor: colors.warning + "14" }]}
          >
            <MaterialCommunityIcons name="calendar-clock-outline" size={14} color={colors.warning} />
            <Text style={[styles.deadlineText, { color: colors.warning }]}>
              Responses needed by{" "}
              {new Date(request.submissionDeadline).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        <View style={{ height: canRespond ? 100 : 24 }} />
      </ScrollView>

      {canRespond && (
        <View style={styles.fabGroup}>
          <Pressable
            onPress={() => responseSheetRef.current?.present()}
            style={[styles.fabPrimary, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="reply-outline" size={18} color="#fff" />
            <Text style={styles.fabPrimaryText}>Respond</Text>
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

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  navbarMeta: { flex: 1 },
  navbarCode: { fontSize: 15, fontWeight: "500" },
  navbarTime: { fontSize: 12, marginTop: 1 },
  shareBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  image: { width: "100%", height: 200, borderRadius: 16, marginBottom: 14 },
  productTitle: { fontSize: 19, fontWeight: "700", marginBottom: 12 },
  hero: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  heroIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  heroMeta: { flex: 1, gap: 2 },
  heroName: { fontSize: 14, fontWeight: "600" },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroLocation: { fontSize: 12 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  deadlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deadlineText: { fontSize: 12, fontWeight: "600" },
  fabGroup: { position: "absolute", bottom: 24, left: 16, right: 16 },
  fabPrimary: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
