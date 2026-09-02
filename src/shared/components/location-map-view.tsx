import React, { useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useTheme } from "@/shared/hooks/use-theme";

interface LocationMapViewProps {
  latitude?: number;
  longitude?: number;
  /**
   * When true, tapping anywhere on the map moves the marker and reports
   * the new coordinates via onLocationChange — used for picking a
   * location. When false (default), the map is a read-only preview.
   */
  interactive?: boolean;
  onLocationChange?: (latitude: number, longitude: number) => void;
  height?: number;
  /**
   * Roughly how zoomed-in the initial view is. Smaller = closer.
   * Ignored after the first render — dragging/pinching takes over from
   * there, same as any map.
   */
  zoomLevel?: number;
}

const FALLBACK_REGION = {
  // Accra, Ghana — a reasonable default center for this app's userbase
  // when no coordinates are available yet, rather than defaulting to
  // (0, 0) in the ocean off the coast of Africa.
  latitude: 5.6037,
  longitude: -0.187,
};

const LocationMapView: React.FC<LocationMapViewProps> = ({
  latitude,
  longitude,
  interactive = false,
  onLocationChange,
  height = 200,
  zoomLevel = 14,
}) => {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const hasCoords = latitude !== undefined && longitude !== undefined;

  // Local marker position so the pin can be dragged/tapped in-place with
  // an immediate visual response, rather than waiting for the parent's
  // state update (and re-render) round-trip on every drag frame.
  const [markerPosition, setMarkerPosition] = useState(
    hasCoords ? { latitude: latitude!, longitude: longitude! } : FALLBACK_REGION,
  );

  const delta = 360 / Math.pow(2, zoomLevel);
  const initialRegion: Region = {
    latitude: markerPosition.latitude,
    longitude: markerPosition.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    if (!interactive) return;
    const coords = event.nativeEvent.coordinate;
    setMarkerPosition(coords);
    onLocationChange?.(coords.latitude, coords.longitude);
  };

  const handleMarkerDragEnd = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const coords = event.nativeEvent.coordinate;
    setMarkerPosition(coords);
    onLocationChange?.(coords.latitude, coords.longitude);
  };

  if (!hasCoords && !interactive) {
    // Read-only mode with nothing to show yet — a blank/default-region
    // map would be misleading (implying a real location), so show a
    // clear empty state instead.
    return (
      <View
        className="rounded-xl border items-center justify-center"
        style={{ height, backgroundColor: colors.backgroundElement, borderColor: colors.border }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>No location set.</Text>
      </View>
    );
  }

  return (
    <View className="rounded-xl border overflow-hidden" style={{ height, borderColor: colors.border }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={markerPosition}
          draggable={interactive}
          onDragEnd={handleMarkerDragEnd}
        />
      </MapView>

      {interactive && (
        <View
          className="absolute bottom-2 left-2 right-2 py-1.5 px-2.5 rounded-lg items-center"
          style={{ backgroundColor: colors.background + "e6" }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            Tap the map or drag the pin to set the location
          </Text>
        </View>
      )}
    </View>
  );
};

export default LocationMapView;

