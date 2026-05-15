import type { LocationMapDto } from "@/src/features/api/locationsClient";
import { fetchLocations } from "@/src/features/api/locationsClient";
import { useLocation } from "@/src/features/core/location/stores/LocationProvider";
import Map, {
  focusCameraLikeNavigateButton,
  focusCameraRouteFirstPerson,
  focusCameraToRoutePath,
  useMapRouteStore,
  type MapMarkerPoint,
} from "@/src/features/map/";
import LocationMapPreviewSheet from "@/src/features/map/LocationMapPreviewSheet";
import LayoutButton from "@/src/features/map/components/LayoutButton";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { CameraRef } from "@maplibre/maplibre-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import log from "loglevel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function focusLocationParam(
  raw: string | string[] | undefined,
): string | undefined {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
    return raw[0];
  }
  return undefined;
}

export default function MapScreen() {
  const router = useRouter();
  const { focusLocation: focusLocationRaw } = useLocalSearchParams<{
    focusLocation?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef | null>(null);
  const location = useLocation().location;
  const [markers, setMarkers] = useState<MapMarkerPoint[]>([]);
  const [locations, setLocations] = useState<LocationMapDto[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [cameraFollowUser, setCameraFollowUser] = useState(false);

  useEffect(() => {
    setCameraFollowUser(true);
  }, []);
  const routeFeature = useMapRouteStore((s) => s.routeFeature);
  const clearRoute = useMapRouteStore((s) => s.clearRoute);
  const [routeCameraImmersive, setRouteCameraImmersive] = useState(false);
  const locationRef = useRef(location);
  locationRef.current = location;
  const hadRouteForCameraRef = useRef(false);
  const prevRouteCameraImmersiveRef = useRef(routeCameraImmersive);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchLocations();
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
            markerKey: d.markerKey ?? "building",
          }));

        setMarkers(next);
        setLocations(list);
      } catch (e) {
        log.warn("[UniMap] map locations load failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const focusId = focusLocationParam(focusLocationRaw);
    if (!focusId) return;

    const loc = locations.find((d) => d.id === focusId);
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
      return;
    }

    const lng = loc.lng;
    const lat = loc.lat;

    clearRoute();
    setRouteCameraImmersive(false);
    setSelectedLocationId(focusId);
    setCameraFollowUser(false);
    router.setParams({ focusLocation: undefined });

    const runFocus = (attempt: number) => {
      InteractionManager.runAfterInteractions(() => {
        if (!cameraRef.current && attempt < 12) {
          setTimeout(() => runFocus(attempt + 1), 48);
          return;
        }
        focusCameraLikeNavigateButton(
          cameraRef,
          [lng, lat],
          "tapSingleMarker",
        );
      });
    };

    setTimeout(() => runFocus(0), 0);
  }, [focusLocationRaw, locations, clearRoute, router]);

  useEffect(() => {
    const coords = routeFeature?.geometry?.coordinates;
    const hasRoute = Boolean(coords && coords.length >= 2);

    if (!hasRoute) {
      setRouteCameraImmersive(false);
      hadRouteForCameraRef.current = false;
      prevRouteCameraImmersiveRef.current = false;
      return;
    }

    const loc = locationRef.current;
    if (!loc) return;

    const path = coords as [number, number][];
    const immersiveToggled =
      prevRouteCameraImmersiveRef.current !== routeCameraImmersive;
    prevRouteCameraImmersiveRef.current = routeCameraImmersive;

    const isFirstFit = !hadRouteForCameraRef.current;
    hadRouteForCameraRef.current = true;

    if (!isFirstFit && !immersiveToggled) {
      return;
    }

    if (routeCameraImmersive) {
      setCameraFollowUser(false);
      focusCameraRouteFirstPerson(cameraRef, [
        loc.coords.longitude,
        loc.coords.latitude,
      ], path);
    } else {
      setCameraFollowUser(false);
      focusCameraToRoutePath(cameraRef, path);
    }
  }, [routeFeature, routeCameraImmersive]);

  const handleRouteNavigationBack = useCallback(() => {
    const id = selectedLocationId;
    const loc =
      id == null ? undefined : locations.find((d) => d.id === id);

    clearRoute();
    setRouteCameraImmersive(false);
    setSelectedLocationId(null);

    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
      setCameraFollowUser(true);
      const cur = locationRef.current;
      if (cur) {
        focusCameraLikeNavigateButton(
          cameraRef,
          [cur.coords.longitude, cur.coords.latitude],
          "followUserLocation",
        );
      }
      return;
    }

    setCameraFollowUser(false);
    const lng = loc.lng;
    const lat = loc.lat;

    const runFocus = (attempt: number) => {
      InteractionManager.runAfterInteractions(() => {
        if (!cameraRef.current && attempt < 12) {
          setTimeout(() => runFocus(attempt + 1), 48);
          return;
        }
        focusCameraLikeNavigateButton(
          cameraRef,
          [lng, lat],
          "tapSingleMarker",
        );
      });
    };

    setTimeout(() => runFocus(0), 0);
  }, [clearRoute, locations, selectedLocationId]);

  const handleSheetClosed = useCallback(() => {
    if (useMapRouteStore.getState().routeFeature) {
      clearRoute();
      setRouteCameraImmersive(false);
      setCameraFollowUser(true);
      const cur = locationRef.current;
      if (cur) {
        focusCameraLikeNavigateButton(
          cameraRef,
          [cur.coords.longitude, cur.coords.latitude],
          "followUserLocation",
        );
      }
    }
    setSelectedLocationId(null);
  }, [clearRoute]);

  const toggleRouteCameraImmersive = useCallback(() => {
    setRouteCameraImmersive((v) => !v);
  }, []);

  const mapMarkers = useMemo(() => {
    const coords = routeFeature?.geometry?.coordinates;
    const routeActive = Boolean(coords && coords.length >= 2);
    if (!routeActive) return markers;
    if (!selectedLocationId) return markers;
    return markers.filter((m) => m.id === selectedLocationId);
  }, [markers, routeFeature, selectedLocationId]);

  if (!location) return null;

  return (
    <View style={{ flex: 1 }}>
      <Map
        location={location}
        markers={mapMarkers}
        cameraRef={cameraRef}
        followUserLocation={cameraFollowUser}
        onStopFollowingUser={() => setCameraFollowUser(false)}
        routeFeature={routeFeature}
        onMarkerPress={(locationId) => {
          clearRoute();
          setSelectedLocationId(locationId);
        }}
      />

      <View style={styles.sheetLayer} pointerEvents="box-none">
        <LocationMapPreviewSheet
          locationId={selectedLocationId}
          locations={locations}
          userLocation={location}
          routeCameraImmersive={routeCameraImmersive}
          onToggleRouteCameraImmersive={toggleRouteCameraImmersive}
          onRouteNavigationBack={handleRouteNavigationBack}
          onDismiss={handleSheetClosed}
        />
      </View>

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
          setCameraFollowUser(true);
          focusCameraLikeNavigateButton(cameraRef, [
            location.coords.longitude,
            location.coords.latitude,
          ]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12000,
    elevation: 12000,
  },
});
