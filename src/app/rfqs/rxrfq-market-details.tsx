import { RxRfqMarketPlaceData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useTheme } from "@/shared/hooks/use-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Share,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "timeago.js";
import {
  Card,
  SectionHeader,
  InfoRow,
  TermsCard,
  ProductItem,
  FabGroup,
} from "@/features/rxrfqs/components/rds";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { router, useLocalSearchParams } from "expo-router";
import { ContextText } from "@/shared/components/context-text";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";

interface RxMarketplaceDetailScreenProps {
  onBack: () => void;
  onSubmitQuote: (item: RxRfqMarketPlaceData) => void;
  onContactFacility: (item: RxRfqMarketPlaceData) => void;
}

const RxMarketplaceDetailScreen = ({
  onSubmitQuote,
  onContactFacility,
}: RxMarketplaceDetailScreenProps) => {
  const { colors } = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const rxRfqData = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const facilities = useProfileStore((state) => state.facilities);
  const incotermList = useRxRfqsStore((state) => state.incotermOptions);

  // 1. Grab the id passed via router.push params
  const { id } = useLocalSearchParams<{ id: string }>();

  // 2. Locate or fetch the matching record from your global state/cache hook
  // Replace this with your actual data source (e.g., useRxRfqQuery(id) or Context)
  const item = useMemo(() => {
    return rxRfqData.find((item) => item.id === id);
  }, [id]);

  const incotermDes = useMemo(() => {
    return incotermList.find((option) => option.code === item?.incoterms);
  }, []);

  if (!item) {
    return (
      <SafeAreaView
        style={[
          styles.fallbackContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.text }}>
          Request details could not be loaded.
        </Text>
      </SafeAreaView>
    );
  }

  // const incotermData = useMemo(() => {
  //   return incotermOptions.find((option) => option.code === item.incoterms);
  // }, []);

  const facility = facilities.find((f) => f.id === item.facilityId);
  const facilityName = facility?.name ?? "Unknown facility";
  const facilityLocation = facility?.location ?? "-";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `RFQ ${item.code} — ${facilityName}\nDeadline: ${item.submissionDeadline.toISOString()}`,
      });
    } catch (_) {}
  };

  const deadlineDate = new Date(item.submissionDeadline);
  const deliveryDate = new Date(item.deliveryDate);
  const isUrgent = deadlineDate.getTime() - Date.now() < 1000 * 60 * 60 * 48; // < 48h

  const formatDate = (dateInput: Date | string | undefined): string => {
    if (!dateInput) return "N/A";
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return isNaN(date.getTime())
      ? String(dateInput)
      : date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Nav bar */}
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.navbarMeta}>
          <Text style={[styles.navbarCode, { color: colors.text }]}>
            {item.code}
          </Text>
          <Text style={[styles.navbarTime, { color: colors.textSecondary }]}>
            {format(item.publishedAt)}
          </Text>
        </View>
        {/* Status pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: colors.success + "20" },
          ]}
        >
          <Text style={[styles.statusPillText, { color: colors.success }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Facility hero block */}
        <View style={styles.hero}>
          <ClickableAvatar
            entityType="facility"
            entityId={item.facilityId}
            name={facilityName}
            avatarColor={colors.secondary}
            subtitle="Posted this RFQ"
            size={56}
          />
          <View style={styles.heroMeta}>
            <Text style={[styles.heroName, { color: colors.text }]}>
              {facilityName}
            </Text>
            <View style={styles.heroLocationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.heroLocation, { color: colors.textSecondary }]}
              >
                {facilityLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        ) : null}

        {/* ── Delivery & Deadlines ── */}
        <SectionHeader title="Delivery & deadlines" />
        <Card>
          {isUrgent && (
            <View
              style={[
                styles.urgentBanner,
                { backgroundColor: colors.warning + "18" },
              ]}
            >
              <Ionicons
                name="hourglass-outline"
                size={14}
                color={colors.warning}
              />
              <Text style={[styles.urgentText, { color: colors.warning }]}>
                Deadline closing soon — {format(deadlineDate)}
              </Text>
            </View>
          )}
          <InfoRow
            icon="calendar-clock"
            label="Submission deadline"
            // value={deadlineDate.toISOString()}
            value={formatDate(deadlineDate)}
            // value={dateFormat(deadlineDate, "dd MMM yyyy, HH:mm")}
          />
          <InfoRow
            icon="truck-delivery-outline"
            label="Expected delivery"
            // value={deliveryDate.toISOString()}
            value={formatDate(deliveryDate)}
            // value={dateFormat(deliveryDate, "dd MMM yyyy")}
          />
          <InfoRow
            icon="package-variant"
            label="Min. shelf life"
            value={`${item.minShelfLifeMonths} months`}
            badge={
              item.strictMinShelfLife
                ? { label: "Strict", color: colors.error }
                : { label: "Flexible", color: colors.success }
            }
          />
          <InfoRow
            icon="swap-horizontal"
            label="Incoterms"
            value={<ContextText value={item.incoterms} subtitle={incotermDes?.label} definition={incotermDes?.description || ""} />}
          />
          <InfoRow icon="cash" label="Currency" value={item.currency} />
        </Card>

        {/* ── Terms & Conditions ── */}
        <SectionHeader title="Terms & conditions" />
        <TermsCard
          termsOfService={item.termsOfService}
          comment={item.comment}
        />

        {/* ── Product items ── */}
        <SectionHeader title={`Products (${item.items.length})`} />
        <Card>
          {item.items.map((product, index) => (
            <ProductItem
              key={product.id}
              product={product}
              index={index}
              isLast={index === item.items.length - 1}
            />
          ))}
        </Card>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB group */}
      <FabGroup
        isBookmarked={isBookmarked}
        onSubmit={() =>
          router.push({
            pathname: "/rfqs/response-rfqs",
            params: { id: item.id },
          })
        }
        onContact={() => onContactFacility(item)}
        onShare={handleShare}
        onBookmark={() => setIsBookmarked((v) => !v)}
      />
    </SafeAreaView>
  );
};

export default RxMarketplaceDetailScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  navbarMeta: {
    flex: 1,
  },
  navbarCode: {
    fontSize: 15,
    fontWeight: "500",
  },
  navbarTime: {
    fontSize: 12,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 18,
    fontWeight: "600",
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroLocation: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  urgentText: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  termsText: {
    fontSize: 14,
    lineHeight: 21,
    padding: 14,
  },
  termsDivider: {
    height: 0.5,
    marginHorizontal: 14,
  },
  commentRow: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    alignItems: "flex-start",
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
  },
  productIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  productIndexText: {
    fontSize: 13,
    fontWeight: "500",
  },
  productMeta: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
  },
  productQty: {
    fontSize: 13,
  },
  productComment: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: "italic",
  },
  productDivider: {
    height: 0.5,
    marginLeft: 54,
  },
  fabGroup: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fabSecondary: {
    flexDirection: "row",
    gap: 8,
  },
  fabIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  fabPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabPrimaryText: {
    fontSize: 15,
    fontWeight: "500",
  },

  productIndicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  altBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  altBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  commentToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  commentToggleText: {
    fontSize: 11,
    fontWeight: "500",
  },
  commentBlock: {
    marginTop: 8,
    borderLeftWidth: 2,
    paddingLeft: 10,
  },
  commentBlockText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  termsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  termsToggleText: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
