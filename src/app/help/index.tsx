import React from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
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
    key: "help",
    title: "Help & Report",
    description: "How to use the app, frequently asked questions, and reporting a bug or a user.",
    icon: "lifebuoy",
    color: "#2563eb",
    route: "/help/faq",
  },
  {
    key: "consult",
    title: "Consult",
    description: "Request formal advice from an experienced pharmacist — facility setup, procurement, career moves, regulatory questions.",
    icon: "account-tie-outline",
    color: "#9333ea",
    route: "/help/consult-list",
  },
  {
    key: "ask",
    title: "Ask Your Pharmacist",
    description: "General medication questions — interactions, how to take something, side effects.",
    icon: "pill",
    color: "#16a34a",
    route: "/help/ask-pharmacist",
  },
];

export default function RxHelpScreen() {
  const { colors } = useTheme();

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Navigation Header Element */}
        <View className="flex-row items-center gap-3 px-4 pt-3 pb-4 border-b-[0.5px]" style={{ borderBottomColor: colors.border }}>
          {Platform.OS !== "web" && (
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          )}
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>RxHelp</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Support, advice, and answers
            </Text>
          </View>
        </View>

        {/* Scroll Content Body Area */}
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

          {/* Explicit Bug Reporting Target Banner */}
          <Pressable
            onPress={() => router.push("/help/report")}
            className="flex-row items-center justify-center gap-2 rounded-xl py-3.5 mt-2"
            style={{ backgroundColor: colors.error + "10" }}
          >
            <MaterialCommunityIcons name="flag-outline" size={16} color={colors.error} />
            <Text className="text-[13px] font-semibold" style={{ color: colors.error }}>
              Report a bug or a user
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
