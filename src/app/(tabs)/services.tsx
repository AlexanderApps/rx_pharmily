import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { useTheme } from "@/shared/hooks/use-theme";

import { router } from "expo-router";
import ActionButton from "@/shared/components/action-button";

export default function ServiceScreen() {
  const { colors } = useTheme();

  return (
    <ThemedView className="flex-1 items-center justify-center">
      <SafeAreaView className="flex-1">
        <ThemedView>
          {/* Custom Header */}
          <ThemedView
            className="px-5 py-4 border-b"
            style={{ borderBottomColor: colors.backgroundSecondary }}
          >
            <ThemedText className="text-2xl font-bold">
              Services
            </ThemedText>

            <ThemedText className="mt-1">
              Explore available services and resources
            </ThemedText>
          </ThemedView>

          {/* Screen Content */}
          <ThemedView
            type="background"
            className="flex-1 p-4 flex-row flex-wrap justify-between"
          >
            {/* Quick Actions */}
            <View className="px-[5px] mt-[15px]">
              <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                Quick Actions
              </Text>
              <View className="flex-row flex-wrap gap-3">
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
                      name="pill"
                      size={22}
                      color="#0d9488"
                    />
                  }
                  label="RxLink"
                  tintColor="#0d9488"
                  colors={colors}
                  onPress={() => {
                    router.push("/rxlink");
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
