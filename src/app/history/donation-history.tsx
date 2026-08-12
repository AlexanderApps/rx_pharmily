import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/shared/hooks/use-theme";
import DatePicker from "@/shared/components/date-picker";

// This screen is still placeholder scaffolding — it shows a date and a
// picker, but has no actual donation history content wired to it yet.
// Fixing that is a separate task; this pass only replaces the raw
// @react-native-community/datetimepicker usage (native-only, breaks the
// web bundle) with the app's own cross-platform DatePicker component.
export const DonationHistoryScreen = () => {
  const { colors } = useTheme();
  const [date, setDate] = useState<Date>(new Date());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>Filter from date</Text>
        <DatePicker value={date} onChange={setDate} format="long" />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 16 }}>
          Donation history filtering isn't wired up yet — this screen is still a placeholder.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default DonationHistoryScreen;

const styles = StyleSheet.create({
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
});
