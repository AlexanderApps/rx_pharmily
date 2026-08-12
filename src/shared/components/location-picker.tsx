import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/shared/hooks/use-theme";
import { toast } from "@/shared/hooks/use-toast";

interface LocationPickerProps {
  value: string;
  onChangeText: (text: string) => void;
  latitude?: number;
  longitude?: number;
  onLocationCaptured: (latitude: number, longitude: number) => void;
  onLocationCleared?: () => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

// expo-location's getCurrentPositionAsync works on web too, via the
// browser's own geolocation API — but reverseGeocodeAsync (turning
// coordinates into a readable address) is native-only. Rather than
// branch on Platform.OS to predict that, this just tries reverse
// geocoding and falls back to showing raw coordinates if it fails for
// any reason, on any platform — the failure mode is identical either
// way (permission denied, unsupported, no network), so there's no need
// to special-case it.
const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChangeText,
  latitude,
  longitude,
  onLocationCaptured,
  onLocationCleared,
  placeholder = "Enter address or city",
  error,
  label,
  required,
}) => {
  const { colors } = useTheme();
  const [capturing, setCapturing] = useState(false);
  const hasGpsFix = latitude !== undefined && longitude !== undefined;

  const handleUseCurrentLocation = async () => {
    setCapturing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("Location permission denied. You can still enter an address manually.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = position.coords;
      onLocationCaptured(lat, lng);

      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const place = results[0];
        if (place) {
          const parts = [place.city ?? place.subregion, place.region ?? place.country].filter(Boolean);
          if (parts.length > 0) {
            onChangeText(parts.join(", "));
          }
        }
        toast.success("Current location captured.");
      } catch {
        // Reverse geocoding isn't available (web, or a native failure) —
        // the coordinates are still captured and shown below; the person
        // can type the address themselves.
        toast.success("Location captured. Add an address label if you'd like.");
      }
    } catch (err) {
      toast.error("Couldn't get your current location. Check location permissions and try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handleClear = () => {
    onLocationCleared?.();
  };

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label} {required && <Text style={{ color: colors.error }}>*</Text>}
        </Text>
      )}

      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.backgroundElement, borderColor: error ? colors.error : colors.border },
        ]}
      >
        <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
        />
      </View>

      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={capturing}
        style={[styles.gpsButton, { borderColor: colors.border, opacity: capturing ? 0.6 : 1 }]}
      >
        {capturing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="crosshairs-gps" size={15} color={colors.primary} />
        )}
        <Text style={[styles.gpsButtonText, { color: colors.primary }]}>
          {capturing ? "Getting location..." : "Use my current location"}
        </Text>
      </Pressable>

      {hasGpsFix && (
        <View style={[styles.gpsChip, { backgroundColor: colors.success + "12" }]}>
          <MaterialCommunityIcons name="map-marker-check-outline" size={13} color={colors.success} />
          <Text style={[styles.gpsChipText, { color: colors.success }]}>
            GPS location attached ({latitude!.toFixed(4)}, {longitude!.toFixed(4)})
          </Text>
          {onLocationCleared && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={14} color={colors.success} />
            </Pressable>
          )}
        </View>
      )}

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

export default LocationPicker;

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  gpsButtonText: { fontSize: 12, fontWeight: "600" },
  gpsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  gpsChipText: { fontSize: 11, fontWeight: "600" },
  errorText: { fontSize: 11, marginTop: 4 },
});
