import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
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
    <ThemedView style={styles.flex1}>
      <SafeAreaView style={styles.flex1} edges={["top", "left", "right"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>RxHelp</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Support, advice, and answers
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {SECTIONS.map((section) => (
            <Pressable
              key={section.key}
              onPress={() => router.push(section.route as any)}
              style={[
                styles.card,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, shadowColor: colors.text },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: section.color + "18" }]}>
                <MaterialCommunityIcons name={section.icon} size={26} color={section.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {section.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.push("/help/report")}
            style={[styles.reportRow, { backgroundColor: colors.error + "10" }]}
          >
            <MaterialCommunityIcons name="flag-outline" size={16} color={colors.error} />
            <Text style={[styles.reportRowText, { color: colors.error }]}>
              Report a bug or a user
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardDescription: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  reportRowText: { fontSize: 13, fontWeight: "600" },
});
