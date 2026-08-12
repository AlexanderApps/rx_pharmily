import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, Switch, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import {
  useNotificationStore,
  CATEGORY_META,
} from "@/features/notifications/hooks/use-notifications-data";

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const settings = useNotificationStore((state) => state.settings);
  const updateSetting = useNotificationStore((state) => state.updateSetting);
  const setAllInSection = useNotificationStore((state) => state.setAllInSection);

  const sections = useMemo(() => {
    const bySection = new Map<string, typeof CATEGORY_META>();
    for (const meta of CATEGORY_META) {
      const list = bySection.get(meta.section) ?? [];
      list.push(meta);
      bySection.set(meta.section, list);
    }
    return Array.from(bySection.entries());
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Notification Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose exactly what you want to hear about, per feature
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sections.map(([section, metas]) => {
          const allOn = metas.every((m) => settings[m.category]);
          return (
            <View key={section} style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section}</Text>
                <Pressable onPress={() => setAllInSection(section, !allOn)}>
                  <Text style={[styles.sectionAction, { color: colors.primary }]}>
                    {allOn ? "Turn all off" : "Turn all on"}
                  </Text>
                </Pressable>
              </View>

              <View
                style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              >
                {metas.map((meta, index) => (
                  <View
                    key={meta.category}
                    style={[
                      styles.row,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>{meta.label}</Text>
                      <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                        {meta.description}
                      </Text>
                    </View>
                    <Switch
                      value={settings[meta.category]}
                      onValueChange={(value) => updateSetting(meta.category, value)}
                      trackColor={{ true: colors.primary }}
                    />
                  </View>
                ))}
              </View>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 1 },
  content: { padding: 16 },
  section: { marginBottom: 18 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  sectionAction: { fontSize: 12, fontWeight: "600" },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 14 },
  rowLabel: { fontSize: 13, fontWeight: "600" },
  rowDescription: { fontSize: 11, marginTop: 2, lineHeight: 15 },
});
