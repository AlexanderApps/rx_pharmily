import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions, Platform} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { RxRfqCardData } from "@/features/rxrfqs/types/rxrfqs.types";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface RxRfqDetailScreenProps {
  route: {
    params: {
      rfq: RxRfqCardData;
      onEdit?: () => void;
      onDelete?: () => void;
    };
  };
  navigation: {
    goBack: () => void;
  };
}

// ... maintain your other UI imports here

const { width } = Dimensions.get("window");

const RxRfqDetailScreen: React.FC<RxRfqDetailScreenProps> = () => {
  const { colors } = useTheme();
  const rxRfqData = useRxRfqsStore((state) => state.rxrfqs);
  const router = useRouter();

  // 1. Grab the id passed via router.push params
  const { id } = useLocalSearchParams<{ id: string }>();

  // 2. Locate or fetch the matching record from your global state/cache hook
  // Replace this with your actual data source (e.g., useRxRfqQuery(id) or Context)
  const rfq = useMemo(() => {
    return rxRfqData.find((item) => item.id === id);
  }, [id]);

  // Action mockups suited for Expo Router architecture
  const handleEdit = () => {
    // router.push({ pathname: "/rfqs/edit", params: { id } });
  };

  const handleDelete = () => {
    // Execute delete mutation here, then pop back
    router.back();
  };

  // // If record hasn't loaded or isn't found
  // if (!rfq) {
  //   return (
  //     <SafeAreaView style={[styles.fallbackContainer, { backgroundColor: colors.background }]}>
  //       <Text style={{ color: colors.text }}>Request details could not be found.</Text>
  //     </SafeAreaView>
  //   );

  if (!rfq) {
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

  const formattedPublished = useMemo(
    () => formatDate(rfq.publishedAt),
    [rfq.publishedAt],
  );
  const formattedDeadline = useMemo(
    () => formatDate(rfq.submissionDeadline),
    [rfq.submissionDeadline],
  );

  const isExpired = useMemo(() => {
    if (!rfq.submissionDeadline) return false;
    const deadline =
      typeof rfq.submissionDeadline === "string"
        ? new Date(rfq.submissionDeadline)
        : rfq.submissionDeadline;
    return deadline.getTime() < Date.now();
  }, [rfq.submissionDeadline]);

  const themeStyles = {
    screen: { backgroundColor: colors.background },
    borderBottom: { borderBottomColor: colors.border },
    sectionBox: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
    },
    accentText: { color: colors.primary || "#2563EB" },
    warningText: {
      color: isExpired ? colors.error : colors.warning || "#D97706",
    },
    warningBadge: {
      backgroundColor: isExpired
        ? `${colors.error}15`
        : `${colors.warning || "#D97706"}15`,
    },
  };

  return (
    <SafeAreaView style={[styles.screenContainer, themeStyles.screen]}>
      {/* Top Navbar */}
      <View style={[styles.navBar, themeStyles.borderBottom]}>
        {Platform.OS !== "web" && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        )}

        <Text
          style={[styles.navTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          Request Details
        </Text>

        <View style={styles.navActionRight}>
          {handleEdit ? (
            <TouchableOpacity onPress={handleEdit} style={styles.navButton}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Summary Panel */}
        <View style={styles.heroHeader}>
          <View
            style={[
              styles.heroIconWrapper,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <MaterialCommunityIcons
              name="hospital-building"
              size={36}
              color={themeStyles.accentText.color}
            />
          </View>
          <Text style={[styles.facilityHeading, { color: colors.text }]}>
            {rfq.facilityName}
          </Text>

          <View style={styles.locationWrapper}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.locationLabel, { color: colors.textSecondary }]}
            >
              {rfq.facilityLocation}
            </Text>
          </View>

          {/* Dynamic Status Pill Badge */}
          <View style={[styles.statusBadge, themeStyles.warningBadge]}>
            <MaterialCommunityIcons
              name={isExpired ? "alert-circle-outline" : "clock-outline"}
              size={14}
              color={themeStyles.warningText.color}
            />
            <Text style={[styles.statusText, themeStyles.warningText]}>
              {isExpired ? "Submission Closed" : "Open for Bids"}
            </Text>
          </View>
        </View>

        {/* Section Block: Volume Inventory Focus */}
        <View style={[styles.infoSectionCard, themeStyles.sectionBox]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons
              name="pill"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>
              Order Details
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {rfq.productCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {rfq.productCount === 1
                ? "Pharmaceutical Product"
                : "Total Products Requested"}
            </Text>
          </View>
        </View>

        {/* Section Block: Timelines */}
        <View style={[styles.infoSectionCard, themeStyles.sectionBox]}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>
              Timeline Schedule
            </Text>
          </View>

          <View style={styles.timelineRowItem}>
            <Text
              style={[styles.timelineLabel, { color: colors.textSecondary }]}
            >
              Published On
            </Text>
            <Text style={[styles.timelineValue, { color: colors.text }]}>
              {formattedPublished}
            </Text>
          </View>

          <View
            style={[
              styles.horizontalLineDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={styles.timelineRowItem}>
            <Text
              style={[styles.timelineLabel, { color: colors.textSecondary }]}
            >
              Closing Date
            </Text>
            <Text
              style={[
                styles.timelineValue,
                themeStyles.warningText,
                { fontWeight: "600" },
              ]}
            >
              {formattedDeadline}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Action Zone */}
      {handleDelete && (
        <View
          style={[
            styles.footerActionShelf,
            { borderTopWidth: 1, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: colors.error }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={colors.error}
            />
            <Text style={[styles.dangerButtonText, { color: colors.error }]}>
              Delete Request
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Fixed: Was set to invalid value 'between'
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  navActionRight: {
    minWidth: 44,
    alignItems: "flex-end",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroHeader: {
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  facilityHeading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: width - 80,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoSectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricRow: {
    alignItems: "flex-start",
    gap: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  timelineRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  horizontalLineDivider: {
    height: 1,
    marginVertical: 10,
  },
  footerActionShelf: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dangerButton: {
    flexDirection: "row",
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default RxRfqDetailScreen;
