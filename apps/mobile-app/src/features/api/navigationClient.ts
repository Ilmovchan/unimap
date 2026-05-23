import { serverApiBase } from "@/src/config/serverApi";
import log from "loglevel";

type RouteGeometry = {
  type?: string;
  coordinates?: unknown;
};

type RouteFeatureJson = {
  geometry?: RouteGeometry;
};

type OpenRouteLikeResponse = {
  features?: RouteFeatureJson[];
};

export type NavigationRouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
};

export type NavigationRouteResult = {
  coordinates: [number, number][];
  summary: NavigationRouteSummary | null;
};

function asLngLatPairs(raw: unknown): [number, number][] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: [number, number][] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const a = item[0];
    const b = item[1];
    if (typeof a !== "number" || typeof b !== "number") continue;
    out.push([a, b]);
  }
  return out;
}

/**
 * Витягує лінію маршруту з відповіді сервера (GeoJSON FeatureCollection з ORS).
 */
export function lineStringCoordinatesFromNavigationResponse(
  data: unknown,
): [number, number][] {
  if (!data || typeof data !== "object") return [];
  const features = (data as OpenRouteLikeResponse).features;
  if (!Array.isArray(features) || features.length === 0) return [];
  const geom = features[0]?.geometry;
  if (!geom?.coordinates) return [];
  const gType = typeof geom.type === "string" ? geom.type.toLowerCase() : "";
  if (gType !== "linestring") return [];
  return asLngLatPairs(geom.coordinates);
}

/** Дистанція та час з `features[0].properties.summary` (OpenRoute / сервер). */
export function summaryFromNavigationResponse(
  data: unknown,
): NavigationRouteSummary | null {
  if (!data || typeof data !== "object") return null;
  const features = (data as OpenRouteLikeResponse).features;
  if (!Array.isArray(features) || features.length === 0) return null;
  const props = (features[0] as { properties?: { summary?: unknown } })
    .properties;
  const s = props?.summary;
  if (!s || typeof s !== "object") return null;
  const raw = s as { distance?: unknown; duration?: unknown };
  const distanceMeters = Number(raw.distance);
  const durationSeconds = Number(raw.duration);
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    return null;
  }
  return { distanceMeters, durationSeconds };
}

export type NavigationRouteParams = {
  startLng: number;
  startLat: number;
  endLng: number;
  endLat: number;
  profile?: string;
};

/**
 * GET …/navigation/route — той самий базовий URL, що й `/locations`
 * (якщо base = `https://host/api`, шлях буде `https://host/api/navigation/route`).
 */
export async function fetchNavigationRoute(
  params: NavigationRouteParams,
): Promise<NavigationRouteResult> {
  const base = serverApiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  const q = new URLSearchParams({
    startLng: String(params.startLng),
    startLat: String(params.startLat),
    endLng: String(params.endLng),
    endLat: String(params.endLat),
    profile: params.profile ?? "foot-walking",
  });

  const primary = `${base}/navigation/route?${q.toString()}`;
  let res = await fetch(primary);

  if (res.status === 404) {
    const normalized = base.replace(/\/$/, "");
    if (!normalized.endsWith("/api")) {
      res = await fetch(`${normalized}/api/navigation/route?${q.toString()}`);
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    log.warn("[UniMap] navigation route failed", res.status, body);
    throw new Error(`Маршрут: HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  const coords = lineStringCoordinatesFromNavigationResponse(data);
  if (coords.length < 2) {
    throw new Error("Порожній маршрут");
  }
  return {
    coordinates: coords,
    summary: summaryFromNavigationResponse(data),
  };
}
