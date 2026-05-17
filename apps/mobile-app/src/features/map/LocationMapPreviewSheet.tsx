import {
  fetchLocationById,
  type LocationDetailDto,
} from "@/src/features/api/locationsClient";
import {
  fetchNavigationRoute,
  type NavigationRouteSummary,
} from "@/src/features/api/navigationClient";
import {
  LocationDetailSections,
  locationCardTitle,
} from "@/src/features/locations/LocationDetailContent";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import log from "loglevel";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMapRouteStore } from "./mapRouteStore";

type Props = {
  locationId: string | null;
  userLocation: Location.LocationObject;
  routeCameraImmersive: boolean;
  onToggleRouteCameraImmersive: () => void;
  onRouteNavigationBack: () => void;
  onDismiss: () => void;
};

/** Не змінюємо кількість snap-пойнтів під час навігації — інакше sheet закривається. */
const SNAP_POINTS: (string | number)[] = ["40%", "94%"];

const ROUTE_REFRESH_EVERY_METERS = 100;

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

function formatDistanceUa(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km >= 10 ? Math.round(km) : km.toFixed(1).replace(".", ",")} км`;
  }
  return `${Math.round(meters)} м`;
}

function formatDurationUa(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} год ${m} хв`;
  if (m > 0) return `${m} хв`;
  return `${s} с`;
}

export default function LocationMapPreviewSheet({
  locationId,
  userLocation,
  routeCameraImmersive,
  onToggleRouteCameraImmersive,
  onRouteNavigationBack,
  onDismiss,
}: Props) {
  const setRouteCoords = useMapRouteStore((s) => s.setRouteFromCoordinates);
  const routeFeature = useMapRouteStore((s) => s.routeFeature);
  const routeSummary = useMapRouteStore((s) => s.routeSummary);

  const insets = useSafeAreaInsets();
  const sheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [detail, setDetail] = useState<LocationDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const lastRouteRefreshAnchorRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const routeRefreshInFlightRef = useRef(false);
  const navTransitionRef = useRef(false);

  const sheetLoc = detail;

  const sheetTitle = useMemo(
    () => (sheetLoc ? locationCardTitle(sheetLoc) : "Місце на карті"),
    [sheetLoc],
  );

  const objectCount = sheetLoc?.objects?.length ?? 0;

  const isNavPanel = Boolean(locationId && routeFeature);

  useEffect(() => {
    if (!locationId) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    void (async () => {
      try {
        const d = await fetchLocationById(locationId);
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (!cancelled) {
          setDetail(null);
          setDetailError(
            e instanceof Error && e.message === "NOT_FOUND"
              ? "Не знайдено."
              : "Не вдалося завантажити.",
          );
          log.warn("[UniMap] sheet location load failed", e);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  useEffect(() => {
    if (locationId) {
      setSheetIndex(0);
    } else {
      setSheetIndex(-1);
    }
  }, [locationId]);

  useEffect(() => {
    if (!isNavPanel) return;
    navTransitionRef.current = true;
    setSheetIndex(0);
    const t = setTimeout(() => {
      navTransitionRef.current = false;
    }, 500);
    return () => clearTimeout(t);
  }, [isNavPanel]);

  useEffect(() => {
    if (!isNavPanel || !detail) {
      lastRouteRefreshAnchorRef.current = null;
      return;
    }

    if (!Number.isFinite(detail.lat) || !Number.isFinite(detail.lng)) {
      return;
    }

    const lat = userLocation.coords.latitude;
    const lng = userLocation.coords.longitude;

    if (lastRouteRefreshAnchorRef.current == null) {
      lastRouteRefreshAnchorRef.current = { latitude: lat, longitude: lng };
      return;
    }

    const anchor = lastRouteRefreshAnchorRef.current;
    const moved = distanceMetersOnEarth(
      anchor.latitude,
      anchor.longitude,
      lat,
      lng,
    );

    if (moved < ROUTE_REFRESH_EVERY_METERS || routeRefreshInFlightRef.current) {
      return;
    }

    routeRefreshInFlightRef.current = true;
    void (async () => {
      try {
        const { coordinates, summary } = await fetchNavigationRoute({
          startLng: lng,
          startLat: lat,
          endLng: detail.lng,
          endLat: detail.lat,
        });
        setRouteCoords(coordinates, summary);
        lastRouteRefreshAnchorRef.current = { latitude: lat, longitude: lng };
      } catch (e) {
        log.warn("[UniMap] route refresh on move failed", e);
      } finally {
        routeRefreshInFlightRef.current = false;
      }
    })();
  }, [isNavPanel, detail, userLocation, setRouteCoords]);

  const handleSheetChange = useCallback(
    (index: number) => {
      setSheetIndex(index);
      if (index === -1 && !navTransitionRef.current) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const expandSheet = useCallback(() => {
    if (isNavPanel) return;
    setSheetIndex(1);
  }, [isNavPanel]);

  const startNavigation = useCallback(() => {
    if (
      !detail ||
      !Number.isFinite(detail.lat) ||
      !Number.isFinite(detail.lng)
    ) {
      return;
    }
    void (async () => {
      setNavLoading(true);
      try {
        const { coordinates, summary } = await fetchNavigationRoute({
          startLng: userLocation.coords.longitude,
          startLat: userLocation.coords.latitude,
          endLng: detail.lng,
          endLat: detail.lat,
        });
        navTransitionRef.current = true;
        setRouteCoords(coordinates, summary);
        setSheetIndex(0);
        setTimeout(() => {
          navTransitionRef.current = false;
        }, 500);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Не вдалося побудувати маршрут.";
        Alert.alert("Маршрут", msg);
      } finally {
        setNavLoading(false);
      }
    })();
  }, [detail, setRouteCoords, userLocation]);

  const scrollBottomPad = Math.max(insets.bottom, 12);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={isNavPanel ? 0 : 0.42}
        pressBehavior={isNavPanel ? "none" : "collapse"}
        enableTouchThrough={isNavPanel}
      />
    ),
    [isNavPanel],
  );

  const navStats: NavigationRouteSummary | null = routeSummary;

  return (
    <BottomSheet
      ref={sheetRef}
      index={sheetIndex}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose={!isNavPanel}
      bottomInset={0}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView
        scrollEnabled={!isNavPanel}
        contentContainerStyle={[
          isNavPanel ? styles.navScrollInner : styles.scrollInner,
          { paddingBottom: scrollBottomPad + (isNavPanel ? 6 : 20) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {isNavPanel ? (
          <>
            <View style={styles.navHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Назад до картки локації"
                hitSlop={10}
                style={({ pressed }) => [
                  styles.navHeaderSide,
                  pressed && styles.navHeaderPressed,
                ]}
                onPress={onRouteNavigationBack}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color={globalColors.title}
                />
              </Pressable>
              <Text style={styles.navHeaderTitle} numberOfLines={1}>
                {sheetLoc ? sheetTitle : "Пункт призначення"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  routeCameraImmersive
                    ? "Звичайний вигляд карти"
                    : "Вигляд ніби з дороги"
                }
                hitSlop={10}
                style={({ pressed }) => [
                  styles.navHeaderSide,
                  styles.navHeaderSideRight,
                  pressed && styles.navHeaderPressed,
                ]}
                onPress={onToggleRouteCameraImmersive}
              >
                <Ionicons
                  name={routeCameraImmersive ? "map-outline" : "navigate"}
                  size={24}
                  color={globalColors.accent}
                />
              </Pressable>
            </View>

            <View style={styles.navStatsRow}>
              <View style={styles.navStatBox}>
                <Ionicons
                  name="analytics-outline"
                  size={20}
                  color={globalColors.icon}
                />
                <Text style={styles.navStatValue}>
                  {formatDistanceUa(navStats?.distanceMeters ?? NaN)}
                </Text>
                <Text style={styles.navStatHint}>відстань</Text>
              </View>
              <View style={styles.navStatDivider} />
              <View style={styles.navStatBox}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={globalColors.icon}
                />
                <Text style={styles.navStatValue}>
                  {formatDurationUa(navStats?.durationSeconds ?? NaN)}
                </Text>
                <Text style={styles.navStatHint}>пішки, орієнтовно</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.sheetMain}>
            <View style={styles.toolbarWrap}>
              <View style={styles.toolbar}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Розгорнути картку локації"
                  style={styles.summaryTap}
                  onPress={expandSheet}
                >
                  <Text style={styles.title} numberOfLines={2}>
                    {sheetTitle}
                    {objectCount > 0 ? (
                      <Text style={styles.objectCount}> ({objectCount})</Text>
                    ) : null}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Побудувати маршрут до об’єкта"
                  hitSlop={12}
                  disabled={navLoading}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.iconButtonPressed,
                  ]}
                  onPress={startNavigation}
                >
                  {navLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={globalColors.navigationFabIcon}
                    />
                  ) : (
                    <Ionicons
                      name="navigate"
                      size={24}
                      color={globalColors.navigationFabIcon}
                    />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.sheetBody}>
              {detailLoading ? (
                <View style={styles.sheetLoading}>
                  <ActivityIndicator
                    size="small"
                    color={globalColors.accent}
                  />
                  <Text style={styles.sheetLoadingText}>Завантаження…</Text>
                </View>
              ) : detailError ? (
                <Text style={styles.sheetError}>{detailError}</Text>
              ) : detail ? (
                <LocationDetailSections
                  location={detail}
                  showHeadline={false}
                />
              ) : null}
            </View>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: globalColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -5 },
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  handleIndicator: {
    backgroundColor: globalColors.border,
    width: 40,
  },
  navScrollInner: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 44,
  },
  navHeaderSide: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navHeaderSideRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  navHeaderPressed: {
    opacity: 0.75,
  },
  navHeaderTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: globalColors.title,
    paddingHorizontal: 6,
  },
  navStatsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: globalColors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: globalColors.border,
    paddingVertical: 14,
  },
  navStatBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  navStatDivider: {
    width: 1,
    backgroundColor: globalColors.border,
    marginVertical: 4,
  },
  navStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: globalColors.title,
    fontVariant: ["tabular-nums"],
  },
  navStatHint: {
    fontSize: 12,
    color: globalColors.subtitle,
    textAlign: "center",
  },
  sheetMain: {
    width: "100%",
  },
  toolbarWrap: {
    paddingBottom: 4,
  },
  sheetBody: {
    marginTop: 12,
    paddingTop: 4,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: globalColors.navigationFabBg,
    borderWidth: 1,
    borderColor: globalColors.navigationFabBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    opacity: 0.88,
  },
  summaryTap: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.2,
  },
  objectCount: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: globalColors.subtitle,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetLoading: {
    alignItems: "center",
    paddingVertical: 24,
  },
  sheetLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: globalColors.subtitle,
  },
  sheetError: {
    fontSize: 15,
    color: globalColors.subtitle,
    paddingVertical: 16,
    textAlign: "center",
  },
});
