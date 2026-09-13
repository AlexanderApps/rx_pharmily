import React from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import { ThemedView } from "@/shared/components/themed-view";

const SECTIONS: {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
}[] = [
  {
    key: "guide",
    title: "How RxPharmily Works",
    description: "A walkthrough of every feature — RxRFQs, MediScope, Donations, RxJobs, RxAds, RxChat, Formulary, RxVitals, RxLink, and the community feed.",
    icon: "book-open-page-variant-outline",
    color: "#2563eb",
    route: "/help/user-guide",
  },
  {
    key: "eula",
    title: "Terms of Use (EULA)",
    description: "The end user license agreement governing your use of RxPharmily.",
    icon: "file-document-outline",
    color: "#7c3aed",
    route: "/help/eula",
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    description: "How we collect, use, and share information — and what stays private.",
    icon: "shield-lock-outline",
    color: "#0d9488",
    route: "/help/privacy-policy",
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Frequently asked questions about accounts, verification, and using the app.",
    icon: "help-circle-outline",
    color: "#16a34a",
    route: "/help/faq",
  },
];

export default function InformationTermsScreen() {
  const { colors } = useTheme();

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="flex-row items-center gap-3 px-4 pt-3 pb-4 border-b-[0.5px]" style={{ borderBottomColor: colors.border }}>
          {Platform.OS !== "web" && (
            <Pressable onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          )}
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>Information & Terms</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              How the app works, and the terms that govern it
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => (
            <Pressable
              key={section.key}
              onPress={() => router.push(section.route as any)}
              className="flex-row items-center gap-3.5 rounded-[18px] border p-4 shadow-sm elevation-2"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
              }}
            >
              <View className="w-13 h-13 rounded-xl items-center justify-center" style={{ backgroundColor: section.color + "18" }}>
                <MaterialCommunityIcons name={section.icon} size={26} color={section.color} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: colors.text }}>{section.title}</Text>
                <Text className="text-xs mt-1 leading-[17px]" style={{ color: colors.textSecondary }}>
                  {section.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
