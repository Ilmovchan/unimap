import * as Location from "expo-location";

/** Центр Одеси — поки GPS ще не отримано, карта все одно відкривається. */
export const ODESA_MAP_CENTER = {
  longitude: 30.7233,
  latitude: 46.4825,
} as const;

export function createFallbackMapLocation(): Location.LocationObject {
  const now = Date.now();
  return {
    coords: {
      latitude: ODESA_MAP_CENTER.latitude,
      longitude: ODESA_MAP_CENTER.longitude,
      altitude: 0,
      accuracy: 10_000,
      altitudeAccuracy: null,
      heading: 0,
      speed: 0,
    },
    timestamp: now,
  };
}
