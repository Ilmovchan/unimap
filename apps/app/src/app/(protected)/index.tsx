import { fetchDepartments } from "@/src/features/api/departmentsClient";
import { useLocation } from "@/src/features/core/location/stores/LocationProvider";
import type { MapMarkerPoint } from "@/src/features/map/Map";
import LayoutButton from "@/src/features/map/components/LayoutButton";
import Map from "@/src/features/map/";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { CameraRef } from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import log from "loglevel";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef | null>(null);
  const location = useLocation().location;
  const [markers, setMarkers] = useState<MapMarkerPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchDepartments();
        if (cancelled) return;

        const next: MapMarkerPoint[] = list
          .filter(
            (d) =>
              d.id &&
              Number.isFinite(d.lat) &&
              Number.isFinite(d.lng),
          )
          .map((d) => ({
            id: d.id,
            lat: d.lat,
            lng: d.lng,
          }));

        setMarkers(next);
      } catch (e) {
        log.warn("[UniMap] map markers load failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!location) return null;

  return (
    <View style={{ flex: 1 }}>
      <Map
        location={location}
        markers={markers}
        cameraRef={cameraRef}
      />

      <LayoutButton
        style={{
          top: insets.top + 12,
          left: 16,
          zIndex: 9999,
        }}
        label="Підрозділи"
        icon={
          <Ionicons
            size={22}
            name="school-outline"
            color={globalColors.navigationFabIcon}
          />
        }
        accessibilityLabel="Підрозділи: відкрити список"
        onPress={() => router.push("/departments")}
      />

      <LayoutButton
        style={{
          bottom: insets.bottom + 24,
          right: 20,
          zIndex: 9999,
        }}
        icon={
          <Ionicons
            size={26}
            name="navigate"
            color={globalColors.navigationFabIcon}
          />
        }
        accessibilityLabel="Показати мене на мапі"
        onPress={() => {
          cameraRef.current?.setCamera({
            centerCoordinate: [
              location.coords.longitude,
              location.coords.latitude,
            ],
            zoomLevel: 20 + Math.random() / 100000,
            animationDuration: 1200,
            animationMode: "flyTo",
          });
        }}
      />
    </View>
  );
}
