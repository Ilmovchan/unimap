import { fetchLocationMarkers } from "@/src/features/api/locationsClient";
import { useLocation } from "@/src/features/core/location/stores/LocationProvider";
import Map, {
  focusCameraLikeNavigateButton,
  focusCameraRouteFirstPerson,
  focusCameraToRoutePath,
  focusCameraToRoutePathAfterImmersive,
  useMapRouteStore,
  type MapMarkerPoint,
} from "@/src/features/map/";
import LocationMapPreviewSheet from "@/src/features/map/LocationMapPreviewSheet";
import LayoutButton from "@/src/features/map/components/LayoutButton";
import MapSearchChrome from "@/src/features/map/components/MapSearchChrome";
import { MAP_SEARCH_UI_ENABLED } from "@/src/features/map/mapSearchConfig";
import { syncNewsAppBadge } from "@/src/features/news/newsAppBadge";
import { getUnreadNewsCount } from "@/src/features/news/newsClient";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);
  const locationRef = useRef(location);
  locationRef.current = location;
  const hadRouteForCameraRef = useRef(false);
  const prevRouteCameraImmersiveRef = useRef(routeCameraImmersive);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchLocationMarkers();
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
            markerKey: d.markerKey,
            typeCode: d.typeCode,
          }));

        setMarkers(next);
      } catch (e) {
        log.warn("[UniMap] map locations load failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUnreadNewsCount = useCallback(() => {
    void (async () => {
      try {
        const count = await getUnreadNewsCount();
        setUnreadNewsCount(count);
        await syncNewsAppBadge(count);
      } catch (e) {
        log.warn("[UniMap] unread news count failed", e);
      }
    })();
  }, []);

  useFocusEffect(refreshUnreadNewsCount);

  useEffect(() => {
    const focusId = focusLocationParam(focusLocationRaw);
    if (!focusId) return;

    const loc = markers.find((d) => d.id === focusId);
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
  }, [focusLocationRaw, markers, clearRoute, router]);

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

    const userLngLat: [number, number] = [
      loc.coords.longitude,
      loc.coords.latitude,
    ];
    const returningFromImmersive =
      immersiveToggled && !routeCameraImmersive;

    if (routeCameraImmersive) {
      setCameraFollowUser(false);
      focusCameraRouteFirstPerson(cameraRef, userLngLat, path);
    } else {
      setCameraFollowUser(false);
      if (returningFromImmersive) {
        focusCameraToRoutePathAfterImmersive(cameraRef, path);
      } else {
        focusCameraToRoutePath(cameraRef, path);
      }
    }
  }, [routeFeature, routeCameraImmersive]);

  const handleRouteNavigationBack = useCallback(() => {
    const id = selectedLocationId;
    const loc =
      id == null ? undefined : markers.find((d) => d.id === id);

    clearRoute();
    setRouteCameraImmersive(false);

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
  }, [clearRoute, markers, selectedLocationId]);

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

  const fabTop = insets.top + 12;
  const fabBottom = insets.bottom + 24;
  const fabSide = 20;

  return (
    <View style={{ flex: 1 }}>
      <Map
        location={location}
        markers={mapMarkers}
        cameraRef={cameraRef}
        followUserLocation={cameraFollowUser}
        onStopFollowingUser={() => setCameraFollowUser(false)}
        routeFeature={routeFeature}
        selectedLocationId={selectedLocationId}
        onMarkerPress={(locationId) => {
          clearRoute();
          setSelectedLocationId(locationId);
        }}
      />

      <View style={styles.sheetLayer} pointerEvents="box-none">
        <LocationMapPreviewSheet
          locationId={selectedLocationId}
          userLocation={location}
          routeCameraImmersive={routeCameraImmersive}
          onToggleRouteCameraImmersive={toggleRouteCameraImmersive}
          onRouteNavigationBack={handleRouteNavigationBack}
          onDismiss={handleSheetClosed}
        />
      </View>

      {MAP_SEARCH_UI_ENABLED ? (
        <MapSearchChrome
          top={fabTop}
          horizontalInset={fabSide}
          unreadNewsCount={unreadNewsCount}
          onOpenLocations={() => {
            setSelectedLocationId(null);
            router.push("/locations");
          }}
          onOpenNews={() => {
            router.push("/news");
          }}
        />
      ) : (
        <>
          <LayoutButton
            style={{
              top: fabTop,
              left: fabSide,
              zIndex: 9999,
            }}
            icon={
              <Ionicons
                size={26}
                name="business-outline"
                color={globalColors.navigationFabIcon}
              />
            }
            accessibilityLabel="Усі відділення"
            onPress={() => {
              setSelectedLocationId(null);
              router.push("/locations");
            }}
          />

          <LayoutButton
            style={{
              top: fabTop,
              right: fabSide,
              zIndex: 9999,
            }}
            icon={
              <Ionicons
                size={26}
                name="newspaper-outline"
                color={globalColors.navigationFabIcon}
              />
            }
            badgeCount={unreadNewsCount > 0 ? unreadNewsCount : undefined}
            accessibilityLabel={
              unreadNewsCount > 0
                ? `Новини університету, ${unreadNewsCount} непрочитаних`
                : "Новини університету"
            }
            onPress={() => {
              router.push("/news");
            }}
          />
        </>
      )}

      <LayoutButton
        style={{
          bottom: fabBottom,
          right: fabSide,
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
