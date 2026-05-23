import {
  fetchNavigationRoute,
} from "@/src/features/api/navigationClient";
import log from "loglevel";
import { useEffect, useRef } from "react";
import { useMapRouteStore } from "./mapRouteStore";

/** Перерахунок маршруту на сервері (обрізання «хвоста» — на клієнті при кожному GPS). */
export const ROUTE_REFRESH_EVERY_METERS = 25;

export type RouteDestination = {
  lat: number;
  lng: number;
};

function distanceMetersOnEarth(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Оновлює лінію маршруту, коли користувач відійшов від останньої точки перерахунку
 * не менше ніж на {@link ROUTE_REFRESH_EVERY_METERS} метрів.
 */
export function useRouteRefreshOnMove(
  userLat: number,
  userLng: number,
  destination: RouteDestination | null,
  routeActive: boolean,
): void {
  const setRouteCoords = useMapRouteStore((s) => s.setRouteFromCoordinates);
  const lastAnchorRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    if (!routeActive || !destination) {
      lastAnchorRef.current = null;
      return;
    }

    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return;
    }

    if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) {
      return;
    }

    if (lastAnchorRef.current == null) {
      lastAnchorRef.current = { latitude: userLat, longitude: userLng };
      return;
    }

    const anchor = lastAnchorRef.current;
    const moved = distanceMetersOnEarth(
      anchor.latitude,
      anchor.longitude,
      userLat,
      userLng,
    );

    if (moved < ROUTE_REFRESH_EVERY_METERS || refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    void (async () => {
      try {
        const { coordinates, summary } = await fetchNavigationRoute({
          startLng: userLng,
          startLat: userLat,
          endLng: destination.lng,
          endLat: destination.lat,
        });
        setRouteCoords(coordinates, summary);
        lastAnchorRef.current = { latitude: userLat, longitude: userLng };
      } catch (e) {
        log.warn("[UniMap] route refresh on move failed", e);
      } finally {
        refreshInFlightRef.current = false;
      }
    })();
  }, [
    routeActive,
    destination,
    destination?.lat,
    destination?.lng,
    userLat,
    userLng,
    setRouteCoords,
  ]);
}
