import {
  Camera,
  CameraRef,
  MapView,
  MarkerView,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { View } from "react-native";
import Marker from "./components/Marker";

export type MapMarkerPoint = {
  id: string;
  lat: number;
  lng: number;
};

type Props = {
  location: Location.LocationObject;
  markers: MapMarkerPoint[];
  cameraRef: React.RefObject<CameraRef | null>;
  onMarkerPress?: (id: string) => void;
};

const Map = ({ location, markers, cameraRef, onMarkerPress }: Props) => {
  const apiUrl = process.env.EXPO_PUBLIC_MAP_RENDER_API_LINK;

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
                location?.coords.longitude,
                location?.coords.latitude,
              ],
              zoomLevel: 14,
              pitch: 0,
              animationMode: "moveTo",
            }}
            followUserLocation={true}
            ref={cameraRef}
          />
        )}

        {markers.map((m) => (
          <MarkerView key={m.id} coordinate={[m.lng, m.lat]}>
            <Marker
              selected={false}
              onPress={() => {
                onMarkerPress?.(m.id);
              }}
            />
          </MarkerView>
        ))}
      </MapView>
    </View>
  );
};

export default Map;
