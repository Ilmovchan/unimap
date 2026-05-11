import type { CameraRef } from "@maplibre/maplibre-react-native";
import type { Position } from "geojson";
import type { RefObject } from "react";
import { Dimensions } from "react-native";

/** Було 1200 мс; +30% повільніша анімація (менш «різка»). */
export const MARKER_FOCUS_ANIMATION_DURATION_MS = 1560;

/** Нахил камери під час показу маршруту (3D-ефект). */
export const ROUTE_CAMERA_PITCH_DEG = 58;

const ZOOM_FOCUS_REFERENCE_START = 14;
const ZOOM_FOCUS_REDUCTION = 0.3;

/** Кнопка «до мене» — як раніше (ближче). */
const ZOOM_PEAK_NAVIGATE_TO_USER = 20;

/** Тап по одному маркеру — далі від землі (менший зум), щоб бачити оточення. */
const ZOOM_PEAK_SINGLE_MARKER = 17;

function zoomLevelFromPeak(peak: number): number {
  const span = peak - ZOOM_FOCUS_REFERENCE_START;
  return (
    peak - span * ZOOM_FOCUS_REDUCTION + Math.random() / 100000
  );
}

/** Зум для кнопки навігації до користувача (~18.2 при стартовому 14). */
export function markerFocusZoomLevel(): number {
  return zoomLevelFromPeak(ZOOM_PEAK_NAVIGATE_TO_USER);
}

/** Зум при тапі на один маркер (подалі, ніж «до мене»). */
export function singleMarkerFocusZoomLevel(): number {
  return zoomLevelFromPeak(ZOOM_PEAK_SINGLE_MARKER);
}

/**
 * Підігнати кадр під прямокутник (кластер: усі точки в полі зору).
 * Та сама тривалість і flyTo, що й для кнопки «до мене».
 */
export type FitBoundsCameraExtras = {
  pitch?: number;
  heading?: number;
};

export function focusCameraToFitBounds(
  cameraRef: RefObject<CameraRef | null>,
  ne: Position,
  sw: Position,
  padding: {
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
  },
  extras?: FitBoundsCameraExtras,
): void {
  cameraRef.current?.setCamera({
    bounds: { ne, sw },
    padding,
    animationDuration: MARKER_FOCUS_ANIMATION_DURATION_MS,
    animationMode: "flyTo",
    ...(extras?.pitch !== undefined ? { pitch: extras.pitch } : {}),
    ...(extras?.heading !== undefined ? { heading: extras.heading } : {}),
  });
}

export type FocusSinglePointReason =
  | "followUserLocation"
  | "tapSingleMarker";

/**
 * Нижній відступ кадру при фокусі на маркер / маршрут, щоб кадр був видимий над компактним form sheet
 * (snap ~40% висоти вікна).
 */
export function markerFocusBottomPaddingPx(): number {
  return Math.round(Dimensions.get("window").height * 0.4);
}

/** Відступи для підгонки камери під лінію маршруту (карта + нижній sheet). */
export function routeFitPadding(): {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
} {
  return {
    paddingTop: 100,
    paddingBottom: markerFocusBottomPaddingPx() + 48,
    paddingLeft: 40,
    paddingRight: 40,
  };
}

/**
 * Обмежуючий прямокутник для набору точок [lng, lat].
 */
export function boundingBoxFromLngLatPath(
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

  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  const margin = 0.12;
  const dLng = lngSpan * margin || 0.002;
  const dLat = latSpan * margin || 0.002;

  return {
    sw: [minLng - dLng, minLat - dLat],
    ne: [maxLng + dLng, maxLat + dLat],
  };
}

/** Азимут від `from` до `to` у градусах (0° — північ, за годинниковою). Координати [lng, lat]. */
export function bearingDegreesLngLat(
  from: [number, number],
  to: [number, number],
): number {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (((θ * 180) / Math.PI + 360) % 360);
}

const IMMERSIVE_ROUTE_ZOOM_LEVEL = 17.4;

/** Камера «ніби з точки користувача»: нахил, напрямок на кінець маршруту. */
export function focusCameraRouteFirstPerson(
  cameraRef: RefObject<CameraRef | null>,
  userLngLat: [number, number],
  routeCoords: [number, number][],
): void {
  if (routeCoords.length < 2) return;
  const dest = routeCoords[routeCoords.length - 1];
  const heading = bearingDegreesLngLat(userLngLat, dest);
  cameraRef.current?.setCamera({
    centerCoordinate: userLngLat,
    zoomLevel: IMMERSIVE_ROUTE_ZOOM_LEVEL,
    pitch: ROUTE_CAMERA_PITCH_DEG,
    heading,
    animationDuration: MARKER_FOCUS_ANIMATION_DURATION_MS,
    animationMode: "flyTo",
  });
}

/** Огляд маршруту зверху (без нахилу, північ вгорі). */
export function focusCameraToRoutePath(
  cameraRef: RefObject<CameraRef | null>,
  coords: [number, number][],
): void {
  const box = boundingBoxFromLngLatPath(coords);
  if (!box) return;
  focusCameraToFitBounds(cameraRef, box.ne, box.sw, routeFitPadding(), {
    pitch: 0,
    heading: 0,
  });
}

/** Повернути «пласку» карту після маршруту. */
export function easeCameraPitchToZero(
  cameraRef: RefObject<CameraRef | null>,
): void {
  cameraRef.current?.setCamera({
    pitch: 0,
    animationDuration: MARKER_FOCUS_ANIMATION_DURATION_MS,
    animationMode: "easeTo",
  });
}

/**
 * Наближення до однієї точки: кнопка navigate або тап по маркеру (різний зум).
 */
export function focusCameraLikeNavigateButton(
  cameraRef: RefObject<CameraRef | null>,
  centerCoordinate: [number, number],
  reason: FocusSinglePointReason = "followUserLocation",
): void {
  const zoomLevel =
    reason === "tapSingleMarker"
      ? singleMarkerFocusZoomLevel()
      : markerFocusZoomLevel();

  const padding =
    reason === "tapSingleMarker"
      ? { paddingBottom: markerFocusBottomPaddingPx() }
      : undefined;

  cameraRef.current?.setCamera({
    centerCoordinate,
    zoomLevel,
    pitch: 0,
    animationDuration: MARKER_FOCUS_ANIMATION_DURATION_MS,
    animationMode: "flyTo",
    ...(padding ? { padding } : {}),
  });
}
