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
import { InteractionManager, View } from "react-native";
import { resolveMarkerKeyForMap } from "@/src/features/api/locationsClient";
import type { RouteLineFeature } from "./mapRouteStore";
import {
  createSelectedMarkerStyles,
  createUnselectedMarkerStyles,
  MARKER_SELECTION_ANIM_MS,
  SELECTED_MARKER_TARGET_SCALE,
} from "./mapMarkerImages";
import {
  focusCameraLikeNavigateButton,
  focusCameraToFitBounds,
} from "./navigateCamera";

export type MapMarkerPoint = {
  id: string;
  lat: number;
  lng: number;
  /** Ключ маркера з API (building, library, stadium, …). */
  markerKey?: string;
};

const CLUSTER_SOURCE_ID = "locationMarkers";
const ROUTE_SOURCE_ID = "navigationRoute";
const CLUSTER_LEAVES_PAGE_SIZE = 2000;

const ODESA_MAX_BOUNDS = {
  ne: [30.98, 46.66] as [number, number],
  sw: [30.4, 46.34] as [number, number],
};

const MAP_MIN_ZOOM_LEVEL = 10;
const MAP_MAX_ZOOM_LEVEL = 20;

const CLUSTER_FIT_PADDING = {
  paddingTop: 120,
  paddingBottom: 180,
  paddingLeft: 40,
  paddingRight: 40,
} as const;

const CLUSTER_BOUNDS_MARGIN_RATIO = 0.22;
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
  followUserLocation?: boolean;
  onStopFollowingUser?: () => void;
  onMarkerPress?: (id: string) => void;
  routeFeature?: RouteLineFeature | null;
  selectedLocationId?: string | null;
};

const Map = ({
  location,
  markers,
  cameraRef,
  followUserLocation = false,
  onStopFollowingUser,
  onMarkerPress,
  routeFeature = null,
  selectedLocationId = null,
}: Props) => {
  const apiUrl = process.env.EXPO_PUBLIC_MAP_RENDER_API_LINK;
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
          markerKey: resolveMarkerKeyForMap(m.markerKey),
          selected: m.id === highlightedLocationId ? 1 : 0,
        },
      })),
    }),
    [markers, highlightedLocationId],
  );

  const handleShapePress = useCallback(
    ({ features }: OnPressEvent) => {
      const feature = features?.[0];
      if (!feature) return;

      const lngLat = pointCoordsLngLat(feature);
      if (!lngLat) return;

      const cluster = isClusterFeature(feature);

      onStopFollowingUser?.();

      InteractionManager.runAfterInteractions(() => {
        if (cluster) {
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
          return;
        }

        focusCameraLikeNavigateButton(cameraRef, lngLat, "tapSingleMarker");

        const raw = (feature.properties as { id?: unknown } | undefined)?.id;
        const id = raw === undefined || raw === null ? "" : String(raw);
        if (id) onMarkerPress?.(id);
      });
    },
    [cameraRef, onMarkerPress, onStopFollowingUser],
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

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        mapStyle={apiUrl}
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
            maxBounds={ODESA_MAX_BOUNDS}
            minZoomLevel={MAP_MIN_ZOOM_LEVEL}
            maxZoomLevel={MAP_MAX_ZOOM_LEVEL}
            followUserLocation={followUserLocation}
            ref={cameraRef}
          />
        )}

        {markers.length > 0 ? (
          <ShapeSource
            ref={shapeSourceRef}
            id={CLUSTER_SOURCE_ID}
            shape={shape}
            cluster
            clusterRadius={48}
            clusterMaxZoomLevel={14}
            clusterMinPoints={2}
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
                    ["literal", ["library", "stadium", "dormitory"]],
                  ],
                ],
              ]}
              style={unselectedMarkerStyles.building}
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
                    ["literal", ["library", "stadium", "dormitory"]],
                  ],
                ],
              ]}
              style={selectedMarkerStyles.building}
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
          </ShapeSource>
        ) : null}

        {routeShape ? (
          <ShapeSource id={ROUTE_SOURCE_ID} shape={routeShape}>
            <LineLayer
              id={`${ROUTE_SOURCE_ID}-line`}
              sourceID={ROUTE_SOURCE_ID}
              style={routeLineStyle}
            />
          </ShapeSource>
        ) : null}
      </MapView>
    </View>
  );
};

export default Map;
