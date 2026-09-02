import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import { useAuthStore } from "@/features/auth/hooks/use-auth-data";
import { useCatalogStore } from "@/features/catalog/hooks/use-catalog-data";
import { useReferenceDataStore } from "@/features/reference-data/hooks/use-reference-data";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useRxRfqsStore } from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { useDonationStore } from "@/features/donations/hooks/use-donation-data";
import { useMediscopeStore } from "@/features/mediscope/hooks/use-mediscope-data";
import { useRxJobsStore } from "@/features/rxjobs/hooks/use-rxjobs-data";
import { useAdsStore } from "@/features/ads/hooks/use-ads-data";
import { usePostsStore } from "@/features/posts/hooks/use-posts-data";
import LogoMark from "@/shared/components/logo-mark";
import WebAppShell from "@/shared/components/web-app-shell";
import Toast from "@/shared/components/toast";
import ConfirmDialog from "@/shared/components/confirm-dialog";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { colors, setThemeMode, themeMode } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const isLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);
  const initialize = useAuthStore((state) => state.initialize);
  const fetchProducts = useCatalogStore((state) => state.fetchProducts);
  const fetchReferenceData = useReferenceDataStore((state) => state.fetchAll);
  const fetchMyProfile = useProfileStore((state) => state.fetchMyProfile);
  const fetchFacilities = useProfileStore((state) => state.fetchFacilities);
  const fetchOrganizations = useProfileStore((state) => state.fetchOrganizations);
  const fetchMyFacilityMemberships = useProfileStore((state) => state.fetchMyFacilityMemberships);
  const fetchRxRfqs = useRxRfqsStore((state) => state.fetchRxRfqs);
  const fetchDonations = useDonationStore((state) => state.fetchDonations);
  const fetchMediscopeRequests = useMediscopeStore((state) => state.fetchRequests);
  const fetchJobs = useRxJobsStore((state) => state.fetchJobs);
  const fetchAds = useAdsStore((state) => state.fetchAds);
  const fetchMyReactions = useAdsStore((state) => state.fetchMyReactions);
  const fetchPosts = usePostsStore((state) => state.fetchPosts);
  const fetchMyLikes = usePostsStore((state) => state.fetchMyLikes);
  const fetchMyVotes = usePostsStore((state) => state.fetchMyVotes);
  // const isDark = colorScheme === "dark";

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    // Products are reference data read by screens all over the app
    // (RxRFQ items, MediScope, the formulary flow) — load it once here
    // rather than have every one of those screens fetch it independently.
    // Same reasoning for facilities/organizations — resolved everywhere
    // avatars and "posted by" rows appear. fetchMyProfile fills in the
    // rest of the signed-in user's own row beyond what the auth store's
    // lightweight sync already applied (license number, bio, etc).
    // fetchMyFacilityMemberships is what actually makes "My Facilities"
    // show anything right after login — without it, facilityMemberships
    // stays empty until the user happens to open a specific facility's
    // own profile screen, which is itself only reachable from that list.
    if (session) {
      fetchProducts();
      fetchReferenceData();
      fetchMyProfile();
      fetchFacilities();
      fetchOrganizations();
      fetchMyFacilityMemberships();
      fetchRxRfqs();
      fetchDonations();
      fetchMediscopeRequests();
      fetchJobs();
      fetchAds();
      fetchMyReactions();
      fetchPosts();
      fetchMyLikes();
      fetchMyVotes();
    }
  }, [session]);

  const onAuthScreen = segments[0] === "login" || segments[0] === "signup";

  useEffect(() => {
    if (isLoading) return; // don't redirect until the initial session check resolves
    if (!session && !onAuthScreen) {
      router.replace("/login");
    } else if (session && onAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [isLoading, session, segments]);

  if (isLoading) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <WebAppShell showChrome={!onAuthScreen}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 20 }}>
            <LogoMark size={72} />
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </WebAppShell>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <WebAppShell showChrome={!onAuthScreen}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
          <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              // animationEnabled: true,
              // animationTypeForReplace: false,
              // contentStyle: {
              //   backgroundColor: isDark ? "#000000" : "#ffffff",
              // },
            }}
          >
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="signup"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                animation: "none",
                // animationEnabled: true,
                // contentStyle: {
                //   backgroundColor: isDark ? "#000000" : "#ffffff",
                // },
              }}
            />
            <Stack.Screen
              name="donations"
              options={{
                headerShown: false,
                animation: "none",
                // animationEnabled: true,
                // contentStyle: {
                //   backgroundColor: isDark ? "#000000" : "#ffffff",
                // },
              }}
            />
            <Stack.Screen
              name="chat"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="jobs"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="posts"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="ads"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="mediscope"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="help"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="admin"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="formulary"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="vitals"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                // headerShown: false,
                animation: "none",
                // animationEnabled: true,
                // contentStyle: {
                //   backgroundColor: isDark ? "#000000" : "#ffffff",
                // },
              }}
            />
          </Stack>
          <ConfirmDialog />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
      </WebAppShell>
      <Toast />
    </SafeAreaProvider>
  );
}
