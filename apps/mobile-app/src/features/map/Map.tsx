import { globalColors } from "@/src/styles/styles";
import {
  Camera,
  CameraRef,
  CircleLayer,
  LineLayer,
  MapView,
  ShapeSource,
  ShapeSourceRef,
  SymbolLayer,
  UserLocation,
  type CircleLayerStyle,
  type LineLayerStyle,
  type OnPressEvent,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { fetchMapStyle, mapStyleUrl, type MapStyleSpec } from "@/src/features/api/mapClient";
import log from "loglevel";
import { resolveMarkerKeyForMap } from "@/src/features/api/locationsClient";
import type { RouteLineFeature } from "./mapRouteStore";
import {
  createSelectedMarkerStyles,
  createUnselectedMarkerStyles,
  DISTINCT_MAP_MARKER_KEYS,
  MARKER_SELECTION_ANIM_MS,
  SELECTED_MARKER_TARGET_SCALE,
} from "./mapMarkerImages";
import {
  focusCameraLikeNavigateButton,
  focusCameraToFitBounds,
} from "./navigateCamera";
import {
  MAP_CLUSTER_MAX_ZOOM_LEVEL,
  MAP_CLUSTER_MIN_POINTS,
  MAP_CLUSTER_RADIUS,
  MAP_CLUSTER_SOURCE_MAX_ZOOM_LEVEL,
} from "./mapClusterConfig";
import {
  MAP_CAMERA_LIMITS_ENABLED,
  MAP_MAX_ZOOM_LEVEL,
  MAP_MIN_ZOOM_LEVEL,
  ODESA_MAX_BOUNDS,
} from "./odesaMapBounds";

export type MapMarkerPoint = {
  id: string;
  lat: number;
  lng: number;
  /** Ключ маркера з API (building, library, stadium, …). */
  markerKey?: string;
  /** Код типу локації для резолву маркера. */
  typeCode?: string | null;
};

const CLUSTER_SOURCE_ID = "locationMarkers";
const ROUTE_SOURCE_ID = "navigationRoute";
const CLUSTER_LEAVES_PAGE_SIZE = 2000;

const CLUSTER_FIT_PADDING = {
  paddingTop: 128,
  paddingBottom: 192,
  paddingLeft: 44,
  paddingRight: 44,
} as const;

/** Більший margin — кластер трохи далі (менший зум). */
const CLUSTER_BOUNDS_MARGIN_RATIO = 0.28;
const CLUSTER_MIN_SPAN_DEG = 0.0009;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function isClusterFeature(feature: GeoJSON.Feature): boolean {
  const props = feature.properties as
    | Record<string, unknown>
    | undefined
    | null;
  if (!props || typeof props !== "object") return false;
  return props.point_count !== undefined && props.point_count !== null;
}

function pointCoordsLngLat(feature: GeoJSON.Feature): [number, number] | null {
  if (!feature.geometry || feature.geometry.type !== "Point") return null;
  const c = feature.geometry.coordinates;
  if (
    !Array.isArray(c) ||
    c.length < 2 ||
    typeof c[0] !== "number" ||
    typeof c[1] !== "number"
  ) {
    return null;
  }
  return [c[0], c[1]];
}

function boundsNeSwFromLngLats(
  coords: [number, number][],
): { ne: [number, number]; sw: [number, number] } | null {
  if (coords.length === 0) return null;

  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];

  for (let i = 1; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  let lngSpan = maxLng - minLng;
  let latSpan = maxLat - minLat;

  if (lngSpan < CLUSTER_MIN_SPAN_DEG) {
    const mid = (minLng + maxLng) / 2;
    minLng = mid - CLUSTER_MIN_SPAN_DEG / 2;
    maxLng = mid + CLUSTER_MIN_SPAN_DEG / 2;
    lngSpan = CLUSTER_MIN_SPAN_DEG;
  }
  if (latSpan < CLUSTER_MIN_SPAN_DEG) {
    const mid = (minLat + maxLat) / 2;
    minLat = mid - CLUSTER_MIN_SPAN_DEG / 2;
    maxLat = mid + CLUSTER_MIN_SPAN_DEG / 2;
    latSpan = CLUSTER_MIN_SPAN_DEG;
  }

  const dLng = lngSpan * CLUSTER_BOUNDS_MARGIN_RATIO;
  const dLat = latSpan * CLUSTER_BOUNDS_MARGIN_RATIO;

  return {
    sw: [minLng - dLng, minLat - dLat],
    ne: [maxLng + dLng, maxLat + dLat],
  };
}

async function collectClusterLeafCoords(
  shapeSource: ShapeSourceRef,
  clusterFeature: GeoJSON.Feature,
): Promise<[number, number][]> {
  const out: [number, number][] = [];
  let offset = 0;

  for (;;) {
    const page = await shapeSource.getClusterLeaves(
      clusterFeature,
      CLUSTER_LEAVES_PAGE_SIZE,
      offset,
    );
    for (const f of page.features) {
      const p = pointCoordsLngLat(f);
      if (p) out.push(p);
    }
    if (page.features.length < CLUSTER_LEAVES_PAGE_SIZE) break;
    offset += CLUSTER_LEAVES_PAGE_SIZE;
  }

  return out;
}

type Props = {
  location: Location.LocationObject;
  markers: MapMarkerPoint[];
  cameraRef: React.RefObject<CameraRef | null>;
  onMarkerPress?: (id: string) => void;
  routeFeature?: RouteLineFeature | null;
  selectedLocationId?: string | null;
  /** Викликається, коли JSON стилю завантажено (до повного рендеру тайлів). */
  onMapStyleReady?: () => void;
};

const Map = ({
  location,
  markers,
  cameraRef,
  onMarkerPress,
  routeFeature = null,
  selectedLocationId = null,
  onMapStyleReady,
}: Props) => {
  const [mapStyle, setMapStyle] = useState<MapStyleSpec | null>(null);
  const [mapStyleError, setMapStyleError] = useState<string | null>(null);
  const shapeSourceRef = useRef<ShapeSourceRef>(null);
  const selectedScaleRef = useRef(1);
  const [selectedScale, setSelectedScale] = useState(1);
  const highlightedIdRef = useRef<string | null>(null);
  /** Залишається на шарі «вибраний» під час анімації згортання після dismiss. */
  const [highlightedLocationId, setHighlightedLocationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setMapStyle(null);
    setMapStyleError(null);

    void (async () => {
      try {
        const style = await fetchMapStyle();
        if (!cancelled) {
          setMapStyle(style);
          onMapStyleReady?.();
        }
      } catch (e) {
        if (!cancelled) {
          const base =
            e instanceof Error && e.message.includes("Network request failed")
              ? `Перевірте, що API запущено (${mapStyleUrl()}).`
              : e instanceof Error
                ? e.message
                : "Не вдалося завантажити карту.";
          setMapStyleError(base);
          log.warn("[UniMap] map style load failed", e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onMapStyleReady]);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    const runScaleAnimation = (to: number, onComplete?: () => void) => {
      const from = selectedScaleRef.current;
      const start = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / MARKER_SELECTION_ANIM_MS);
        const next = from + (to - from) * easeOutCubic(t);
        selectedScaleRef.current = next;
        setSelectedScale(next);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        selectedScaleRef.current = to;
        setSelectedScale(to);
        onComplete?.();
      };

      raf = requestAnimationFrame(tick);
    };

    if (selectedLocationId) {
      highlightedIdRef.current = selectedLocationId;
      setHighlightedLocationId(selectedLocationId);
      runScaleAnimation(SELECTED_MARKER_TARGET_SCALE);
    } else if (highlightedIdRef.current) {
      runScaleAnimation(1, () => {
        if (!cancelled) {
          highlightedIdRef.current = null;
          setHighlightedLocationId(null);
        }
      });
    } else {
      selectedScaleRef.current = 1;
      setSelectedScale(1);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [selectedLocationId]);

  const selectionActive = highlightedLocationId !== null;

  const unselectedMarkerStyles = useMemo(
    () => createUnselectedMarkerStyles(selectionActive),
    [selectionActive],
  );

  const selectedMarkerStyles = useMemo(
    () => createSelectedMarkerStyles(selectedScale),
    [selectedScale],
  );

  const shape = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: markers.map((m) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [m.lng, m.lat],
        },
        properties: {
          id: m.id,
          markerKey: resolveMarkerKeyForMap(m.markerKey, m.typeCode),
          selected: m.id === highlightedLocationId ? 1 : 0,
        },
      })),
    }),
    [markers, highlightedLocationId],
  );

  const runCameraCommand = useCallback(
    (attempt: number, command: () => void) => {
      if (!cameraRef.current && attempt < 12) {
        setTimeout(() => runCameraCommand(attempt + 1, command), 48);
        return;
      }
      command();
    },
    [cameraRef],
  );

  const handleShapePress = useCallback(
    ({ features }: OnPressEvent) => {
      const feature = features?.[0];
      if (!feature) return;

      const lngLat = pointCoordsLngLat(feature);
      if (!lngLat) return;

      const cluster = isClusterFeature(feature);
      const raw = (feature.properties as { id?: unknown } | undefined)?.id;
      const id = raw === undefined || raw === null ? "" : String(raw);

      if (cluster) {
        runCameraCommand(0, () => {
          void (async () => {
            const src = shapeSourceRef.current;
            if (!src) return;

            const coords = await collectClusterLeafCoords(src, feature);
            const box = boundsNeSwFromLngLats(coords);
            if (!box) return;

            focusCameraToFitBounds(
              cameraRef,
              box.ne,
              box.sw,
              CLUSTER_FIT_PADDING,
            );
          })();
        });
        return;
      }

      if (id) onMarkerPress?.(id);

      runCameraCommand(0, () => {
        focusCameraLikeNavigateButton(cameraRef, lngLat, "tapSingleMarker");
      });
    },
    [cameraRef, onMarkerPress, runCameraCommand],
  );

  /** М’яка тінь під кластером — як у FAB. */
  const clusterHaloStyle = useMemo(
    (): CircleLayerStyle => ({
      circleRadius: [
        "step",
        ["get", "point_count"],
        27,
        8,
        30,
        16,
        33,
        40,
        37,
        100,
        41,
      ] as unknown as CircleLayerStyle["circleRadius"],
      circleColor: "rgba(46, 45, 43, 0.14)",
      circleOpacity: 1,
      circleBlur: 0.55,
      circlePitchAlignment: "map",
    }),
    [],
  );

  /** Кластер у стилі круглих кнопок над картою. */
  const clusterHullStyle = useMemo(
    (): CircleLayerStyle => ({
      circleRadius: [
        "step",
        ["get", "point_count"],
        21,
        8,
        24,
        16,
        27,
        40,
        31,
        100,
        35,
      ] as unknown as CircleLayerStyle["circleRadius"],
      circleColor: globalColors.navigationFabBg,
      circleOpacity: 1,
      circleStrokeWidth: 0,
      circlePitchAlignment: "map",
    }),
    [],
  );

  const clusterCountStyle = useMemo(
    () => ({
      textField: ["to-string", ["get", "point_count"]] as unknown as string,
      textSize: 15,
      textFont: ["Open Sans Semibold", "Arial Unicode MS Regular"],
      textColor: globalColors.navigationFabIcon,
      textHaloColor: "rgba(254, 254, 254, 0.85)",
      textHaloWidth: 1.25,
      textAllowOverlap: true,
      textIgnorePlacement: true,
    }),
    [],
  );

  const routeLineStyle = useMemo(
    (): LineLayerStyle => ({
      lineColor: globalColors.routeLine,
      lineWidth: 5,
      lineCap: "round",
      lineJoin: "round",
      lineOpacity: 1,
    }),
    [],
  );

  const routeShape = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!routeFeature || routeFeature.geometry.coordinates.length < 2) {
      return null;
    }
    return {
      type: "FeatureCollection",
      features: [routeFeature],
    };
  }, [routeFeature]);

  if (mapStyleError) {
    return (
      <View style={styles.mapState}>
        <Text style={styles.mapStateTitle}>Карта недоступна</Text>
        <Text style={styles.mapStateHint}>{mapStyleError}</Text>
      </View>
    );
  }

  if (!mapStyle) {
    return (
      <View style={styles.mapState}>
        <ActivityIndicator size="large" color={globalColors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        mapStyle={mapStyle}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        attributionEnabled={true}
        attributionPosition={{ bottom: 40, left: 25 }}
        compassViewPosition={2}
        compassViewMargins={{ x: 18, y: 80 }}
      >
        <UserLocation
          visible={true}
          minDisplacement={10}
          renderMode="native"
          showsUserHeadingIndicator={true}
        />

        {location && (
          <Camera
            defaultSettings={{
              centerCoordinate: [
                location.coords.longitude,
                location.coords.latitude,
              ],
              zoomLevel: 14,
              pitch: 0,
              animationMode: "moveTo",
            }}
            {...(MAP_CAMERA_LIMITS_ENABLED
              ? {
                  maxBounds: ODESA_MAX_BOUNDS,
                  minZoomLevel: MAP_MIN_ZOOM_LEVEL,
                  maxZoomLevel: MAP_MAX_ZOOM_LEVEL,
                }
              : {})}
            followUserLocation={false}
            ref={cameraRef}
          />
        )}

        {markers.length > 0 ? (
          <ShapeSource
            ref={shapeSourceRef}
            id={CLUSTER_SOURCE_ID}
            shape={shape}
            cluster
            clusterRadius={MAP_CLUSTER_RADIUS}
            clusterMaxZoomLevel={MAP_CLUSTER_MAX_ZOOM_LEVEL}
            clusterMinPoints={MAP_CLUSTER_MIN_POINTS}
            maxZoomLevel={MAP_CLUSTER_SOURCE_MAX_ZOOM_LEVEL}
            hitbox={{ width: 48, height: 48 }}
            onPress={handleShapePress}
          >
            <CircleLayer
              id={`${CLUSTER_SOURCE_ID}-cluster-halo`}
              filter={["has", "point_count"]}
              style={clusterHaloStyle}
            />
            <CircleLayer
              id={`${CLUSTER_SOURCE_ID}-cluster`}
              filter={["has", "point_count"]}
              style={clusterHullStyle}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-cluster-count`}
              filter={["has", "point_count"]}
              style={clusterCountStyle}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-building`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 0],
                [
                  "!",
                  [
                    "in",
                    ["get", "markerKey"],
                    ["literal", [...DISTINCT_MAP_MARKER_KEYS]],
                  ],
                ],
              ]}
              style={unselectedMarkerStyles.building}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-garden`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 0],
                ["==", ["get", "markerKey"], "garden"],
              ]}
              style={unselectedMarkerStyles.garden}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-library`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 0],
                ["==", ["get", "markerKey"], "library"],
              ]}
              style={unselectedMarkerStyles.library}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-stadium`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 0],
                ["==", ["get", "markerKey"], "stadium"],
              ]}
              style={unselectedMarkerStyles.stadium}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-dormitory`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 0],
                ["==", ["get", "markerKey"], "dormitory"],
              ]}
              style={unselectedMarkerStyles.dormitory}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-college`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 0],
                ["==", ["get", "markerKey"], "college"],
              ]}
              style={unselectedMarkerStyles.college}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-building-selected`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 1],
                [
                  "!",
                  [
                    "in",
                    ["get", "markerKey"],
                    ["literal", [...DISTINCT_MAP_MARKER_KEYS]],
                  ],
                ],
              ]}
              style={selectedMarkerStyles.building}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-garden-selected`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 1],
                ["==", ["get", "markerKey"], "garden"],
              ]}
              style={selectedMarkerStyles.garden}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-library-selected`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 1],
                ["==", ["get", "markerKey"], "library"],
              ]}
              style={selectedMarkerStyles.library}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-stadium-selected`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 1],
                ["==", ["get", "markerKey"], "stadium"],
              ]}
              style={selectedMarkerStyles.stadium}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-dormitory-selected`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 1],
                ["==", ["get", "markerKey"], "dormitory"],
              ]}
              style={selectedMarkerStyles.dormitory}
            />
            <SymbolLayer
              id={`${CLUSTER_SOURCE_ID}-point-college-selected`}
              filter={[
                "all",
                ["!", ["has", "point_count"]],
                ["==", ["get", "selected"], 1],
                ["==", ["get", "markerKey"], "college"],
              ]}
              style={selectedMarkerStyles.college}
            />
          </ShapeSource>
        ) : null}

        {routeShape ? (
          <ShapeSource id={ROUTE_SOURCE_ID} shape={routeShape}>
            <LineLayer
              id={`${ROUTE_SOURCE_ID}-line`}
              sourceID={ROUTE_SOURCE_ID}
              belowLayerID={
                markers.length > 0
                  ? `${CLUSTER_SOURCE_ID}-point-building`
                  : undefined
              }
              style={routeLineStyle}
            />
          </ShapeSource>
        ) : null}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: globalColors.background,
  },
  mapStateTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: globalColors.title,
    marginBottom: 8,
    textAlign: "center",
  },
  mapStateHint: {
    fontSize: 14,
    color: globalColors.subtitle,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default Map;
