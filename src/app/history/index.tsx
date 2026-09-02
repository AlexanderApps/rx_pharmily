import React from "react";
import { View, Text, ScrollView, Pressable, Platform} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/use-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/shared/components/themed-view";

type HistoryLink = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  description: string;
  onPress: () => void;
};

export default function HistoryNavScreen() {
  const { colors } = useTheme();

  // Platform-safe dynamic press highlights matching other screens
  const activeBg = colors.text === "#ffffff" ? "active:bg-white/5" : "active:bg-black/3";

  const historySections: { title: string; links: HistoryLink[] }[] = [
    {
      title: "Activity Records",
      links: [
        {
          id: "jobs",
          label: "Job History",
          icon: "briefcase-outline",
          description: "View applied, active, and completed jobs",
          onPress: () => router.push("/history/job-history"),
        },
        {
          id: "rfqs",
          label: "RFQs & Quotes",
          icon: "file-document-edit-outline",
          description: "Track requests for quotes and pricing",
          onPress: () => router.push("/history/rfq-history"),
        },
      ],
    },
    {
      title: "Contributions",
      links: [
        {
          id: "donations",
          label: "Donation History",
          icon: "heart-outline",
          description: "Review receipts and past charitable contributions",
          onPress: () => router.push("/history/donation-history"),
        },
      ],
    },
  ];

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header Row */}
        <View className="flex-row items-center px-4 py-3">
          {Platform.OS !== "web" && (
          <Pressable 
            onPress={() => router.back()} 
            className="p-1 mr-3 active:opacity-70"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          )}
          <Text 
            className="text-[20px] font-semibold" 
            style={{ color: colors.text }}
          >
            History
          </Text>
        </View>

        {/* Scrollable Container */}
        <ScrollView 
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerClassName="px-4 pt-4 pb-10 gap-6"
          showsVerticalScrollIndicator={false}
        >
          {historySections.map((section) => (
            <View key={section.title} className="gap-2">
              <Text 
                className="text-[12px] font-semibold uppercase tracking-[0.6px] pl-1" 
                style={{ color: colors.textSecondary }}
              >
                {section.title}
              </Text>
              
              <View 
                className="rounded-[16px] overflow-hidden" 
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                {section.links.map((link, index) => {
                  const isLast = index === section.links.length - 1;
                  return (
                    <Pressable
                      key={link.id}
                      onPress={link.onPress}
                      className={`flex-row items-center justify-between px-4 py-4 ${activeBg}`}
                      style={!isLast ? { borderBottomColor: colors.border, borderBottomWidth: 0.5 } : undefined}
                    >
                      <View className="flex-row items-center gap-3.5 flex-1">
                        {/* Icon Wrapper Badge */}
                        <View 
                          className="w-10 h-10 rounded-[10px] items-center justify-center"
                          style={{ backgroundColor: colors.backgroundElement }}
                        >
                          <MaterialCommunityIcons name={link.icon} size={22} color={colors.text} />
                        </View>
                        
                        {/* Text Meta Content */}
                        <View className="flex-1 gap-0.5">
                          <Text 
                            className="text-[16px] font-semibold" 
                            style={{ color: colors.text }}
                          >
                            {link.label}
                          </Text>
                          <Text 
                            className="text-[12px] font-normal" 
                            style={{ color: colors.textSecondary }}
                          >
                            {link.description}
                          </Text>
                        </View>
                      </View>
                      
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.border} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
