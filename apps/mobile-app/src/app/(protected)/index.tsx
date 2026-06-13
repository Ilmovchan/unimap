import {
  fetchLocationMarkers,
  fetchLocations,
  locationMapDisplayLabel,
  type LocationMapDto,
} from "@/src/features/api/locationsClient";
import { useLocation } from "@/src/features/core/location/stores/LocationProvider";
import { createFallbackMapLocation } from "@/src/features/map/defaultMapLocation";
import { hapticNavigationArrived } from "@/src/features/haptics/unimapHaptics";
import Map, {
  bearingDegreesLngLat,
  focusCameraLikeNavigateButton,
  focusCameraRouteFirstPerson,
  focusCameraToRoutePath,
  focusCameraToRoutePathAfterImmersive,
  IMMERSIVE_ROUTE_ZOOM_LEVEL,
  MARKER_FOCUS_ANIMATION_DURATION_MS,
  ROUTE_CAMERA_PITCH_DEG,
  useMapRouteStore,
  type MapMarkerPoint,
} from "@/src/features/map/";
import { hasArrivedAtDestination } from "@/src/features/map/navigationArrival";
import LocationMapPreviewSheet from "@/src/features/map/LocationMapPreviewSheet";
import { useRouteRefreshOnMove } from "@/src/features/map/useRouteRefreshOnMove";
import { trimRouteCoordinatesAheadOfUser } from "@/src/features/map/trimRouteAheadOfUser";
import type { RouteLineFeature } from "@/src/features/map/mapRouteStore";
import LayoutButton from "@/src/features/map/components/LayoutButton";
import MapSearchChrome from "@/src/features/map/components/MapSearchChrome";
import type { MapSearchResultPlaceholder } from "@/src/features/map/components/MapSearchResultsPanel";
import {
  getMapFabInsets,
  mapFabStackBottom,
} from "@/src/features/map/mapFabLayout";
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
import { InteractionManager, Keyboard, StyleSheet, View } from "react-native";
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

function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`ʼ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function locationSearchHaystack(location: LocationMapDto): string {
  const parts: string[] = [
    location.name,
    location.type ?? "",
    location.typeName ?? "",
    location.address ?? "",
    location.addressJson ?? "",
    ...(location.objects ?? []).flatMap((object) => [
      object.name,
      object.type,
      object.typeName,
      object.description ?? "",
      object.manager ?? "",
      object.roomNumber ?? "",
      object.phoneNumber ?? "",
      object.webUrl ?? "",
    ]),
  ];

  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

function matchingObjectIds(
  location: LocationMapDto,
  query: string,
): string[] {
  if (!query) return [];
  return (location.objects ?? [])
    .filter((object) =>
      normalizeSearchText(
        [
          object.name,
          object.type,
          object.typeName,
          object.description ?? "",
          object.manager ?? "",
          object.roomNumber ?? "",
          object.phoneNumber ?? "",
          object.webUrl ?? "",
        ].join(" "),
      ).includes(query),
    )
    .map((object) => object.id);
}

function buildSearchResults(
  locations: LocationMapDto[],
  rawQuery: string,
): MapSearchResultPlaceholder[] {
  const query = normalizeSearchText(rawQuery);
  if (query.length < 2) return [];

  return locations
    .map((location): MapSearchResultPlaceholder | null => {
      const objectMatches = matchingObjectIds(location, query);
      const locationMatches = locationSearchHaystack(location).includes(query);
      if (!locationMatches && objectMatches.length === 0) return null;

      const matchedObjects = (location.objects ?? []).filter((object) =>
        objectMatches.includes(object.id),
      );
      const objectNames = matchedObjects.map((object) => object.name.trim()).filter(Boolean);
      const subtitle =
        objectNames.length > 0
          ? objectNames.slice(0, 3).join(", ")
          : location.typeName?.trim() || undefined;

      return {
        id: location.id,
        title: locationMapDisplayLabel(location),
        subtitle:
          objectNames.length > 3
            ? `${subtitle}, +${objectNames.length - 3}`
            : subtitle,
        matchedObjectId: matchedObjects[0]?.id ?? null,
      };
    })
    .filter((item): item is MapSearchResultPlaceholder => item != null)
    .slice(0, 20);
}

export default function MapScreen() {
  const router = useRouter();
  const {
    focusLocation: focusLocationRaw,
    highlightObjectId: highlightObjectIdRaw,
  } = useLocalSearchParams<{
    focusLocation?: string | string[];
    highlightObjectId?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef | null>(null);
  const location = useLocation().location;
  const [markers, setMarkers] = useState<MapMarkerPoint[]>([]);
  const [searchLocations, setSearchLocations] = useState<LocationMapDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [markersLoadEnabled, setMarkersLoadEnabled] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [highlightObjectId, setHighlightObjectId] = useState<string | null>(
    null,
  );
  const routeFeature = useMapRouteStore((s) => s.routeFeature);
  const clearRoute = useMapRouteStore((s) => s.clearRoute);
  const [routeCameraImmersive, setRouteCameraImmersive] = useState(false);
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);
  const locationRef = useRef(location);
  locationRef.current = location;
  const hadRouteForCameraRef = useRef(false);
  const prevRouteCameraImmersiveRef = useRef(routeCameraImmersive);
  const arrivalHapticDoneRef = useRef(false);
  /** Не перебиваємо flyTo при вході в immersive setCamera-оновленнями GPS. */
  const immersiveEnterAnimatingRef = useRef(false);

  useEffect(() => {
    if (!markersLoadEnabled) return;

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
  }, [markersLoadEnabled]);

  useEffect(() => {
    if (!MAP_SEARCH_UI_ENABLED) return;

    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchLocations();
        if (!cancelled) setSearchLocations(list);
      } catch (e) {
        log.warn("[UniMap] map search locations load failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMapStyleReady = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setMarkersLoadEnabled(true);
    });
  }, []);

  const refreshUnreadNewsCount = useCallback(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const count = await getUnreadNewsCount();
          setUnreadNewsCount(count);
          await syncNewsAppBadge(count);
        } catch (e) {
          log.warn("[UniMap] unread news count failed", e);
        }
      })();
    });
    return () => task.cancel();
  }, []);

  useFocusEffect(refreshUnreadNewsCount);

  const openLocationSheet = useCallback(
    (locationId: string) => {
      if (selectedLocationId === locationId) return;
      clearRoute();
      setHighlightObjectId(null);
      setSelectedLocationId(locationId);
    },
    [clearRoute, selectedLocationId],
  );

  const focusSearchResult = useCallback(
    (result: MapSearchResultPlaceholder) => {
      Keyboard.dismiss();
      const loc = markers.find((d) => d.id === result.id);
      clearRoute();
      setRouteCameraImmersive(false);
      setSelectedLocationId(result.id);
      setHighlightObjectId(result.matchedObjectId?.trim() || null);

      if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
        return;
      }

      focusCameraLikeNavigateButton(
        cameraRef,
        [loc.lng, loc.lat],
        "tapSingleMarker",
      );
    },
    [clearRoute, markers],
  );

  const searchResults = useMemo(
    () => buildSearchResults(searchLocations, searchQuery),
    [searchLocations, searchQuery],
  );

  useEffect(() => {
    const focusId = focusLocationParam(focusLocationRaw);
    if (!focusId) return;

    const loc = markers.find((d) => d.id === focusId);
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
      return;
    }

    const lng = loc.lng;
    const lat = loc.lat;
    const objectHighlight = focusLocationParam(highlightObjectIdRaw);

    clearRoute();
    setRouteCameraImmersive(false);
    setSelectedLocationId(focusId);
    setHighlightObjectId(objectHighlight ?? null);
    router.setParams({
      focusLocation: undefined,
      highlightObjectId: undefined,
    });

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
  }, [
    focusLocationRaw,
    highlightObjectIdRaw,
    markers,
    clearRoute,
    router,
  ]);

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
      immersiveEnterAnimatingRef.current = true;
      focusCameraRouteFirstPerson(cameraRef, userLngLat, path);
      setTimeout(() => {
        immersiveEnterAnimatingRef.current = false;
      }, MARKER_FOCUS_ANIMATION_DURATION_MS + 80);
    } else {
      immersiveEnterAnimatingRef.current = false;
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
    }
    setSelectedLocationId(null);
    setHighlightObjectId(null);
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

  const routeDestination = useMemo(() => {
    if (!selectedLocationId) return null;
    const m = markers.find((d) => d.id === selectedLocationId);
    if (!m || !Number.isFinite(m.lat) || !Number.isFinite(m.lng)) {
      return null;
    }
    return { lat: m.lat, lng: m.lng };
  }, [markers, selectedLocationId]);

  const routeActive = Boolean(
    routeFeature?.geometry?.coordinates &&
      routeFeature.geometry.coordinates.length >= 2,
  );

  const hasArrived = hasArrivedAtDestination(
    routeActive,
    location,
    routeDestination,
  );

  useEffect(() => {
    if (!routeActive) {
      arrivalHapticDoneRef.current = false;
      return;
    }
    if (!hasArrived || arrivalHapticDoneRef.current) return;
    arrivalHapticDoneRef.current = true;
    hapticNavigationArrived();
  }, [hasArrived, routeActive]);

  useRouteRefreshOnMove(
    location?.coords.latitude ?? NaN,
    location?.coords.longitude ?? NaN,
    routeDestination,
    routeActive && !hasArrived,
  );

  /** Лінія без «хвоста»; при прибутті маршрут не показуємо. */
  const displayRouteFeature = useMemo((): RouteLineFeature | null => {
    if (hasArrived) return null;
    const coords = routeFeature?.geometry?.coordinates;
    if (!routeFeature || !coords || coords.length < 2 || !location) {
      return routeFeature;
    }
    const trimmed = trimRouteCoordinatesAheadOfUser(
      coords as [number, number][],
      location.coords.longitude,
      location.coords.latitude,
    );
    if (trimmed.length < 2) {
      return null;
    }
    return {
      ...routeFeature,
      geometry: {
        type: "LineString",
        coordinates: trimmed,
      },
    };
  }, [
    hasArrived,
    routeFeature,
    location?.coords.latitude,
    location?.coords.longitude,
  ]);

  /** Immersive: камера слідує за користувачем і дивиться на ціль. */
  useEffect(() => {
    if (!routeCameraImmersive || !routeActive || hasArrived) return;
    if (immersiveEnterAnimatingRef.current) return;
    if (!location || !routeDestination) return;

    const userLngLat: [number, number] = [
      location.coords.longitude,
      location.coords.latitude,
    ];
    const destLngLat: [number, number] = [
      routeDestination.lng,
      routeDestination.lat,
    ];
    const heading = bearingDegreesLngLat(userLngLat, destLngLat);

    cameraRef.current?.setCamera({
      centerCoordinate: userLngLat,
      zoomLevel: IMMERSIVE_ROUTE_ZOOM_LEVEL,
      pitch: ROUTE_CAMERA_PITCH_DEG,
      heading,
      animationDuration: 280,
      animationMode: "easeTo",
    });
  }, [
    routeCameraImmersive,
    routeActive,
    hasArrived,
    routeDestination,
    location?.coords.latitude,
    location?.coords.longitude,
  ]);

  const mapLocation = location ?? createFallbackMapLocation();
  const hasGpsLocation = location != null;

  const fab = getMapFabInsets(insets);

  return (
    <View style={{ flex: 1 }}>
      <Map
        location={mapLocation}
        markers={mapMarkers}
        cameraRef={cameraRef}
        routeFeature={displayRouteFeature}
        selectedLocationId={selectedLocationId}
        showUserLocation={hasGpsLocation}
        onMarkerPress={openLocationSheet}
        onMapStyleReady={handleMapStyleReady}
      />

      <View
        style={styles.sheetLayer}
        pointerEvents={selectedLocationId ? "box-none" : "none"}
      >
        <LocationMapPreviewSheet
          locationId={selectedLocationId}
          highlightObjectId={highlightObjectId}
          userLocation={mapLocation}
          hasArrived={hasArrived}
          routeCameraImmersive={routeCameraImmersive}
          onToggleRouteCameraImmersive={toggleRouteCameraImmersive}
          onRouteNavigationBack={handleRouteNavigationBack}
          onDismiss={handleSheetClosed}
        />
      </View>

      {MAP_SEARCH_UI_ENABLED ? (
        <MapSearchChrome
          top={fab.top}
          horizontalInset={fab.right}
          unreadNewsCount={unreadNewsCount}
          query={searchQuery}
          results={searchResults}
          onChangeQuery={setSearchQuery}
          onSelectResult={focusSearchResult}
          onOpenLocations={() => {
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
              top: fab.top,
              left: fab.left,
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
            onPress={() => router.push("/locations")}
          />

          <LayoutButton
            style={{
              top: fab.top,
              right: fab.right,
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
          bottom: mapFabStackBottom(fab.bottom, 1),
          right: fab.right,
          zIndex: 9999,
        }}
        icon={
          <Ionicons
            size={26}
            name="qr-code-outline"
            color={globalColors.navigationFabIcon}
          />
        }
        accessibilityLabel="Сканувати QR-код"
        onPress={() => router.push("/qr")}
      />

      <LayoutButton
        style={{
          bottom: fab.bottom,
          right: fab.right,
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
          if (!hasGpsLocation) return;
          focusCameraLikeNavigateButton(
            cameraRef,
            [location.coords.longitude, location.coords.latitude],
            "followUserLocation",
          );
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
