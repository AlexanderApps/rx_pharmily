import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";
import ActionButton from "@/shared/components/action-button";
import StatCard from "@/shared/components/stat-card";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import AdCard from "@/features/ads/components/ad-card";

export default function RxAdsScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const ads = useAdsStore((state) => state.ads);

  const liveAds = useMemo(
    () =>
      ads
        .filter((a) => a.status === "approved")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [ads],
  );

  const myAds = useMemo(
    () => ads.filter((a) => a.advertiser.id === currentUserId),
    [ads, currentUserId],
  );
  const pendingCount = myAds.filter((a) => a.status === "pending").length;
  const liveCount = myAds.filter((a) => a.status === "approved").length;

  const openAdDetails = (id: string, isOwner: boolean) => {
    router.push({
      pathname: isOwner ? "/ads/ad-details" : "/ads/ad-market-details",
      params: { id },
    });
  };

  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>RxAds</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Reach pharmacy professionals directly
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/ads/moderation")}
            style={[styles.modIconBtn, { backgroundColor: colors.backgroundSecondary }]}
          >
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Advertising</Text>
            <View style={styles.statsRow}>
              <StatCard
                number={`${liveCount}`}
                label="Live Ads"
                type="success"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
              <StatCard
                number={`${pendingCount}`}
                label="Pending Review"
                type="warning"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
              <StatCard
                number={`${myAds.length}`}
                label="Total Ads"
                type="info"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
            </View>
          </View>

          <View style={styles.sectionPadding}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.statsRow}>
              <ActionButton
                icon={<MaterialCommunityIcons name="plus-box-outline" size={22} color="#2563eb" />}
                label="Create Ad"
                colors={colors}
                onPress={() => router.push("/ads/create-ad")}
              />
              <ActionButton
                icon={<MaterialCommunityIcons name="format-list-bulleted" size={22} color="#16a34a" />}
                label="My Ads"
                colors={colors}
                onPress={() => router.push("/ads/my-ads")}
              />
              <ActionButton
                icon={<MaterialCommunityIcons name="shield-check-outline" size={22} color="#9333ea" />}
                label="Moderation"
                colors={colors}
                onPress={() => router.push("/ads/moderation")}
              />
            </View>
          </View>

          <View style={styles.sectionPadding}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Now</Text>
            </View>
            <View style={{ gap: 10 }}>
              {liveAds.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  No ads are live yet.
                </Text>
              ) : (
                liveAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} onPress={() => openAdDetails(ad.id, ad.advertiser.id === currentUserId)} />
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <Pressable
          onPress={() => router.push("/ads/create-ad")}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="add" size={30} color={colors.background} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  modIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingBottom: 120 },
  sectionPadding: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 12 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
