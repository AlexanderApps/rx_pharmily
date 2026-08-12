import { useMemo } from "react";
import { router } from "expo-router";
import { Pressable } from "react-native";
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

export default function ListMediscope() {
  const { colors } = useTheme();
  const requests = useMediscopeStore((state) => state.requests);

  const cards = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(convertToCardData),
    [requests],
  );

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
