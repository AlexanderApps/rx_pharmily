import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useProfileStore } from "@/features/profile/hooks/use-profile-data";
import { useVitalsStore } from "@/features/vitals/hooks/use-vitals-data";
import { VitalType } from "@/features/vitals/types/vitals.types";
import { VITAL_TYPE_META, VITAL_TYPES_ORDERED } from "@/features/vitals/utils/vital-type-meta";
import { buildVitalsPdf } from "@/features/vitals/utils/vitals-pdf";
import VitalReadingCard from "@/features/vitals/components/vital-reading-card";
import PrintButton from "@/shared/components/print-button";
import ScreenHeader from "@/shared/components/screen-header";
import EmptyState from "@/shared/components/empty-state";
import DateField from "@/shared/components/date-field";

const fmtShortDate = (d: Date) =>
  d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

// End-of-day for the "to" date — otherwise a reading recorded later on
// the selected end date would be excluded, since the picker only gives a
// date with no meaningful time component (midnight) and recordedAt is a
// full timestamp.
function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export default function VitalsScreen() {
  const { colors } = useTheme();
  const patientName = useProfileStore((state) => state.user.fullName) || "Patient";
  const readings = useVitalsStore((state) => state.readings);
  const deleteReading = useVitalsStore((state) => state.deleteReading);
  const fetchReadings = useVitalsStore((state) => state.fetchReadings);

  useEffect(() => {
    fetchReadings();
  }, []);

  // Multi-select — someone printing for a doctor visit might want, say,
  // blood pressure AND weight together, not just one type at a time.
  // Empty set means "all types," not "no types."
  const [selectedTypes, setSelectedTypes] = useState<Set<VitalType>>(new Set());
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const toggleType = (type: VitalType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const hasActiveFilters = selectedTypes.size > 0 || !!dateFrom || !!dateTo;
  const clearFilters = () => {
    setSelectedTypes(new Set());
    setDateFrom(null);
    setDateTo(null);
  };

  const filtered = useMemo(() => {
    const sorted = [...readings].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    return sorted.filter((r) => {
      if (selectedTypes.size > 0 && !selectedTypes.has(r.type)) return false;
      const recordedAt = new Date(r.recordedAt);
      if (dateFrom && recordedAt < dateFrom) return false;
      if (dateTo && recordedAt > endOfDay(dateTo)) return false;
      return true;
    });
  }, [readings, selectedTypes, dateFrom, dateTo]);

  // Shown in the exported PDF's header so the document is self-
  // documenting about its own scope — a healthcare professional reading
  // a printed subset needs to know it's a subset, not assume it's the
  // complete record just because it's titled "Vital Signs Record."
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedTypes.size > 0) {
      parts.push(
        VITAL_TYPES_ORDERED.filter((t) => selectedTypes.has(t))
          .map((t) => VITAL_TYPE_META[t].label)
          .join(", "),
      );
    }
    if (dateFrom || dateTo) {
      parts.push(
        `${dateFrom ? fmtShortDate(dateFrom) : "Earliest"} – ${dateTo ? fmtShortDate(dateTo) : "Latest"}`,
      );
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }, [selectedTypes, dateFrom, dateTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="RxVitals"
        subtitle="Your at-home vitals record"
        actions={
          <>
            <PrintButton
              variant="icon"
              fileName="RxVitals-Record"
              getHtml={() => buildVitalsPdf(filtered, patientName, filterSummary)}
            />
            <Pressable
              onPress={() => router.push("/vitals/add-reading")}
              className="w-[34px] h-[34px] rounded-[10px] items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            </Pressable>
          </>
        }
      />

      <View className="flex-row items-start gap-2 mx-4 mt-3 rounded-[10px] p-3" style={{ backgroundColor: colors.warning + "12" }}>
        <MaterialCommunityIcons name="information-outline" size={14} color={colors.warning} />
        <Text className="text-xs flex-1 leading-[17px]" style={{ color: colors.warning }}>
          RxVitals only records what you enter — it does not interpret readings or provide medical
          advice. Share the PDF export with a healthcare professional for any interpretation.
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2 px-4 pt-3">
        {VITAL_TYPES_ORDERED.map((type) => {
          const active = selectedTypes.has(type);
          const meta = VITAL_TYPE_META[type];
          return (
            <Pressable
              key={type}
              onPress={() => toggleType(type)}
              className="px-3 py-[7px] rounded-full"
              style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
            >
              <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                {meta.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center gap-2 px-4 pt-2.5" style={{ zIndex: 10 }}>
        <DateField label="From" value={dateFrom} onChange={setDateFrom} maximumDate={new Date()} icon="calendar-start" />
        <Text style={{ color: colors.textSecondary }}>–</Text>
        <DateField label="To" value={dateTo} onChange={setDateTo} maximumDate={new Date()} icon="calendar-end" />
        {hasActiveFilters && (
          <Pressable onPress={clearFilters} className="flex-row items-center gap-1 ml-1" hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={14} color={colors.textSecondary} />
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Clear</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="heart-pulse"
            message={hasActiveFilters ? "No readings match these filters." : "No readings recorded yet."}
          />
        }
        renderItem={({ item }) => <VitalReadingCard reading={item} onDelete={deleteReading} />}
      />
    </SafeAreaView>
  );
}
