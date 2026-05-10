import {
  fetchDepartments,
  type DepartmentDto,
} from "@/src/features/api/departmentsClient";
import { globalColors } from "@/src/styles/styles";
import log from "loglevel";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DepartmentsScreen() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await fetchDepartments();
      setDepartments(list);
    } catch {
      setError(
        "Не вдалося завантажити підрозділи. Перевірте доступність UniMap API.",
      );
      log.warn("[UniMap] departments list load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  if (loading && departments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={globalColors.accent} />
        <Text style={styles.loadingHint}>Завантаження…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={departments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={globalColors.accent}
          />
        }
        ListEmptyComponent={
          error ? (
            <Text style={styles.empty}>{error}</Text>
          ) : (
            <Text style={styles.empty}>
              Підрозділів не знайдено. Переконайтеся, що UniMap API доступний і
              в базі даних є записи.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.rowSubtitle}>{item.description}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: globalColors.background,
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  empty: {
    marginTop: 48,
    textAlign: "center",
    color: globalColors.subtitle,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: globalColors.border,
  },
  row: {
    paddingVertical: 14,
    backgroundColor: "transparent",
  },
  rowTitle: {
    fontSize: 16,
    color: globalColors.title,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: globalColors.subtitle,
  },
});
