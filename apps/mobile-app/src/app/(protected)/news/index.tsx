import NewsCard from "@/src/features/news/NewsCard";
import {
  countUnreadNews,
  fetchNews,
  getReadNewsIds,
  markAllNewsRead,
  markNewsRead,
  type NewsItemDto,
} from "@/src/features/news/newsClient";
import { globalColors } from "@/src/styles/styles";
import { useRouter } from "expo-router";
import log from "loglevel";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function NewsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItemDto[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [news, ids] = await Promise.all([fetchNews(), getReadNewsIds()]);
      setItems(news);
      setReadIds(ids);
    } catch (e) {
      log.warn("[UniMap] news screen load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const unreadCount = countUnreadNews(items, readIds);

  const handleSelectNews = useCallback(
    (id: string) => {
      void markNewsRead(id).then(setReadIds);
      router.push(`/news/${encodeURIComponent(id)}`);
    },
    [router],
  );

  const handleMarkAllRead = useCallback(async () => {
    const next = await markAllNewsRead(items);
    setReadIds(next);
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={globalColors.accent} />
        <Text style={styles.loadingHint}>Завантаження…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          tintColor={globalColors.accent}
        />
      }
    >
      {unreadCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleMarkAllRead()}
          style={({ pressed }) => [
            styles.markAll,
            pressed && styles.markAllPressed,
          ]}
        >
          <Text style={styles.markAllText}>
            Позначити всі прочитаними ({unreadCount})
          </Text>
        </Pressable>
      ) : null}

      {items.length === 0 ? (
        <Text style={styles.empty}>Новин поки немає.</Text>
      ) : (
        items.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            unread={!readIds.has(item.id)}
            onPress={() => handleSelectNews(item.id)}
          />
        ))
      )}
    </ScrollView>
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
  markAll: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  markAllPressed: {
    opacity: 0.75,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: globalColors.accent,
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
