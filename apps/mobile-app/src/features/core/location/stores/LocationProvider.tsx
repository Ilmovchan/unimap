import {
  useState,
  useEffect,
  useRef,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";
import * as Location from "expo-location";
import log from "loglevel";

/** Мінімальний крок (м), після якого пишемо лог про рух користувача. */
const MOVEMENT_LOG_EVERY_METERS = 10;

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

function logUserMovementIfNeeded(
  pos: Location.LocationObject,
  logAnchorRef: React.MutableRefObject<{ lat: number; lng: number } | null>,
  movementStartedRef: React.MutableRefObject<boolean>,
): void {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const anchor = logAnchorRef.current;
  if (!anchor) {
    logAnchorRef.current = { lat, lng };
    return;
  }

  const movedMeters = distanceMetersOnEarth(anchor.lat, anchor.lng, lat, lng);
  if (movedMeters < MOVEMENT_LOG_EVERY_METERS) return;

  if (!movementStartedRef.current) {
    log.info("[UniMap] user movement started", {
      distanceMeters: Math.round(movedMeters),
      latitude: lat,
      longitude: lng,
    });
    movementStartedRef.current = true;
  } else {
    log.info("[UniMap] user moved", {
      distanceMeters: Math.round(movedMeters),
      latitude: lat,
      longitude: lng,
    });
  }

  logAnchorRef.current = { lat, lng };
}

type LocationState = {
  location: Location.LocationObject | null;
};

export const LocationContext = createContext<LocationState>({
  location: null,
});

export const LocationProvider = ({ children }: PropsWithChildren) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const logAnchorRef = useRef<{ lat: number; lng: number } | null>(null);
  const movementStartedRef = useRef(false);

  //subscribe to location changes
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        log.error("permissions.grant.fail");
        return;
      }

      log.info("tracking location...");
      const initial = await Location.getLastKnownPositionAsync();
      if (initial) {
        setLocation(initial);
        logAnchorRef.current = {
          lat: initial.coords.latitude,
          lng: initial.coords.longitude,
        };
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (pos) => {
          logUserMovementIfNeeded(pos, logAnchorRef, movementStartedRef);
          setLocation(pos);
        },
      );
    })();

    return () => {
      sub?.remove();
      logAnchorRef.current = null;
      movementStartedRef.current = false;
      log.debug("[UniMap] location tracking stopped");
    };
  }, []);

  return (
    <LocationContext.Provider value={{ location }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
