import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, FlatList, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import MoreMenu from "@/shared/components/more-menu";
import SearchFilterChip from "@/shared/components/search-filter-chip";
import RxRfqList from "@/features/rxrfqs/components/rxrfq-list-container";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";

// Matches "Closing Soon" on the full Search screen's own filter set —
// this is deliberately just the one, highest-value quick filter
// inline here, not the complete set (region/category still require
// leaving to Search) — enough to cover the common "what's urgent"
// case without a navigation.
const CLOSING_SOON_DAYS = 7;

export default function ListRFQs() {
  const { colors } = useTheme();
  const rxRfqData = useRxRfqsStore((state) => state.rxrfqs);
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);

  // This is the public marketplace view — draft (not yet visible to
  // anyone but its owner), cancelled, and closed requests aren't
  // available to respond to, so they don't belong in a browse of what's
  // currently open for quotes.
  const publishedRfqs = useMemo(() => {
    const now = Date.now();
    const soonCutoff = now + CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000;
    return rxRfqData.filter((rfq) => {
      if (rfq.status !== "published" || rfq.isRemoved) return false;
      if (closingSoonOnly) {
        const deadline = new Date(rfq.submissionDeadline).getTime();
        if (deadline < now || deadline > soonCutoff) return false;
      }
      return true;
    });
  }, [rxRfqData, closingSoonOnly]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView
          style={{
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.backgroundSecondary,
          }}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            {/* Back Button */}
            {Platform.OS !== "web" && (
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.backgroundElement,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
            )}

            {/* Search */}
            <ThemedView style={{ flex: 1 }}>
              <SearchButton
                placeholder="Search RFQ..."
                onPress={() => {
                  router.push("/rfqs/search-rfqs");
                }}
                variant="default"
              />
            </ThemedView>

            {/* More Menu */}
            <MoreMenu
              iconColor={colors.text}
              style={{ backgroundColor: colors.backgroundElement }}
              items={[
                {
                  label: "Edit",
                  icon: "create-outline",
                  onPress: () => console.log("Edit"),
                },
                {
                  label: "Share",
                  icon: "share-social-outline",
                  onPress: () => console.log("Share"),
                },
                {
                  label: "Delete",
                  icon: "trash-outline",
                  destructive: true,
                  onPress: () => console.log("Delete"),
                },
              ]}
            />
          </ThemedView>
        </ThemedView>

        {/* Quick Filters */}
        <ThemedView style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <SearchFilterChip
            label="Closing Soon"
            icon="clock-alert-outline"
            active={closingSoonOnly}
            activeColor={colors.error}
            onPress={() => setClosingSoonOnly((v) => !v)}
          />
        </ThemedView>

        {/* Screen Content Feed */}
        <ThemedView style={{ flex: 1 }}>
          <RxRfqList
            rfqs={publishedRfqs}
            onCardPress={(id) =>
              router.push({
                pathname: "/rfqs/rxrfq-market-details",
                params: { id },
              })
            }
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
