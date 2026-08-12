import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTheme } from "@/shared/hooks/use-theme";
import DetailSkeleton from "@/shared/components/detail-skeleton";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import {
  RxRfqsData,
  RxRfqResponseCardData,
  RxRfqStatusType,
} from "@/features/rxrfqs/types/rxrfqs.types";
import RxRfqStatusBadge from "@/features/rxrfqs/components/rxrfq-status-badge";
import RxRfqReadonlyItemsList from "@/features/rxrfqs/components/rxrfq-readonly-items-list";
import RxRfqResponseSummaryCard from "@/features/rxrfqs/components/rxrfq-response-summary-card";
import RxRfqStatusActionsSheet, {
  RxRfqStatusAction,
} from "@/features/rxrfqs/components/rxrfq-status-actions-sheet";
import RxRfqExtendDeadlineSheet from "@/features/rxrfqs/components/rxrfq-extend-deadline-sheet";
import PrintButton from "@/shared/components/print-button";
import { buildRfqSummaryHtml } from "@/features/rxrfqs/utils/rxrfq-pdf";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import {
  useRxRfqsStore,
  convertResponseDataToCardData,
} from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { SafeAreaView } from "react-native-safe-area-context";

const fmtDate = (d?: Date) =>
  d
    ? d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const fmtDateTime = (d?: Date) =>
  d
    ? d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const diffDays = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / 86400000);

const RxRfqDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const actionsSheetRef = useRef<BottomSheetModal>(null);
  const extendSheetRef = useRef<BottomSheetModal>(null);

  const rxRfqData = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const isLoadingRfqs = useRxRfqsStore((state) => state.isLoading);
  const rxrfqResponses = useRxRfqsStore((state) => state.rxrfqResponses);
  const facilities = useProfileStore((state) => state.facilities);
  const products = useCatalogStore((state) => state.products);
  const fetchResponsesForRfq = useRxRfqsStore((state) => state.fetchResponsesForRfq);
  const updateRxRfqStatus = useRxRfqsStore((state) => state.updateRxRfqStatus);
  const extendRxRfqDeadline = useRxRfqsStore(
    (state) => state.extendRxRfqDeadline,
  );

  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) fetchResponsesForRfq(id);
  }, [id]);

  const rfq: RxRfqsData | null = useMemo(() => {
    let data = rxRfqData.find((item) => item.id === id);
    if (!data) return null;
    return { ...data, isBanned: false, bannedAt: new Date() };
  }, [rxRfqData, id]);

  const responses: RxRfqResponseCardData[] = useMemo(
    () =>
      rxrfqResponses
        .filter((response) => response.rfqId === id)
        .map(convertResponseDataToCardData),
    [rxrfqResponses, id],
  );

  const rawResponses = useMemo(
    () => rxrfqResponses.filter((response) => response.rfqId === id),
    [rxrfqResponses, id],
  );

  const onStatusChange = (newStatus: RxRfqStatusType) => {
    if (rfq) updateRxRfqStatus(rfq.id, newStatus);
  };

  const onExtendDeadline = (newDeadline: Date) => {
    if (rfq) extendRxRfqDeadline(rfq.id, newDeadline);
  };

  const onEdit = () => {
    if (rfq)
      router.push({ pathname: "/rfqs/add-rfqs", params: { id: rfq.id } });
  };

  if (!rfq) {
    if (isLoadingRfqs) {
      return (
        <SafeAreaView style={{ flex: 1 }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text>No RFQ found for id: {id}</Text>
      </SafeAreaView>
    );
  }
  const daysToDeadline = useMemo(
    () => diffDays(new Date(), rfq.submissionDeadline),
    [rfq.submissionDeadline],
  );

  const deadlineColor = useMemo(() => {
    if (rfq.status !== "published") return colors.textSecondary;
    if (daysToDeadline <= 1) return colors.error;
    if (daysToDeadline <= 3) return colors.warning;
    return colors.success;
  }, [daysToDeadline, rfq.status, colors]);

  const sortedResponses = useMemo(
    () => [...responses].sort((a, b) => b.grandTotal - a.grandTotal),
    [responses],
  );

  const handleStatusAction = (action: RxRfqStatusAction) => {
    actionsSheetRef.current?.dismiss();

    if (action.key === "award") {
      // Awarding requires picking a winning response — route to that flow.
      router.push({
        pathname: "/rfqs/award-rfq",
        params: { id: rfq.id },
      });
      return;
    }

    if (action.key === "extend") {
      // Give the actions sheet time to dismiss before presenting another.
      setTimeout(() => extendSheetRef.current?.present(), 250);
      return;
    }

    if (action.targetStatus) {
      onStatusChange(action.targetStatus);
    }
  };

  const handleExtendConfirm = (newDeadline: Date) => {
    extendSheetRef.current?.dismiss();
    onExtendDeadline(newDeadline);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerCode, { color: colors.text }]}>
              {rfq.code}
            </Text>
            <RxRfqStatusBadge status={rfq.status} size="sm" />
          </View>

          {rfq.status === "draft" && (
            <TouchableOpacity onPress={onEdit} style={styles.headerIconButton}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          )}

          <PrintButton
            variant="icon"
            fileName={`RFQ-${rfq.code}-Summary`}
            getHtml={() =>
              buildRfqSummaryHtml(
                rfq,
                rawResponses,
                facilities.find((f) => f.id === rfq.facilityId),
                products,
              )
            }
          />

          <TouchableOpacity
            onPress={() => actionsSheetRef.current?.present()}
            style={styles.headerIconButton}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Flagged warning */}
          {rfq.isBanned && (
            <View
              style={[
                styles.bannedBanner,
                {
                  backgroundColor: colors.error + "12",
                  borderColor: colors.error + "30",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-alert-outline"
                size={18}
                color={colors.error}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannedTitle, { color: colors.error }]}>
                  This RFQ has been flagged
                </Text>
                {rfq.justificationNotes ? (
                  <Text
                    style={[styles.bannedNote, { color: colors.textSecondary }]}
                  >
                    {rfq.justificationNotes}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Award banner */}
          {rfq.status === "awarded" && (
            <View
              style={[
                styles.awardBanner,
                {
                  backgroundColor: colors.success + "12",
                  borderColor: colors.success + "30",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="trophy-outline"
                size={18}
                color={colors.success}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.awardTitle, { color: colors.success }]}>
                  Vendor awarded
                </Text>
                <Text
                  style={[styles.awardNote, { color: colors.textSecondary }]}
                >
                  {fmtDate(rfq.awardDate)}
                </Text>
              </View>
            </View>
          )}

          {/* Title card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.postedByRow}>
              <ClickableAvatar
                entityType="facility"
                entityId={rfq.facilityId}
                name={facilities.find((f) => f.id === rfq.facilityId)?.name ?? "Unknown facility"}
                avatarColor={colors.secondary}
                subtitle="Posted this RFQ"
                size={40}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.postedByLabel, { color: colors.textSecondary }]}>Posted by</Text>
                <Text style={[styles.facility, { color: colors.text }]}>
                  {facilities.find((f) => f.id === rfq.facilityId)?.name ?? "Unknown facility"}
                </Text>
              </View>
            </View>
            {rfq.description ? (
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {rfq.description}
              </Text>
            ) : null}
            {rfq.categories.length > 0 && (
              <View style={styles.chipRow}>
                {rfq.categories.map((cat) => (
                  <View
                    key={cat}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    <Text
                      style={[styles.chipText, { color: colors.textSecondary }]}
                    >
                      {cat}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {rfq.productCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Products
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {rfq.responseCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Responses
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {rfq.currency}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Currency
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="truck-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {rfq.incoterms}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Incoterms
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Timeline
            </Text>

            <View style={styles.timelineRow}>
              <Text
                style={[styles.timelineLabel, { color: colors.textSecondary }]}
              >
                Created
              </Text>
              <Text style={[styles.timelineValue, { color: colors.text }]}>
                {fmtDateTime(rfq.createdAt)}
              </Text>
            </View>
            <View style={styles.timelineRow}>
              <Text
                style={[styles.timelineLabel, { color: colors.textSecondary }]}
              >
                Published
              </Text>
              <Text style={[styles.timelineValue, { color: colors.text }]}>
                {rfq.publishedAt
                  ? fmtDateTime(rfq.publishedAt)
                  : "Not yet published"}
              </Text>
            </View>

            <View
              style={[styles.deadlineRow, { borderTopColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Submission deadline
                </Text>
                <Text style={[styles.timelineValue, { color: colors.text }]}>
                  {fmtDateTime(rfq.submissionDeadline)}
                </Text>
                {rfq.status === "published" && (
                  <Text
                    style={[styles.deadlineCountdown, { color: deadlineColor }]}
                  >
                    {daysToDeadline > 0
                      ? `${daysToDeadline} day${daysToDeadline > 1 ? "s" : ""} remaining`
                      : "Deadline passed"}
                  </Text>
                )}
              </View>
              {(rfq.status === "published" || rfq.status === "expired") && (
                <TouchableOpacity
                  style={[
                    styles.extendButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundElement,
                    },
                  ]}
                  onPress={() => extendSheetRef.current?.present()}
                >
                  <MaterialCommunityIcons
                    name="calendar-plus"
                    size={14}
                    color={colors.text}
                  />
                  <Text
                    style={[styles.extendButtonText, { color: colors.text }]}
                  >
                    Extend
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.timelineRow}>
              <Text
                style={[styles.timelineLabel, { color: colors.textSecondary }]}
              >
                Expected delivery
              </Text>
              <Text style={[styles.timelineValue, { color: colors.text }]}>
                {fmtDate(rfq.deliveryDate)}
              </Text>
            </View>
          </View>

          {/* Requirements & terms */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Requirements & Terms
            </Text>

            <View style={styles.timelineRow}>
              <Text
                style={[styles.timelineLabel, { color: colors.textSecondary }]}
              >
                Minimum shelf life
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={[styles.timelineValue, { color: colors.text }]}>
                  {rfq.minShelfLifeMonths} months
                </Text>
                {rfq.strictMinShelfLife && (
                  <View
                    style={[
                      styles.strictBadge,
                      { backgroundColor: colors.warning + "18" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.strictBadgeText,
                        { color: colors.warning },
                      ]}
                    >
                      Strict
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {rfq.termsOfService ? (
              <View style={{ marginTop: 4 }}>
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: colors.textSecondary, marginBottom: 4 },
                  ]}
                >
                  Terms of service
                </Text>
                <Text style={[styles.termsText, { color: colors.text }]}>
                  {rfq.termsOfService}
                </Text>
              </View>
            ) : null}

            {rfq.comment ? (
              <View style={{ marginTop: 4 }}>
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: colors.textSecondary, marginBottom: 4 },
                  ]}
                >
                  Internal comment
                </Text>
                <Text
                  style={[
                    styles.termsText,
                    { color: colors.textSecondary, fontStyle: "italic" },
                  ]}
                >
                  {rfq.comment}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Items */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Requested Items ({rfq.items.length})
            </Text>
            <RxRfqReadonlyItemsList items={rfq.items} />
          </View>

          {/* Visibility */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Visibility
            </Text>
            <View style={styles.visibilityRow}>
              <MaterialCommunityIcons
                name={
                  rfq.visibilityScope === "All" ? "earth" : "filter-outline"
                }
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.visibilityText, { color: colors.text }]}>
                {rfq.visibilityScope === "All"
                  ? "Visible to all vendors on the marketplace"
                  : `Restricted · ${rfq.visibilityRules.length} rule${rfq.visibilityRules.length > 1 ? "s" : ""}`}
              </Text>
            </View>
            {rfq.visibilityScope === "Restricted" &&
              rfq.visibilityRules.length > 0 && (
                <View style={styles.ruleList}>
                  {rfq.visibilityRules.map((rule, idx) => (
                    <View
                      key={rule.id || idx}
                      style={[
                        styles.ruleChip,
                        { backgroundColor: colors.backgroundElement },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ruleChipText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {rule.ruleType}:{" "}
                        {rule.region || rule.facilityType || rule.facility}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
          </View>

          {/* Responses */}
          <View style={styles.responsesSection}>
            <View style={styles.responsesHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Responses ({responses.length})
              </Text>
              {responses.length > 1 && (
                <Text
                  style={[
                    styles.responsesSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sorted by quote value
                </Text>
              )}
            </View>

            {sortedResponses.length === 0 ? (
              <View
                style={[
                  styles.emptyResponses,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyResponsesText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {rfq.status === "draft"
                    ? "Publish this RFQ to start receiving vendor responses."
                    : "No responses received yet."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {sortedResponses.map((response) => (
                  <RxRfqResponseSummaryCard
                    key={response.id}
                    response={response}
                    currency={rfq.currency}
                    isAwarded={rfq.awardedVendorId === response.id}
                    onPress={() =>
                      router.push({
                        pathname: "/rfqs/response-details",
                        params: { id: response.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <RxRfqStatusActionsSheet
          ref={actionsSheetRef}
          status={rfq.status}
          responseCount={responses.length}
          onClose={() => {}}
          onAction={handleStatusAction}
        />

        <RxRfqExtendDeadlineSheet
          ref={extendSheetRef}
          currentDeadline={rfq.submissionDeadline}
          onClose={() => {}}
          onConfirm={handleExtendConfirm}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  headerIconButton: { padding: 6 },
  headerCenter: { flex: 1, alignItems: "center", gap: 4 },
  headerCode: { fontSize: 15, fontWeight: "700" },

  scrollContent: { padding: 16, gap: 12 },

  bannedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  bannedTitle: { fontSize: 13, fontWeight: "700" },
  bannedNote: { fontSize: 12, marginTop: 2 },

  awardBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  awardTitle: { fontSize: 13, fontWeight: "700" },
  awardNote: { fontSize: 12, marginTop: 2 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700" },

  facility: { fontSize: 17, fontWeight: "700" },
  postedByRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  postedByLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  description: { fontSize: 13, lineHeight: 19 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 12, fontWeight: "500" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: {
    flexBasis: "23%",
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 14, fontWeight: "700" },
  statLabel: { fontSize: 10, textAlign: "center" },

  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  timelineLabel: { fontSize: 12 },
  timelineValue: { fontSize: 13, fontWeight: "500" },

  deadlineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 4,
  },
  deadlineCountdown: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  extendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  extendButtonText: { fontSize: 12, fontWeight: "600" },

  strictBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  strictBadgeText: { fontSize: 10, fontWeight: "700" },

  termsText: { fontSize: 12, lineHeight: 18 },

  visibilityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  visibilityText: { fontSize: 13, flex: 1 },
  ruleList: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  ruleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ruleChipText: { fontSize: 11, fontWeight: "500" },

  responsesSection: { gap: 8 },
  responsesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  responsesSubtitle: { fontSize: 11 },
  emptyResponses: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyResponsesText: { fontSize: 13, textAlign: "center" },
});

export default RxRfqDetailsScreen;
