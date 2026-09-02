import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, TextInput, Platform} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import EmptyState from "@/shared/components/empty-state";
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Top Header Section */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b-[0.5px]" style={{ borderBottomColor: colors.border }}>
        {Platform.OS !== "web" && (
        <Pressable onPress={() => router.back()} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        )}
        <Text className="text-[17px] font-bold" style={{ color: colors.text }}>Find a Facility</Text>
      </View>

      {/* Verification Notice Banner */}
      {!isUserVerified && (
        <View className="flex-row items-start gap-1.5 rounded-xl p-2.5 mx-4 mt-3" style={{ backgroundColor: colors.warning + "12" }}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
          <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.warning }}>
            Verify your own account before you can request to join a facility. You can still browse in
            the meantime.
          </Text>
        </View>
      )}

      {/* Search Bar Frame */}
      <View className="px-4 pt-3">
        <View className="flex-row items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.backgroundElement }}>
          <MaterialCommunityIcons name="magnify" size={16} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, city, or region"
            placeholderTextColor={colors.textSecondary}
            className="flex-1 text-xs p-0"
            style={{ color: colors.text }}
          />
        </View>
      </View>

      {/* Content Stream Layer */}
      {isLoadingFacilities && facilities.length === 0 ? (
        <ListSkeleton rows={6} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EmptyState
              icon="hospital-building"
              message={search ? "No facilities match your search." : "No other verified facilities yet."}
            />
          }
          renderItem={({ item }) => {
            const pending = myPendingFacilityIds.has(item.id);
            return (
              <Pressable
                onPress={() => router.push({ pathname: "/profile/facility-profile", params: { id: item.id } })}
                className="flex-row items-center gap-3 rounded-xl border p-3"
                style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
              >
                {/* Building Avatar Frame */}
                <View className="w-[38px] h-[38px] rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
                  <MaterialCommunityIcons name="hospital-building" size={18} color={colors.primary} />
                </View>
                
                <View className="flex-1">
                  <Text className="text-sm font-bold" style={{ color: colors.text }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {item.type} · {item.location}, {item.region}
                  </Text>
                </View>

                {/* Conditional Call to Action Element */}
                {pending ? (
                  <View className="px-2 py-1.5 rounded-lg" style={{ backgroundColor: colors.backgroundElement }}>
                    <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
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
