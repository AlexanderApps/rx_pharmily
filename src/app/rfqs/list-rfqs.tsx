import { router } from "expo-router";
import { Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import MoreMenu from "@/shared/components/more-menu";
import RxRfqList from "@/features/rxrfqs/components/rxrfq-list-container";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";

export default function ListRFQs() {
  const { colors } = useTheme();
  const rxRfqData = useRxRfqsStore((state) => state.rxrfqs);

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

        {/* Screen Content Feed */}
        <ThemedView style={{ flex: 1 }}>
          <RxRfqList
            rfqs={rxRfqData}
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
