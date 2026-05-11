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
import React, { useCallback, useMemo, useRef } from "react";
import { InteractionManager, View } from "react-native";
import type { RouteLineFeature } from "./mapRouteStore";
import {
  focusCameraLikeNavigateButton,
  focusCameraToFitBounds,
} from "./navigateCamera";

export type MapMarkerPoint = {
  id: string;
  lat: number;
  lng: number;
};

const CLUSTER_SOURCE_ID = "departmentMarkers";
const ROUTE_SOURCE_ID = "navigationRoute";
const CLUSTER_LEAVES_PAGE_SIZE = 2000;

/**
 * Камера не виходить за межі Одеси та найближчих околиць.
 * Координати [lng, lat] у форматі MapLibre (NE / SW).
 */
const ODESA_MAX_BOUNDS = {
  ne: [30.98, 46.66] as [number, number],
  sw: [30.4, 46.34] as [number, number],
};

/** Мінімальний рівень зуму (не віддалятись далі — інакше видно територію за межами міста). */
const MAP_MIN_ZOOM_LEVEL = 10;
const MAP_MAX_ZOOM_LEVEL = 20;

/** Відступи від країв екрана, щоб маркери кластера не ховались під кнопками / атрибуцією. */
const CLUSTER_FIT_PADDING = {
  paddingTop: 120,
  paddingBottom: 180,
  paddingLeft: 40,
  paddingRight: 40,
} as const;

/** Запас навколо bbox (частка від розміру), щоб точки не прилипали до краю кадру. */
const CLUSTER_BOUNDS_MARGIN_RATIO = 0.22;
const CLUSTER_MIN_SPAN_DEG = 0.0009;

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
};

const Map = ({
  location,
  markers,
  cameraRef,
  followUserLocation = false,
  onStopFollowingUser,
  onMarkerPress,
  routeFeature = null,
}: Props) => {
  const apiUrl = process.env.EXPO_PUBLIC_MAP_RENDER_API_LINK;
  const shapeSourceRef = useRef<ShapeSourceRef>(null);

  const shape = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: markers.map((m) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [m.lng, m.lat],
        },
        properties: { id: m.id },
      })),
    }),
    [markers],
  );

  const bubbleStyleShared = useMemo(
    () => ({
      circleColor: globalColors.surface,
      circleOpacity: 1,
      circleStrokeWidth: 1.5,
      circleStrokeColor: globalColors.border as string,
    }),
    [],
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

  const clusterHullStyle = useMemo(
    (): CircleLayerStyle => ({
      ...bubbleStyleShared,
      circleRadius: [
        "step",
        ["get", "point_count"],
        28,
        8,
        32,
        16,
        36,
        40,
        44,
        100,
        50,
      ] as unknown as CircleLayerStyle["circleRadius"],
    }),
    [bubbleStyleShared],
  );

  const clusterCountStyle = useMemo(
    () => ({
      textField: ["to-string", ["get", "point_count"]] as unknown as string,
      textSize: 16,
      textColor: globalColors.navigationFabIcon,
      textAllowOverlap: true,
      textIgnorePlacement: true,
    }),
    [],
  );

  const unclusteredHullStyle = useMemo(
    () => ({
      ...bubbleStyleShared,
      circleRadius: 26,
    }),
    [bubbleStyleShared],
  );

  const unclusteredCoreStyle = useMemo(
    () => ({
      circleRadius: 9,
      circleColor: globalColors.accent,
      circleOpacity: 1,
      circlePitchAlignment: "map" as const,
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

        {markers.length > 0 && (
          <ShapeSource
            ref={shapeSourceRef}
            id={CLUSTER_SOURCE_ID}
            shape={shape}
            cluster
            clusterRadius={56}
            clusterMaxZoomLevel={16}
            clusterMinPoints={2}
            hitbox={{ width: 72, height: 72 }}
            onPress={handleShapePress}
          >
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
            <CircleLayer
              id={`${CLUSTER_SOURCE_ID}-point-hull`}
              filter={["!", ["has", "point_count"]]}
              style={unclusteredHullStyle}
            />
            <CircleLayer
              id={`${CLUSTER_SOURCE_ID}-point-core`}
              filter={["!", ["has", "point_count"]]}
              style={unclusteredCoreStyle}
            />
          </ShapeSource>
        )}

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
