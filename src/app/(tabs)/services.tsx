import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { useTheme } from "@/shared/hooks/use-theme";

import { router } from "expo-router";
import ActionButton from "@/shared/components/action-button";

export default function ServiceScreen() {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView>
          {/* Custom Header */}
          <ThemedView
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.backgroundSecondary,
            }}
          >
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              Services
            </ThemedText>

            <ThemedText
              style={{
                // color: colors.textSecondarySecondary,
                marginTop: 4,
              }}
            >
              Explore available services and resources
            </ThemedText>
          </ThemedView>

          {/* Screen Content */}
          <ThemedView
            type="background"
            style={{
              flex: 1,
              padding: 16,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              // marginTop: 5,
            }}
          >

            {/* Quick Actions */}
            <View style={styles.sectionPadding}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quick Actions
              </Text>
              <View style={styles.statsRow}>
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="office-building"
                      size={22}
                      color="#2563eb"
                    />
                  }
                  label="Jobs"
                  tintColor="#2563eb"
                  colors={colors}
                  onPress={() => {
                    router.push("/jobs");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={22}
                      color="#16a34a"
                    />
                  }
                  label="RxRFQs"
                  tintColor="#16a34a"
                  colors={colors}
                  onPress={() => {
                    router.push("/rfqs");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="heart-outline"
                      size={22}
                      color="#9333ea"
                    />
                  }
                  label="Donations"
                  tintColor="#9333ea"
                  colors={colors}
                  onPress={() => {
                    router.push("/donations");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="heart-search"
                      size={22}
                      color="#16a34a"
                    />
                  }
                  label="MediScope"
                  tintColor="#16a34a"
                  colors={colors}
                  onPress={() => {
                    router.push("/mediscope");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="chat-outline"
                      size={22}
                      color="#0891b2"
                    />
                  }
                  label="RxChat"
                  tintColor="#0891b2"
                  colors={colors}
                  onPress={() => {
                    router.push("/chat");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="bullhorn-outline"
                      size={22}
                      color="#dc2626"
                    />
                  }
                  label="RxAds"
                  tintColor="#dc2626"
                  colors={colors}
                  onPress={() => {
                    router.push("/ads");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="lifebuoy"
                      size={22}
                      color="#0891b2"
                    />
                  }
                  label="RxHelp"
                  tintColor="#0891b2"
                  colors={colors}
                  onPress={() => {
                    router.push("/help");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="clipboard-plus-outline"
                      size={22}
                      color="#d97706"
                    />
                  }
                  label="Formulary"
                  tintColor="#d97706"
                  colors={colors}
                  onPress={() => {
                    router.push("/formulary");
                  }}
                />
                <ActionButton
                  icon={
                    <MaterialCommunityIcons
                      name="heart-pulse"
                      size={22}
                      color="#dc2626"
                    />
                  }
                  label="RxVitals"
                  tintColor="#dc2626"
                  colors={colors}
                  onPress={() => {
                    router.push("/vitals");
                  }}
                />
              </View>
            </View>

          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: {
    flex: 1,
  },

  /* Sections */
  sectionPadding: {
    paddingHorizontal: 5,
    marginTop: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },

  /* Overview Stats */
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    rowGap: 12,
  },

  /* Floating Action Button */
  // fab: {
  //   position: "absolute",
  //   right: 24,
  //   bottom: 32,
  //   width: 64,
  //   height: 64,
  //   borderRadius: 32,
  //   justifyContent: "center",
  //   alignItems: "center",

  //   shadowColor: "#000",
  //   shadowOffset: {
  //     width: 0,
  //     height: 6,
  //   },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 8,

  //   elevation: 8,
  // },
});
