import { StyleSheet } from "react-native";
import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import DatePicker from "@/shared/components/date-picker";

export default function RfqHistoryScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // You can handle form submission updates or validation logic here
    console.log("Selected timestamp:", newDate.getTime());
  };
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView>
          <ThemedText>Event Date</ThemedText>

          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            placeholder="Choose a date for your event"
          />

          <ThemedText>
            Saved State Value: {selectedDate.toDateString()}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
  },
});
