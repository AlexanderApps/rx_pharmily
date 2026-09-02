import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedView } from "@/shared/components/themed-view";
import Input from "@/shared/components/input";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  convertToCardData,
  useMediscopeStore,
} from "@/features/mediscope/hooks/use-mediscope-data";
import { MediscopeStatus } from "@/features/mediscope/types/mediscope.types";
import MediscopeListContainer from "@/features/mediscope/components/mediscope-list-container";
import SearchFilterChip from "@/shared/components/search-filter-chip";

const STATUS_FILTERS: MediscopeStatus[] = ["published", "fulfilled", "closed"];

export default function SearchMediscope() {
  const searchInputRef = useRef<TextInput>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MediscopeStatus | null>(null);
  const { colors } = useTheme();
  const requests = useMediscopeStore((state) => state.requests);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => {
        if (statusFilter && r.status !== statusFilter) return false;
        if (!q) return true;
        return (
          r.product.toLowerCase().includes(q) ||
          r.facilityName.toLowerCase().includes(q) ||
          r.facilityLocation.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(convertToCardData);
  }, [requests, search, statusFilter]);

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
              <Input
                ref={searchInputRef}
                placeholder="Search products, facilities..."
                value={search}
                onChangeText={setSearch}
                variant="flat"
                size="medium"
                returnKeyType="search"
                borderRadius={10}
                inputContainerStyle={{ paddingHorizontal: 14 }}
                leftIcon={<Ionicons name="search" size={20} color={colors.textSecondary} />}
                rightIcon={
                  search ? (
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  ) : undefined
                }
                onRightIconPress={() => setSearch("")}
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <View style={{ height: 52 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              gap: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {STATUS_FILTERS.map((status) => (
              <SearchFilterChip
                key={status}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                active={statusFilter === status}
                onPress={() => setStatusFilter(statusFilter === status ? null : status)}
              />
            ))}
          </ScrollView>
        </View>

        <ThemedView style={{ flex: 1 }}>
          <MediscopeListContainer
            requests={results}
            onCardPress={(id) => {
              const isOwner = results.find((c) => c.id === id)?.isOwner;
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
