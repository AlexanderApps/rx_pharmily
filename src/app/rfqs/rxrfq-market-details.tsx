import { useTheme } from "@/shared/hooks/use-theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Share, Platform} from "react-native";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ContextText } from "@/shared/components/context-text";
import ClickableAvatar from "@/features/profile/components/clickable-avatar";
import { useChatStore } from "@/features/chat/hooks/use-chat-data";
import DetailSkeleton from "@/shared/components/detail-skeleton";

const RxMarketplaceDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  const rxRfqData = useRxRfqsStore((state) => state.rxrfqMarketPlace);
  const isLoadingRfqs = useRxRfqsStore((state) => state.isLoading);
  const facilities = useProfileStore((state) => state.facilities);
  const incotermList = useRxRfqsStore((state) => state.incotermOptions);
  const startFacilityConversation = useChatStore((state) => state.startFacilityConversation);

  // 1. Grab the id passed via router.push params
  const { id } = useLocalSearchParams<{ id: string }>();

  // 2. Locate the matching record from the already-primed marketplace list
  const item = useMemo(() => {
    return rxRfqData.find((item) => item.id === id);
  }, [rxRfqData, id]);

  const incotermDes = useMemo(() => {
    return incotermList.find((option) => option.code === item?.incoterms);
  }, [incotermList, item?.incoterms]);

  if (!item) {
    if (isLoadingRfqs) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <DetailSkeleton rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
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

  const handleContact = async () => {
    if (isContacting) return;
    setIsContacting(true);
    try {
      const conversationId = await startFacilityConversation({ id: item.facilityId, name: facilityName });
      if (conversationId) {
        router.push({ pathname: "/chat/thread", params: { id: conversationId } });
      }
    } finally {
      setIsContacting(false);
    }
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
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Nav bar */}
      <View className="flex-row items-center px-4 py-3 border-b-[0.5px] gap-3" style={{ borderBottomColor: colors.border }}>
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
            {item.code}
          </Text>
          <Text className="text-xs mt-px" style={{ color: colors.textSecondary }}>
            {format(item.publishedAt)}
          </Text>
        </View>
        {/* Status pill */}
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: colors.success + "20" }}
        >
          <Text className="text-xs font-medium capitalize" style={{ color: colors.success }}>
            {item.status}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Facility hero block */}
        <View className="flex-row items-center gap-3 mb-3">
          <ClickableAvatar
            entityType="facility"
            entityId={item.facilityId}
            name={facilityName}
            avatarColor={colors.secondary}
            imageUri={facility?.logoUrl}
            subtitle="Posted this RFQ"
            size={56}
          />
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {facilityName}
            </Text>
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                className="text-[13px]"
                style={{ color: colors.textSecondary }}
              >
                {facilityLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text className="text-sm leading-5 mb-5" style={{ color: colors.textSecondary }}>
            {item.description}
          </Text>
        ) : null}

        {/* ── Delivery & Deadlines ── */}
        <SectionHeader title="Delivery & deadlines" />
        <Card>
          {isUrgent && (
            <View
              className="flex-row items-center gap-1.5 px-3.5 py-2"
              style={{ backgroundColor: colors.warning + "18" }}
            >
              <Ionicons
                name="hourglass-outline"
                size={14}
                color={colors.warning}
              />
              <Text className="text-[13px] font-medium" style={{ color: colors.warning }}>
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
        onContact={handleContact}
        onShare={handleShare}
        onBookmark={() => setIsBookmarked((v) => !v)}
      />
    </SafeAreaView>
  );
};

export default RxMarketplaceDetailScreen;
