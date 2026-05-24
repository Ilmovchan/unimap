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
import LocationDetailSectionsSkeleton from "@/src/features/locations/LocationDetailSectionsSkeleton";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import log from "loglevel";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  highlightObjectId?: string | null;
  userLocation: Location.LocationObject;
  hasArrived: boolean;
  routeCameraImmersive: boolean;
  onToggleRouteCameraImmersive: () => void;
  onRouteNavigationBack: () => void;
  onDismiss: () => void;
};

/** Той самий «компактний» snap, що index 0 у картці локації. */
const SHEET_SNAP_COMPACT = "40%";
const PREVIEW_SNAP_POINTS: (string | number)[] = [SHEET_SNAP_COMPACT, "94%"];

const NAV_HEADER_BLOCK_HEIGHT = 44;
const NAV_HEADER_MARGIN_BOTTOM = 10;
const NAV_SHEET_HANDLE_HEIGHT = 10;

/** Індекси snap під час маршруту: 0 — лише title-шапка, 1 — як preview index 0 (40%). */
const NAV_SHEET_COLLAPSED_INDEX = 0;
const NAV_SHEET_EXPANDED_INDEX = 1;

/** Мінімум: ручка + один рядок заголовка + safe area. */
function navCollapsedSnapHeight(bottomPad: number): number {
  return 10 + NAV_HEADER_BLOCK_HEIGHT + bottomPad;
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
  highlightObjectId = null,
  userLocation,
  hasArrived,
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
  const [previewSheetIndex, setPreviewSheetIndex] = useState(-1);
  const [navSheetIndex, setNavSheetIndex] = useState(NAV_SHEET_EXPANDED_INDEX);
  const [detail, setDetail] = useState<LocationDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const navTransitionRef = useRef(false);
  /** Користувач сам згорнув navsheet (інакше при відкритті тримаємо розгорнутим). */
  const userCollapsedNavRef = useRef(false);
  /** Ігноруємо початковий onChange(-1) при монтуванні з index 0. */
  const sheetReadyRef = useRef(false);

  const sheetLoc = detail;

  const sheetTitle = useMemo(
    () => (sheetLoc ? locationCardTitle(sheetLoc) : "Місце на карті"),
    [sheetLoc],
  );

  const objectCount = sheetLoc?.objects?.length ?? 0;

  const isNavPanel = Boolean(locationId && routeFeature);

  const scrollBottomPad = Math.max(insets.bottom, 12);

  const snapPoints = useMemo((): (string | number)[] => {
    if (isNavPanel) {
      return [navCollapsedSnapHeight(scrollBottomPad), SHEET_SNAP_COMPACT];
    }
    return PREVIEW_SNAP_POINTS;
  }, [isNavPanel, scrollBottomPad]);

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
        const d = await fetchLocationById(locationId, {
          highlightObjectId: highlightObjectId ?? undefined,
        });
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
  }, [locationId, highlightObjectId]);

  useLayoutEffect(() => {
    if (!locationId) {
      sheetReadyRef.current = false;
      setPreviewSheetIndex(-1);
      setNavSheetIndex(NAV_SHEET_COLLAPSED_INDEX);
      sheetRef.current?.close();
      return;
    }

    navTransitionRef.current = true;
    sheetReadyRef.current = false;
    userCollapsedNavRef.current = false;

    const targetIndex = isNavPanel ? NAV_SHEET_EXPANDED_INDEX : 0;
    if (isNavPanel) {
      setNavSheetIndex(NAV_SHEET_EXPANDED_INDEX);
    } else {
      setPreviewSheetIndex(0);
    }

    let frame = 0;
    let attempts = 0;
    const trySnap = () => {
      if (sheetRef.current) {
        sheetRef.current.snapToIndex(targetIndex);
        sheetReadyRef.current = true;
        return;
      }
      if (attempts++ < 12) {
        frame = requestAnimationFrame(trySnap);
      } else {
        sheetReadyRef.current = true;
      }
    };
    frame = requestAnimationFrame(trySnap);

    const t = setTimeout(() => {
      navTransitionRef.current = false;
    }, 480);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(t);
    };
  }, [locationId, isNavPanel]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (
        isNavPanel &&
        index === NAV_SHEET_COLLAPSED_INDEX &&
        !navTransitionRef.current
      ) {
        userCollapsedNavRef.current = true;
      } else if (isNavPanel && index >= NAV_SHEET_EXPANDED_INDEX) {
        userCollapsedNavRef.current = false;
      }

      if (isNavPanel) {
        setNavSheetIndex(index);
      } else {
        setPreviewSheetIndex(index);
      }
      if (
        navTransitionRef.current &&
        isNavPanel &&
        index < NAV_SHEET_EXPANDED_INDEX
      ) {
        requestAnimationFrame(() => {
          sheetRef.current?.snapToIndex(NAV_SHEET_EXPANDED_INDEX);
        });
        return;
      }
      if (
        index === -1 &&
        !navTransitionRef.current &&
        sheetReadyRef.current
      ) {
        onDismiss();
      }
    },
    [isNavPanel, onDismiss],
  );

  const expandSheet = useCallback(() => {
    if (isNavPanel) return;
    setPreviewSheetIndex(1);
    sheetRef.current?.snapToIndex(1);
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
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Не вдалося побудувати маршрут.";
        Alert.alert("Маршрут", msg);
      } finally {
        setNavLoading(false);
      }
    })();
  }, [detail, setRouteCoords, userLocation]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={isNavPanel ? NAV_SHEET_COLLAPSED_INDEX : 0}
        appearsOnIndex={isNavPanel ? NAV_SHEET_EXPANDED_INDEX : 1}
        opacity={isNavPanel ? 0 : 0.42}
        pressBehavior={isNavPanel ? "none" : "collapse"}
        enableTouchThrough={isNavPanel}
      />
    ),
    [isNavPanel],
  );

  const navStats: NavigationRouteSummary | null = routeSummary;

  /** Висота блоку під шапкою в розгорнутому navsheet (40% екрана). */
  const navExpandedBodyMinHeight = useMemo(() => {
    const sheetH = Dimensions.get("window").height * 0.4;
    return Math.max(
      120,
      sheetH -
        NAV_SHEET_HANDLE_HEIGHT -
        NAV_HEADER_BLOCK_HEIGHT -
        NAV_HEADER_MARGIN_BOTTOM -
        scrollBottomPad -
        24,
    );
  }, [scrollBottomPad]);

  if (!locationId) {
    return null;
  }

  const sheetModeKey = isNavPanel ? "nav" : "preview";
  const bottomSheetIndex = isNavPanel
    ? navSheetIndex < 0
      ? NAV_SHEET_EXPANDED_INDEX
      : !userCollapsedNavRef.current &&
          navSheetIndex < NAV_SHEET_EXPANDED_INDEX
        ? NAV_SHEET_EXPANDED_INDEX
        : navSheetIndex
    : previewSheetIndex < 0
      ? 0
      : previewSheetIndex;

  return (
    <BottomSheet
      key={sheetModeKey}
      ref={sheetRef}
      index={bottomSheetIndex}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={!isNavPanel}
      enableOverDrag={false}
      animateOnMount={false}
      bottomInset={0}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {isNavPanel ? (
        <BottomSheetView
          style={[
            styles.navScrollInner,
            bottomSheetIndex >= NAV_SHEET_EXPANDED_INDEX && {
              paddingBottom: scrollBottomPad + 6,
              minHeight:
                NAV_SHEET_HANDLE_HEIGHT +
                NAV_HEADER_BLOCK_HEIGHT +
                NAV_HEADER_MARGIN_BOTTOM +
                navExpandedBodyMinHeight +
                scrollBottomPad +
                6,
            },
          ]}
        >
          <View
            style={[
              styles.navPanelRoot,
              bottomSheetIndex >= NAV_SHEET_EXPANDED_INDEX &&
                styles.navPanelRootExpanded,
            ]}
          >
            <View
              style={[
                styles.navHeader,
                bottomSheetIndex >= NAV_SHEET_EXPANDED_INDEX &&
                  styles.navHeaderExpanded,
              ]}
            >
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
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Розгорнути панель маршруту"
                style={styles.navHeaderTitleTap}
                onPress={() => {
                  setNavSheetIndex(NAV_SHEET_EXPANDED_INDEX);
                  sheetRef.current?.snapToIndex(NAV_SHEET_EXPANDED_INDEX);
                }}
              >
                <Text style={styles.navHeaderTitle} numberOfLines={1}>
                  {sheetLoc ? sheetTitle : "Пункт призначення"}
                </Text>
              </Pressable>
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

            {bottomSheetIndex >= NAV_SHEET_EXPANDED_INDEX ? (
              hasArrived ? (
                <View
                  style={[
                    styles.navBody,
                    { minHeight: navExpandedBodyMinHeight },
                  ]}
                >
                  <View style={styles.navArrivedContent}>
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={globalColors.accent}
                    />
                    <Text style={styles.navArrivedTitle}>
                      Ви прибули до місця
                    </Text>
                    <Text style={styles.navArrivedHint} numberOfLines={2}>
                      {sheetLoc ? sheetTitle : "Пункт призначення"}
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.navBody,
                    { minHeight: navExpandedBodyMinHeight },
                  ]}
                >
                  <View style={styles.navStatRow}>
                    <View style={styles.navStatRowLead}>
                      <Ionicons
                        name="navigate-outline"
                        size={20}
                        color={globalColors.icon}
                      />
                      <Text style={styles.navStatRowLabel}>Відстань</Text>
                    </View>
                    <Text style={styles.navStatRowValue}>
                      {formatDistanceUa(navStats?.distanceMeters ?? NaN)}
                    </Text>
                  </View>
                  <View style={styles.navStatRowLine} />
                  <View style={styles.navStatRow}>
                    <View style={styles.navStatRowLead}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={globalColors.icon}
                      />
                      <Text style={styles.navStatRowLabel}>
                        Час пішки, орієнтовно
                      </Text>
                    </View>
                    <Text style={styles.navStatRowValue}>
                      {formatDurationUa(navStats?.durationSeconds ?? NaN)}
                    </Text>
                  </View>
                </View>
              )
            ) : null}
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.scrollInner,
            { paddingBottom: scrollBottomPad + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
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
              {detailError ? (
                <Text style={styles.sheetError}>{detailError}</Text>
              ) : null}
              {detail ? (
                <LocationDetailSections
                  location={detail}
                  showHeadline={false}
                  loadPhotosImmediately
                />
              ) : detailLoading ? (
                <LocationDetailSectionsSkeleton />
              ) : null}
            </View>
          </View>
        </BottomSheetScrollView>
      )}
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
    paddingTop: 0,
  },
  navPanelRoot: {
    width: "100%",
  },
  navPanelRootExpanded: {
    flex: 1,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    minHeight: NAV_HEADER_BLOCK_HEIGHT,
    paddingVertical: 2,
  },
  navHeaderExpanded: {
    marginBottom: NAV_HEADER_MARGIN_BOTTOM,
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
  navHeaderTitleTap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  navHeaderTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: globalColors.title,
  },
  navBody: {
    flex: 1,
    justifyContent: "space-evenly",
    backgroundColor: globalColors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: globalColors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  navStatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 52,
  },
  navStatRowLead: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navStatRowLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
  navStatRowValue: {
    fontSize: 22,
    fontWeight: "700",
    color: globalColors.title,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  navStatRowLine: {
    height: 1,
    backgroundColor: globalColors.border,
  },
  navArrivedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  navArrivedTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: globalColors.title,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  navArrivedHint: {
    fontSize: 15,
    lineHeight: 22,
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
    marginTop: 8,
    paddingTop: 0,
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
