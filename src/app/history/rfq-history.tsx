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
    <ThemedView className="flex-1 justify-center">
      <SafeAreaView className="flex-1">
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
