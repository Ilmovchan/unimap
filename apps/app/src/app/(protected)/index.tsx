import type { DepartmentDto } from "@/src/features/api/departmentsClient";
import { fetchDepartments } from "@/src/features/api/departmentsClient";
import { useLocation } from "@/src/features/core/location/stores/LocationProvider";
import Map, {
  focusCameraLikeNavigateButton,
  focusCameraRouteFirstPerson,
  focusCameraToRoutePath,
  useMapRouteStore,
  type MapMarkerPoint,
} from "@/src/features/map/";
import DepartmentMapPreviewSheet from "@/src/features/map/DepartmentMapPreviewSheet";
import LayoutButton from "@/src/features/map/components/LayoutButton";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { CameraRef } from "@maplibre/maplibre-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import log from "loglevel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function focusDepartmentParam(
  raw: string | string[] | undefined,
): string | undefined {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
    return raw[0];
  }
  return undefined;
}

export default function MapScreen() {
  const router = useRouter();
  const { focusDepartment: focusDepartmentRaw } = useLocalSearchParams<{
    focusDepartment?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef | null>(null);
  const location = useLocation().location;
  const [markers, setMarkers] = useState<MapMarkerPoint[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  /** Перший кадр false — щоб Camera застосував maxBounds (обмеження @maplibre при follow одразу). */
  const [cameraFollowUser, setCameraFollowUser] = useState(false);

  useEffect(() => {
    setCameraFollowUser(true);
  }, []);
  const routeFeature = useMapRouteStore((s) => s.routeFeature);
  const clearRoute = useMapRouteStore((s) => s.clearRoute);
  const [routeCameraImmersive, setRouteCameraImmersive] = useState(false);
  const locationRef = useRef(location);
  locationRef.current = location;
  const hadRouteForCameraRef = useRef(false);
  const prevRouteCameraImmersiveRef = useRef(routeCameraImmersive);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchDepartments();
        if (cancelled) return;

        const next: MapMarkerPoint[] = list
          .filter(
            (d) =>
              d.id &&
              Number.isFinite(d.lat) &&
              Number.isFinite(d.lng),
          )
          .map((d) => ({
            id: d.id,
            lat: d.lat,
            lng: d.lng,
          }));

        setMarkers(next);
        setDepartments(list);
      } catch (e) {
        log.warn("[UniMap] map markers load failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const focusId = focusDepartmentParam(focusDepartmentRaw);
    if (!focusId) return;

    const dept = departments.find((d) => d.id === focusId);
    if (
      !dept ||
      !Number.isFinite(dept.lat) ||
      !Number.isFinite(dept.lng)
    ) {
      return;
    }

    const lng = dept.lng;
    const lat = dept.lat;

    clearRoute();
    setRouteCameraImmersive(false);
    setSelectedDepartmentId(focusId);
    setCameraFollowUser(false);
    router.setParams({ focusDepartment: undefined });

    /** Після `followUserLocation={false}` на карті — інакше нативний follow перебиває setCamera. */
    const runFocus = (attempt: number) => {
      InteractionManager.runAfterInteractions(() => {
        if (!cameraRef.current && attempt < 12) {
          setTimeout(() => runFocus(attempt + 1), 48);
          return;
        }
        focusCameraLikeNavigateButton(
          cameraRef,
          [lng, lat],
          "tapSingleMarker",
        );
      });
    };

    setTimeout(() => runFocus(0), 0);
  }, [focusDepartmentRaw, departments, clearRoute, router]);

  useEffect(() => {
    const coords = routeFeature?.geometry?.coordinates;
    const hasRoute = Boolean(coords && coords.length >= 2);

    if (!hasRoute) {
      setRouteCameraImmersive(false);
      hadRouteForCameraRef.current = false;
      prevRouteCameraImmersiveRef.current = false;
      return;
    }

    const loc = locationRef.current;
    if (!loc) return;

    const path = coords as [number, number][];
    const immersiveToggled =
      prevRouteCameraImmersiveRef.current !== routeCameraImmersive;
    prevRouteCameraImmersiveRef.current = routeCameraImmersive;

    const isFirstFit = !hadRouteForCameraRef.current;
    hadRouteForCameraRef.current = true;

    /** Оновлення полілінії при русі не повинно зривати кадр — лише перший показ і перемикач 3D. */
    if (!isFirstFit && !immersiveToggled) {
      return;
    }

    if (routeCameraImmersive) {
      setCameraFollowUser(false);
      focusCameraRouteFirstPerson(cameraRef, [
        loc.coords.longitude,
        loc.coords.latitude,
      ], path);
    } else {
      setCameraFollowUser(false);
      focusCameraToRoutePath(cameraRef, path);
    }
  }, [routeFeature, routeCameraImmersive]);

  /** Закрити маршрут і sheet, плавно показати обраний підрозділ на карті. */
  const handleRouteNavigationBack = useCallback(() => {
    const deptId = selectedDepartmentId;
    const dept =
      deptId == null
        ? undefined
        : departments.find((d) => d.id === deptId);

    clearRoute();
    setRouteCameraImmersive(false);
    setSelectedDepartmentId(null);

    if (
      !dept ||
      !Number.isFinite(dept.lat) ||
      !Number.isFinite(dept.lng)
    ) {
      setCameraFollowUser(true);
      const loc = locationRef.current;
      if (loc) {
        focusCameraLikeNavigateButton(
          cameraRef,
          [loc.coords.longitude, loc.coords.latitude],
          "followUserLocation",
        );
      }
      return;
    }

    setCameraFollowUser(false);
    const lng = dept.lng;
    const lat = dept.lat;

    const runFocus = (attempt: number) => {
      InteractionManager.runAfterInteractions(() => {
        if (!cameraRef.current && attempt < 12) {
          setTimeout(() => runFocus(attempt + 1), 48);
          return;
        }
        focusCameraLikeNavigateButton(
          cameraRef,
          [lng, lat],
          "tapSingleMarker",
        );
      });
    };

    setTimeout(() => runFocus(0), 0);
  }, [clearRoute, departments, selectedDepartmentId]);

  const handleSheetClosed = useCallback(() => {
    if (useMapRouteStore.getState().routeFeature) {
      clearRoute();
      setRouteCameraImmersive(false);
      setCameraFollowUser(true);
      const loc = locationRef.current;
      if (loc) {
        focusCameraLikeNavigateButton(
          cameraRef,
          [loc.coords.longitude, loc.coords.latitude],
          "followUserLocation",
        );
      }
    }
    setSelectedDepartmentId(null);
  }, [clearRoute]);

  const toggleRouteCameraImmersive = useCallback(() => {
    setRouteCameraImmersive((v) => !v);
  }, []);

  const mapMarkers = useMemo(() => {
    const coords = routeFeature?.geometry?.coordinates;
    const routeActive = Boolean(coords && coords.length >= 2);
    if (!routeActive) return markers;
    if (!selectedDepartmentId) return [];
    return markers.filter((m) => m.id === selectedDepartmentId);
  }, [markers, routeFeature, selectedDepartmentId]);

  if (!location) return null;

  return (
    <View style={{ flex: 1 }}>
      <Map
        location={location}
        markers={mapMarkers}
        cameraRef={cameraRef}
        followUserLocation={cameraFollowUser}
        onStopFollowingUser={() => setCameraFollowUser(false)}
        routeFeature={routeFeature}
        onMarkerPress={(departmentId) => {
          clearRoute();
          setSelectedDepartmentId(departmentId);
        }}
      />

      <View style={styles.sheetLayer} pointerEvents="box-none">
        <DepartmentMapPreviewSheet
          departmentId={selectedDepartmentId}
          departments={departments}
          userLocation={location}
          routeCameraImmersive={routeCameraImmersive}
          onToggleRouteCameraImmersive={toggleRouteCameraImmersive}
          onRouteNavigationBack={handleRouteNavigationBack}
          onDismiss={handleSheetClosed}
        />
      </View>

      <LayoutButton
        style={{
          top: insets.top + 12,
          left: 16,
          zIndex: 9999,
        }}
        label="Підрозділи"
        icon={
          <Ionicons
            size={22}
            name="school-outline"
            color={globalColors.navigationFabIcon}
          />
        }
        accessibilityLabel="Підрозділи: відкрити список"
        onPress={() => router.push("/departments")}
      />

      <LayoutButton
        style={{
          bottom: insets.bottom + 24,
          right: 20,
          zIndex: 9999,
        }}
        icon={
          <Ionicons
            size={26}
            name="navigate"
            color={globalColors.navigationFabIcon}
          />
        }
        accessibilityLabel="Показати мене на мапі"
        onPress={() => {
          setCameraFollowUser(true);
          focusCameraLikeNavigateButton(cameraRef, [
            location.coords.longitude,
            location.coords.latitude,
          ]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12000,
    elevation: 12000,
  },
});
