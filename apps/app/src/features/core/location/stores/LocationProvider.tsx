import {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";
import * as Location from "expo-location";
import log from "loglevel";

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
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (pos) => {
          setLocation(pos);
        },
      );
    })();

    return () => {
      sub?.remove();
      console.log("location.unmount");
    };
  }, []);

  return (
    <LocationContext.Provider value={{ location }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
