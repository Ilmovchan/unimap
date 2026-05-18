import AsyncStorage from "@react-native-async-storage/async-storage";
import log from "loglevel";

export type NewsItemDto = {
  id: string;
  title: string;
  content: string;
  summary: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string | null;
};

const READ_IDS_STORAGE_KEY = "unimap.news.readIds";
const NEWS_CACHE_STORAGE_KEY = "unimap.news.cache";

function apiBase(): string {
  const raw = process.env.EXPO_PUBLIC_UNIMAP_SERVER_API_LINK;
  return (typeof raw === "string" ? raw.trim() : "").replace(/\/$/, "");
}

function pickRaw(
  raw: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k];
  }
  return undefined;
}

function summaryFromContent(content: string, maxLen = 280): string {
  const t = content.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trimEnd()}…`;
}

/** Короткий превʼю-текст для картки списку: кілька слів і «...». */
export function newsCardPreview(text: string, maxWords = 8): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return "";
  const words = normalized.split(" ");
  if (words.length <= maxWords) return normalized;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function normalizeNewsItem(raw: Record<string, unknown>): NewsItemDto | null {
  const id = String(pickRaw(raw, "id", "Id") ?? "").trim();
  if (!id) return null;

  const title = String(pickRaw(raw, "title", "Title") ?? "").trim();
  const content = String(pickRaw(raw, "content", "Content") ?? "").trim();
  const summaryRaw = pickRaw(raw, "summary", "Summary");
  const summary =
    summaryRaw !== undefined && summaryRaw !== null
      ? String(summaryRaw).trim()
      : summaryFromContent(content);

  const createdRaw = pickRaw(raw, "createdAt", "CreatedAt");
  const updatedRaw = pickRaw(raw, "updatedAt", "UpdatedAt");
  const publishedRaw = pickRaw(raw, "publishedAt", "PublishedAt");

  const createdAt =
    createdRaw !== undefined && createdRaw !== null
      ? String(createdRaw)
      : publishedRaw !== undefined && publishedRaw !== null
        ? String(publishedRaw)
        : new Date().toISOString();

  const updatedAt =
    updatedRaw !== undefined && updatedRaw !== null
      ? String(updatedRaw)
      : createdAt;

  const publishedAt =
    publishedRaw !== undefined && publishedRaw !== null
      ? String(publishedRaw)
      : createdAt;

  const img = pickRaw(raw, "imageUrl", "ImageUrl");
  const imageUrl =
    img === undefined || img === null ? null : String(img).trim() || null;

  return {
    id,
    title: title || "Новина",
    content: content || summary || "",
    summary: summary || newsCardPreview(content, 8),
    publishedAt,
    createdAt,
    updatedAt,
    imageUrl,
  };
}

async function readCachedNews(): Promise<NewsItemDto[]> {
  try {
    const raw = await AsyncStorage.getItem(NEWS_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: NewsItemDto[] = [];
    for (const item of parsed) {
      if (typeof item !== "object" || item === null) continue;
      const n = normalizeNewsItem(item as Record<string, unknown>);
      if (n) out.push(n);
    }
    return out;
  } catch (e) {
    log.warn("[UniMap] news cache load failed", e);
    return [];
  }
}

async function writeCachedNews(items: NewsItemDto[]): Promise<void> {
  try {
    await AsyncStorage.setItem(NEWS_CACHE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    log.warn("[UniMap] news cache save failed", e);
  }
}

export async function fetchNews(): Promise<NewsItemDto[]> {
  const base = apiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  const res = await fetch(`${base}/news`);
  if (!res.ok) {
    log.warn("[UniMap] GET /news failed", res.status);
    throw new Error(`UniMap news: HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("UniMap news: response is not an array");
  }

  const items = data
    .map((item) =>
      normalizeNewsItem(item as Record<string, unknown>),
    )
    .filter((n): n is NewsItemDto => n !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  await writeCachedNews(items);
  const readIds = await getReadNewsIds();
  scheduleNewsAppBadgeSync(countUnreadNews(items, readIds));
  return items;
}

export async function findNewsById(id: string): Promise<NewsItemDto | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const cached = await readCachedNews();
  const fromCache = cached.find((n) => n.id === trimmed);
  if (fromCache) return fromCache;

  const list = await fetchNews();
  return list.find((n) => n.id === trimmed) ?? null;
}

export async function getReadNewsIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch (e) {
    log.warn("[UniMap] news read ids load failed", e);
    return new Set();
  }
}

function scheduleNewsAppBadgeSync(unreadCount?: number): void {
  void import("@/src/features/news/newsAppBadge")
    .then(({ syncNewsAppBadge }) => syncNewsAppBadge(unreadCount))
    .catch((e) => log.warn("[UniMap] app badge schedule failed", e));
}

export async function markNewsRead(id: string): Promise<Set<string>> {
  const trimmed = id.trim();
  if (!trimmed) return getReadNewsIds();
  const ids = await getReadNewsIds();
  ids.add(trimmed);
  await AsyncStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify([...ids]));
  const items = await readCachedNews();
  scheduleNewsAppBadgeSync(countUnreadNews(items, ids));
  return ids;
}

export async function markAllNewsRead(items: NewsItemDto[]): Promise<Set<string>> {
  const ids = new Set(items.map((n) => n.id));
  await AsyncStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify([...ids]));
  scheduleNewsAppBadgeSync(0);
  return ids;
}

export function countUnreadNews(
  items: NewsItemDto[],
  readIds: Set<string>,
): number {
  return items.filter((n) => !readIds.has(n.id)).length;
}

/** Лічильник непрочитаних з кешу (без запиту до API). */
export async function getUnreadNewsCount(): Promise<number> {
  const [items, readIds] = await Promise.all([
    readCachedNews(),
    getReadNewsIds(),
  ]);
  return countUnreadNews(items, readIds);
}

export function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatNewsDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
