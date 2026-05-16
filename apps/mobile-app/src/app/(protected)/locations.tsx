import {
  fetchLocations,
  type LocationMapDto,
} from "@/src/features/api/locationsClient";
import {
  groupLocationsByType,
  type LocationTypeGroup,
} from "@/src/features/locations/groupLocationsByType";
import LocationSummaryCard from "@/src/features/locations/LocationSummaryCard";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import log from "loglevel";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const sections = useMemo<LocationSection[]>(
    () =>
      groupLocationsByType(locations).map((group) => ({
        ...group,
        data: group.items,
      })),
    [locations],
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

  if (loading && locations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={globalColors.accent} />
        <Text style={styles.loadingHint}>Завантаження…</Text>
      </View>
    );
  }

  return (
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
        error ? (
          <Text style={styles.empty}>{error}</Text>
        ) : (
          <Text style={styles.empty}>Локацій поки немає.</Text>
        )
      }
    />
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
