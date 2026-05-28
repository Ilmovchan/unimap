import {
  fetchLocations,
  type LocationMapDto,
} from "@/src/features/api/locationsClient";
import LocationsCategoryFilter, {
  createDefaultEnabledCategories,
} from "@/src/features/locations/LocationsCategoryFilter";
import {
  loadEnabledCategoryKeys,
  saveEnabledCategoryKeys,
} from "@/src/features/locations/locationsCategoryFilterStorage";
import {
  groupLocationsByType,
  type LocationTypeGroup,
} from "@/src/features/locations/groupLocationsByType";
import LocationSummaryCard from "@/src/features/locations/LocationSummaryCard";
import StackBackButton from "@/src/features/navigation/StackBackButton";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import log from "loglevel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

type LocationSection = LocationTypeGroup & { data: LocationMapDto[] };

export default function LocationsScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationMapDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [enabledCategoryKeys, setEnabledCategoryKeys] = useState(
    createDefaultEnabledCategories,
  );
  const filterHydratedRef = useRef(false);
  const userChangedFilterRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadEnabledCategoryKeys().then((keys) => {
      if (cancelled) return;
      if (!userChangedFilterRef.current) {
        setEnabledCategoryKeys(keys);
      }
      filterHydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!filterHydratedRef.current) return;
    void saveEnabledCategoryKeys(enabledCategoryKeys);
  }, [enabledCategoryKeys]);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await fetchLocations();
      setLocations(list);
    } catch {
      setError("Не вдалося завантажити відділення.");
      log.warn("[UniMap] locations list load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const toggleCategoryKey = useCallback((key: string) => {
    userChangedFilterRef.current = true;
    if (!filterHydratedRef.current) {
      filterHydratedRef.current = true;
    }
    setEnabledCategoryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const sections = useMemo<LocationSection[]>(
    () =>
      groupLocationsByType(locations)
        .filter((group) => enabledCategoryKeys.has(group.key))
        .map((group) => ({
          ...group,
          data: group.items,
        })),
    [locations, enabledCategoryKeys],
  );

  const headerFilter = useCallback(
    () => (
      <LocationsCategoryFilter
        open={filterOpen}
        onOpenChange={setFilterOpen}
        enabledKeys={enabledCategoryKeys}
        onToggleKey={toggleCategoryKey}
      />
    ),
    [filterOpen, enabledCategoryKeys, toggleCategoryKey],
  );

  const locationsScreenOptions = useMemo(
    () => ({
      headerLeft: () => <StackBackButton />,
      headerRight: headerFilter,
    }),
    [headerFilter],
  );

  const openOnMap = useCallback(
    (id: string) => {
      router.replace({
        pathname: "/",
        params: { focusLocation: id },
      });
    },
    [router],
  );

  const listEmptyMessage = useMemo(() => {
    if (error) return error;
    if (locations.length > 0 && sections.length === 0) {
      return "Увімкніть хоча б одну категорію у фільтрі.";
    }
    return "Локацій поки немає.";
  }, [error, locations.length, sections.length]);

  if (loading && locations.length === 0) {
    return (
      <>
        <Stack.Screen options={locationsScreenOptions} />
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={globalColors.accent} />
          <Text style={styles.loadingHint}>Завантаження…</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={locationsScreenOptions} />
      <SectionList
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={globalColors.accent}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Ionicons
              name={section.icon}
              size={18}
              color={globalColors.accent}
            />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <LocationSummaryCard
            location={item}
            onPress={() => openOnMap(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{listEmptyMessage}</Text>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: globalColors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: globalColors.background,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
    color: globalColors.subtitle,
  },
  empty: {
    marginTop: 48,
    textAlign: "center",
    color: globalColors.subtitle,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
});
