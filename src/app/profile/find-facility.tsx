import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import ListSkeleton from "@/shared/components/list-skeleton";

export default function FindFacilityScreen() {
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const user = useProfileStore((state) => state.user);
  const facilities = useProfileStore((state) => state.facilities);
  const facilityMemberships = useProfileStore((state) => state.facilityMemberships);
  const membershipRequests = useProfileStore((state) => state.facilityMembershipRequests);
  const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
  const fetchFacilityMembershipRequests = useProfileStore((state) => state.fetchFacilityMembershipRequests);

  const [search, setSearch] = useState("");
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);

  useEffect(() => {
    Promise.all([fetchFacilities(), fetchFacilityMembershipRequests()]).finally(() =>
      setIsLoadingFacilities(false),
    );
  }, []);

  const isUserVerified = user.kyc.status === "verified";
  const myFacilityIds = useMemo(
    () => new Set(facilityMemberships.filter((m) => m.userId === currentUserId).map((m) => m.facilityId)),
    [facilityMemberships, currentUserId],
  );
  const myPendingFacilityIds = useMemo(
    () =>
      new Set(
        membershipRequests
          .filter((r) => r.requestedBy === currentUserId && r.status === "pending")
          .map((r) => r.facilityId),
      ),
    [membershipRequests, currentUserId],
  );

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return facilities
      .filter((f) => f.kyc.status === "verified" && !myFacilityIds.has(f.id))
      .filter(
        (f) =>
          !query ||
          f.name.toLowerCase().includes(query) ||
          f.location.toLowerCase().includes(query) ||
          f.region.toLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities, myFacilityIds, search]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Find a Facility</Text>
      </View>

      {!isUserVerified && (
        <View style={[styles.notice, { backgroundColor: colors.warning + "12" }]}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.warning }]}>
            Verify your own account before you can request to join a facility. You can still browse in
            the meantime.
          </Text>
        </View>
      )}

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement }]}>
          <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, city, or region"
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {isLoadingFacilities && facilities.length === 0 ? (
        <ListSkeleton rows={6} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="hospital-building" size={36} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {search ? "No facilities match your search." : "No other verified facilities yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const pending = myPendingFacilityIds.has(item.id);
            return (
              <Pressable
                onPress={() => router.push({ pathname: "/profile/facility-profile", params: { id: item.id } })}
                style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              >
                <View
                  style={[styles.avatar, { backgroundColor: colors.primary + "18" }]}
                >
                  <MaterialCommunityIcons name="hospital-building" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.type} · {item.location}, {item.region}
                  </Text>
                </View>
                {pending ? (
                  <View style={[styles.pendingPill, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
                      Requested
                    </Text>
                  </View>
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  back: { padding: 4 },
  title: { fontSize: 17, fontWeight: "700" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 17 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  listContent: { padding: 16, flexGrow: 1 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 80 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  avatar: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  pendingPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
});
