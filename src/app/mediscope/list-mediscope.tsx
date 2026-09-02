import { useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";
import SearchButton from "@/shared/components/search-button";
import MoreMenu from "@/shared/components/more-menu";
import MediscopeListContainer from "@/features/mediscope/components/mediscope-list-container";
import {
  convertToCardData,
  useMediscopeStore,
} from "@/features/mediscope/hooks/use-mediscope-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";

export default function ListMediscope() {
  const { colors } = useTheme();
  const requests = useMediscopeStore((state) => state.requests);
  const { mine } = useLocalSearchParams<{ mine?: string }>();

  // "View All" from the index page's "My MediScope Requests" section
  // links here with ?mine=true, scoping the list to requests this user
  // created — otherwise this is the public marketplace view, which (like
  // every other browse screen) only shows what's actually open to
  // respond to; draft, cancelled, closed, and expired requests aren't
  // available regardless of who created them.
  const cards = useMemo(() => {
    const userId = useProfileStore.getState().user.id;
    return [...requests]
      .filter((r) =>
        mine === "true" ? r.createdBy === userId : r.status === "published",
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(convertToCardData);
  }, [requests, mine]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView
          style={{
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <ThemedView
            style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 }}
          >
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

            <ThemedView style={{ flex: 1 }}>
              <SearchButton
                placeholder="Search MediScope..."
                onPress={() => router.push("/mediscope/search-mediscope")}
                variant="default"
              />
            </ThemedView>

            <MoreMenu
              iconColor={colors.text}
              style={{ backgroundColor: colors.backgroundElement }}
              items={[
                {
                  label: "New Request",
                  icon: "add-outline",
                  onPress: () => router.push("/mediscope/add-mediscope-request"),
                },
              ]}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={{ flex: 1 }}>
          <MediscopeListContainer
            requests={cards}
            onCardPress={(id) => {
              const isOwner = cards.find((c) => c.id === id)?.isOwner;
              router.push({
                pathname: isOwner
                  ? "/mediscope/mediscope-details"
                  : "/mediscope/mediscope-market-details",
                params: { id },
              });
            }}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
