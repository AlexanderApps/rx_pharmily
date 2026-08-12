import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { useVitalsStore } from "@/features/vitals/hooks/use-vitals-data";
import { GlucoseContext, VitalType } from "@/features/vitals/types/vitals.types";
import { VITAL_TYPE_META, VITAL_TYPES_ORDERED } from "@/features/vitals/utils/vital-type-meta";

const GLUCOSE_CONTEXTS: { value: GlucoseContext; label: string }[] = [
  { value: "fasting", label: "Fasting" },
  { value: "random", label: "Random" },
  { value: "post_meal", label: "Post-meal" },
];

export default function AddVitalReadingScreen() {
  const { colors } = useTheme();
  const addReading = useVitalsStore((state) => state.addReading);

  const [type, setType] = useState<VitalType>("blood_pressure");
  const [notes, setNotes] = useState("");

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [glucoseValue, setGlucoseValue] = useState("");
  const [glucoseUnit, setGlucoseUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");
  const [glucoseContext, setGlucoseContext] = useState<GlucoseContext>("fasting");
  const [heartRateValue, setHeartRateValue] = useState("");
  const [temperatureValue, setTemperatureValue] = useState("");
  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">("C");
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [oxygenSaturationValue, setOxygenSaturationValue] = useState("");

  const num = (v: string) => (v.trim() ? Number(v) : undefined);

  const isValid = (() => {
    switch (type) {
      case "blood_pressure":
        return !!systolic.trim() && !!diastolic.trim();
      case "blood_glucose":
        return !!glucoseValue.trim();
      case "heart_rate":
        return !!heartRateValue.trim();
      case "temperature":
        return !!temperatureValue.trim();
      case "weight":
        return !!weightValue.trim();
      case "oxygen_saturation":
        return !!oxygenSaturationValue.trim();
      default:
        return false;
    }
  })();

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert("Missing value", "Enter a value for this reading before saving.");
      return;
    }

    await addReading({
      type,
      recordedAt: new Date(),
      notes: notes.trim() || undefined,
      systolic: type === "blood_pressure" ? num(systolic) : undefined,
      diastolic: type === "blood_pressure" ? num(diastolic) : undefined,
      pulse: type === "blood_pressure" ? num(pulse) : undefined,
      glucoseValue: type === "blood_glucose" ? num(glucoseValue) : undefined,
      glucoseUnit: type === "blood_glucose" ? glucoseUnit : undefined,
      glucoseContext: type === "blood_glucose" ? glucoseContext : undefined,
      heartRateValue: type === "heart_rate" ? num(heartRateValue) : undefined,
      temperatureValue: type === "temperature" ? num(temperatureValue) : undefined,
      temperatureUnit: type === "temperature" ? temperatureUnit : undefined,
      weightValue: type === "weight" ? num(weightValue) : undefined,
      weightUnit: type === "weight" ? weightUnit : undefined,
      oxygenSaturationValue: type === "oxygen_saturation" ? num(oxygenSaturationValue) : undefined,
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Record a Reading</Text>
          <Pressable onPress={handleSubmit} style={styles.back}>
            <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.text }]}>What are you recording?</Text>
          <View style={styles.chipRow}>
            {VITAL_TYPES_ORDERED.map((option) => {
              const active = type === option;
              const meta = VITAL_TYPE_META[option];
              return (
                <Pressable
                  key={option}
                  onPress={() => setType(option)}
                  style={[styles.chip, { backgroundColor: active ? colors.primary : colors.backgroundElement }]}
                >
                  <MaterialCommunityIcons
                    name={meta.icon as any}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {meta.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {type === "blood_pressure" && (
            <View style={styles.fieldGroup}>
              <View style={styles.row2}>
                <Field label="Systolic (mmHg)" value={systolic} onChange={setSystolic} colors={colors} flex />
                <Field label="Diastolic (mmHg)" value={diastolic} onChange={setDiastolic} colors={colors} flex />
              </View>
              <Field label="Pulse (bpm, optional)" value={pulse} onChange={setPulse} colors={colors} />
            </View>
          )}

          {type === "blood_glucose" && (
            <View style={styles.fieldGroup}>
              <Field label="Glucose value" value={glucoseValue} onChange={setGlucoseValue} colors={colors} />
              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Unit</Text>
              <View style={styles.chipRow}>
                {(["mg/dL", "mmol/L"] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setGlucoseUnit(u)}
                    style={[styles.chip, { backgroundColor: glucoseUnit === u ? colors.primary : colors.backgroundElement }]}
                  >
                    <Text style={[styles.chipText, { color: glucoseUnit === u ? "#fff" : colors.textSecondary }]}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>When was this taken?</Text>
              <View style={styles.chipRow}>
                {GLUCOSE_CONTEXTS.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setGlucoseContext(c.value)}
                    style={[styles.chip, { backgroundColor: glucoseContext === c.value ? colors.primary : colors.backgroundElement }]}
                  >
                    <Text style={[styles.chipText, { color: glucoseContext === c.value ? "#fff" : colors.textSecondary }]}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {type === "heart_rate" && (
            <View style={styles.fieldGroup}>
              <Field label="Heart rate (bpm)" value={heartRateValue} onChange={setHeartRateValue} colors={colors} />
            </View>
          )}

          {type === "temperature" && (
            <View style={styles.fieldGroup}>
              <Field label="Temperature" value={temperatureValue} onChange={setTemperatureValue} colors={colors} />
              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Unit</Text>
              <View style={styles.chipRow}>
                {(["C", "F"] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setTemperatureUnit(u)}
                    style={[styles.chip, { backgroundColor: temperatureUnit === u ? colors.primary : colors.backgroundElement }]}
                  >
                    <Text style={[styles.chipText, { color: temperatureUnit === u ? "#fff" : colors.textSecondary }]}>
                      °{u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {type === "weight" && (
            <View style={styles.fieldGroup}>
              <Field label="Weight" value={weightValue} onChange={setWeightValue} colors={colors} />
              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Unit</Text>
              <View style={styles.chipRow}>
                {(["kg", "lb"] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setWeightUnit(u)}
                    style={[styles.chip, { backgroundColor: weightUnit === u ? colors.primary : colors.backgroundElement }]}
                  >
                    <Text style={[styles.chipText, { color: weightUnit === u ? "#fff" : colors.textSecondary }]}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {type === "oxygen_saturation" && (
            <View style={styles.fieldGroup}>
              <Field
                label="Oxygen saturation (%)"
                value={oxygenSaturationValue}
                onChange={setOxygenSaturationValue}
                colors={colors}
              />
            </View>
          )}

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth noting — how you were feeling, timing, etc."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
            ]}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            onPress={handleSubmit}
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.submitButtonText}>Save Reading</Text>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
  flex,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  flex?: boolean;
}) {
  return (
    <View style={[{ marginTop: 12 }, flex && { flex: 1 }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text },
        ]}
      />
    </View>
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
  content: { padding: 16 },
  label: { fontSize: 12, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "600" },
  fieldGroup: { marginTop: 4 },
  row2: { flexDirection: "row", gap: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginTop: 6,
  },
  textArea: { minHeight: 80 },
  submitButton: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 22 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
