import React from "react";
import { View, StyleSheet, Text, ScrollView, Pressable } from "react-native";
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
  const {colors} = useTheme();

  const pressedOverlay =
    colors.text === "#ffffff"
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(0, 0, 0, 0.03)";

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
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top Custom Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            History
          </Text>
        </View>

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {historySections.map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                {section.title}
              </Text>

              <View
                style={[
                  styles.linksWrapper,
                  { backgroundColor: colors.backgroundSecondary },
                ]}
              >
                {section.links.map((link, index) => {
                  const isLast = index === section.links.length - 1;

                  return (
                    <Pressable
                      key={link.id}
                      onPress={link.onPress}
                      style={({ pressed }) => [
                        styles.linkItem,
                        {
                          backgroundColor: pressed
                            ? pressedOverlay
                            : "transparent",
                        },
                        !isLast && {
                          borderBottomColor: colors.border,
                          borderBottomWidth: 0.5,
                        },
                      ]}
                    >
                      <View style={styles.linkLeftContent}>
                        <View
                          style={[
                            styles.iconWrapper,
                            { backgroundColor: colors.backgroundElement },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={link.icon}
                            size={22}
                            color={colors.text}
                          />
                        </View>
                        <View style={styles.textMetaWrapper}>
                          <Text
                            style={[styles.linkText, { color: colors.text }]}
                          >
                            {link.label}
                          </Text>
                          <Text
                            style={[
                              styles.descriptionText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {link.description}
                          </Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors.border}
                      />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingLeft: 4,
  },
  linksWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.04,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  linkLeftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textMetaWrapper: {
    flex: 1,
    gap: 2,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 12,
    fontWeight: "400",
  },
});
