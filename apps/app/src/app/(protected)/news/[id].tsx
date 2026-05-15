import {
  findNewsById,
  formatNewsDateTime,
  markNewsRead,
  type NewsItemDto,
} from "@/src/features/news/newsClient";
import { newsArticleStyles as article } from "@/src/features/news/newsArticleStyles";
import { globalColors } from "@/src/styles/styles";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import log from "loglevel";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function newsIdParam(raw: string | string[] | undefined): string {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
    return raw[0];
  }
  return "";
}

export default function NewsDetailScreen() {
  const { id: idRaw } = useLocalSearchParams<{ id?: string | string[] }>();
  const newsId = newsIdParam(idRaw);

  const [item, setItem] = useState<NewsItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!newsId) {
      setError("Невірне посилання на новину.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const found = await findNewsById(newsId);
      if (!found) {
        setItem(null);
        setError("Новину не знайдено.");
        return;
      }
      setItem(found);
      await markNewsRead(found.id);
    } catch (e) {
      log.warn("[UniMap] news detail load failed", e);
      setError("Не вдалося завантажити новину.");
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={globalColors.accent} />
        <Text style={styles.loadingHint}>Завантаження…</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Новину не знайдено."}</Text>
      </View>
    );
  }

  const imageUrl = item.imageUrl?.trim() || null;
  const createdLine = formatNewsDateTime(item.createdAt);
  const updatedLine = formatNewsDateTime(item.updatedAt);
  const showUpdated =
    item.updatedAt &&
    item.createdAt &&
    new Date(item.updatedAt).getTime() !==
      new Date(item.createdAt).getTime();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={article.article}>
        <Text style={article.title}>{item.title}</Text>

        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={article.hero}
            contentFit="cover"
            accessibilityLabel={item.title}
          />
        ) : null}

        <Text style={article.body}>{item.content.trim()}</Text>
      </View>

      {createdLine || (showUpdated && updatedLine) ? (
        <View style={article.metaCard}>
          {createdLine ? (
            <View style={article.metaRow}>
              <Text style={article.metaLabel}>Створено</Text>
              <Text style={article.metaValue}>{createdLine}</Text>
            </View>
          ) : null}
          {showUpdated && updatedLine ? (
            <View style={article.metaRow}>
              <Text style={article.metaLabel}>Оновлено</Text>
              <Text style={article.metaValue}>{updatedLine}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: globalColors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: globalColors.background,
    paddingHorizontal: 24,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
    color: globalColors.subtitle,
  },
  error: {
    textAlign: "center",
    color: globalColors.subtitle,
    fontSize: 15,
    lineHeight: 22,
  },
});
