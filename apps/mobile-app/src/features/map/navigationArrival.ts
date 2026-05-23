import * as Location from "expo-location";

export const ARRIVAL_DISTANCE_METERS = 50;

export function distanceMetersOnEarth(
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
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type RouteDestination = { lat: number; lng: number };

export function distanceToDestinationMeters(
  userLocation: Location.LocationObject | null,
  destination: RouteDestination | null,
): number {
  if (
    !userLocation ||
    !destination ||
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lng)
  ) {
    return NaN;
  }
  return distanceMetersOnEarth(
    userLocation.coords.latitude,
    userLocation.coords.longitude,
    destination.lat,
    destination.lng,
  );
}

export function hasArrivedAtDestination(
  navigationActive: boolean,
  userLocation: Location.LocationObject | null,
  destination: RouteDestination | null,
): boolean {
  if (!navigationActive) return false;
  const d = distanceToDestinationMeters(userLocation, destination);
  return Number.isFinite(d) && d < ARRIVAL_DISTANCE_METERS;
}
