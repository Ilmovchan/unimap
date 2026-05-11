import type { NavigationRouteSummary } from "@/src/features/api/navigationClient";
import type { Feature, LineString } from "geojson";
import { create } from "zustand";

export type RouteLineFeature = Feature<LineString>;

function sanitizeLineCoordinates(
  coordinates: [number, number][],
): [number, number][] {
  const out: [number, number][] = [];
  for (const c of coordinates) {
    if (!Array.isArray(c) || c.length < 2) continue;
    const lng = Number(c[0]);
    const lat = Number(c[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const prev = out[out.length - 1];
    if (prev && prev[0] === lng && prev[1] === lat) continue;
    out.push([lng, lat]);
  }
  return out;
}

type MapRouteState = {
  routeFeature: RouteLineFeature | null;
  routeSummary: NavigationRouteSummary | null;
  setRouteFromCoordinates: (
    coordinates: [number, number][],
    summary?: NavigationRouteSummary | null,
  ) => void;
  clearRoute: () => void;
};

export const useMapRouteStore = create<MapRouteState>((set) => ({
  routeFeature: null,
  routeSummary: null,
  setRouteFromCoordinates: (coordinates, summary) => {
    const cleaned = sanitizeLineCoordinates(coordinates);
    if (cleaned.length < 2) {
      set({ routeFeature: null, routeSummary: null });
      return;
    }
    set({
      routeFeature: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: cleaned,
        },
      },
      routeSummary:
        summary &&
        Number.isFinite(summary.distanceMeters) &&
        Number.isFinite(summary.durationSeconds)
          ? summary
          : null,
    });
  },
  clearRoute: () => set({ routeFeature: null, routeSummary: null }),
}));
