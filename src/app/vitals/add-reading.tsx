import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import ScreenHeader from "@/shared/components/screen-header";
import { toast } from "@/shared/hooks/use-toast";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;
    setIsSubmitting(true);

    const success = await addReading({
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

    setIsSubmitting(false);
    if (!success) {
      toast.error("Couldn't save this reading. Try again.");
      return;
    }
    toast.success("Reading saved.");
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScreenHeader
          title="Record a Reading"
          backIcon="close"
          actions={
            <Pressable onPress={handleSubmit} className="p-1.5">
              <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
            </Pressable>
          }
        />

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text className="text-xs font-semibold" style={{ color: colors.text }}>What are you recording?</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {VITAL_TYPES_ORDERED.map((option) => {
              const active = type === option;
              const meta = VITAL_TYPE_META[option];
              return (
                <Pressable
                  key={option}
                  onPress={() => setType(option)}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                  style={{ backgroundColor: active ? colors.primary : colors.backgroundElement }}
                >
                  <MaterialCommunityIcons
                    name={meta.icon as any}
                    size={14}
                    color={active ? "#fff" : colors.textSecondary}
                  />
                  <Text className="text-xs font-semibold" style={{ color: active ? "#fff" : colors.textSecondary }}>
                    {meta.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {type === "blood_pressure" && (
            <View className="mt-1">
              <View className="flex-row gap-2.5">
                <Field label="Systolic (mmHg)" value={systolic} onChange={setSystolic} colors={colors} flex />
                <Field label="Diastolic (mmHg)" value={diastolic} onChange={setDiastolic} colors={colors} flex />
              </View>
              <Field label="Pulse (bpm, optional)" value={pulse} onChange={setPulse} colors={colors} />
            </View>
          )}

          {type === "blood_glucose" && (
            <View className="mt-1">
              <Field label="Glucose value" value={glucoseValue} onChange={setGlucoseValue} colors={colors} />
              <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>Unit</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {(["mg/dL", "mmol/L"] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setGlucoseUnit(u)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                    style={{ backgroundColor: glucoseUnit === u ? colors.primary : colors.backgroundElement }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: glucoseUnit === u ? "#fff" : colors.textSecondary }}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>When was this taken?</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {GLUCOSE_CONTEXTS.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setGlucoseContext(c.value)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                    style={{ backgroundColor: glucoseContext === c.value ? colors.primary : colors.backgroundElement }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: glucoseContext === c.value ? "#fff" : colors.textSecondary }}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {type === "heart_rate" && (
            <View className="mt-1">
              <Field label="Heart rate (bpm)" value={heartRateValue} onChange={setHeartRateValue} colors={colors} />
            </View>
          )}

          {type === "temperature" && (
            <View className="mt-1">
              <Field label="Temperature" value={temperatureValue} onChange={setTemperatureValue} colors={colors} />
              <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>Unit</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {(["C", "F"] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setTemperatureUnit(u)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                    style={{ backgroundColor: temperatureUnit === u ? colors.primary : colors.backgroundElement }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: temperatureUnit === u ? "#fff" : colors.textSecondary }}>
                      °{u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {type === "weight" && (
            <View className="mt-1">
              <Field label="Weight" value={weightValue} onChange={setWeightValue} colors={colors} />
              <Text className="text-xs font-semibold mt-3" style={{ color: colors.text }}>Unit</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {(["kg", "lb"] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setWeightUnit(u)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                    style={{ backgroundColor: weightUnit === u ? colors.primary : colors.backgroundElement }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: weightUnit === u ? "#fff" : colors.textSecondary }}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {type === "oxygen_saturation" && (
            <View className="mt-1">
              <Field
                label="Oxygen saturation (%)"
                value={oxygenSaturationValue}
                onChange={setOxygenSaturationValue}
                colors={colors}
              />
            </View>
          )}

          <Text className="text-xs font-semibold mt-4" style={{ color: colors.text }}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth noting — how you were feeling, timing, etc."
            placeholderTextColor={colors.textSecondary}
            className="border rounded-lg px-3 py-[11px] text-sm mt-1.5 min-h-[80px]"
            style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="flex-row items-center justify-center gap-2 rounded-[10px] py-3.5 mt-[22px]"
            style={{ backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting && <ActivityIndicator size="small" color="#fff" />}
            <Text className="text-white text-[15px] font-semibold">
              {isSubmitting ? "Saving..." : "Save Reading"}
            </Text>
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
    <View className={flex ? "mt-3 flex-1" : "mt-3"}>
      <Text className="text-xs font-semibold" style={{ color: colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        className="border rounded-lg px-3 py-[11px] text-sm mt-1.5"
        style={{ backgroundColor: colors.backgroundElement, borderColor: colors.border, color: colors.text }}
      />
    </View>
  );
}
