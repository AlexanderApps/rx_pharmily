import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/shared/hooks/use-theme";

interface LocationMapViewProps {
  latitude?: number;
  longitude?: number;
  // react-native-maps has no web implementation at all, so there's no
  // tap-to-pick here — interactive mode on web just shows the static
  // preview of whatever coordinates are already set (e.g. from the GPS
  // button in LocationPicker, which does work on web) with a note
  // explaining why tapping doesn't move the pin.
  interactive?: boolean;
  onLocationChange?: (latitude: number, longitude: number) => void;
  height?: number;
  zoomLevel?: number;
}

const LocationMapView: React.FC<LocationMapViewProps> = ({
  latitude,
  longitude,
  interactive = false,
  height = 200,
  zoomLevel = 14,
}) => {
  const { colors } = useTheme();
  const hasCoords = latitude !== undefined && longitude !== undefined;
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!hasCoords) {
    return (
      <View
        style={[
          styles.emptyWrap,
          { height, backgroundColor: colors.backgroundElement, borderColor: colors.border },
        ]}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No location set.</Text>
      </View>
    );
  }

  if (!apiKey) {
    // Fails loudly rather than silently rendering a broken image — a
    // missing key here is a setup problem worth surfacing immediately,
    // not something to paper over with a placeholder.
    return (
      <View
        style={[
          styles.emptyWrap,
          { height, backgroundColor: colors.backgroundElement, borderColor: colors.border },
        ]}
      >
        <Text style={{ color: colors.error, fontSize: 12, textAlign: "center", paddingHorizontal: 12 }}>
          Map preview unavailable — EXPO_PUBLIC_GOOGLE_MAPS_API_KEY isn't set.
        </Text>
      </View>
    );
  }

  // Static Maps API takes a fixed pixel size, not a delta — 2x for
  // sharper rendering on high-DPI displays, matching typical web map
  // embeds.
  const width = 600;
  const pixelHeight = Math.round(height * 2);
  const mapUrl =
    `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}` +
    `&zoom=${zoomLevel}&size=${width}x${pixelHeight}&scale=2` +
    `&markers=color:red%7C${latitude},${longitude}` +
    `&key=${apiKey}`;

  return (
    <View style={[styles.wrap, { height, borderColor: colors.border }]}>
      {React.createElement("img", {
        src: mapUrl,
        alt: "Map showing the selected location",
        style: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
      })}

      {interactive && (
        <View style={[styles.hint, { backgroundColor: colors.background + "e6" }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            Use "Use my current location" above to set the pin — tap-to-pick isn't available on web
          </Text>
        </View>
      )}
    </View>
  );
};

export default LocationMapView;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
