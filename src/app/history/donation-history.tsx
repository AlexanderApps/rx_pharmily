import { useState } from "react";
import { Text, View } from "react-native";
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4">
        <Text className="text-[13px] font-semibold mb-2" style={{ color: colors.text }}>
          Filter from date
        </Text>
        
        <DatePicker value={date} onChange={setDate} format="long" />
        
        <Text className="text-xs mt-4" style={{ color: colors.textSecondary }}>
          Donation history filtering isn't wired up yet — this screen is still a placeholder.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default DonationHistoryScreen;
