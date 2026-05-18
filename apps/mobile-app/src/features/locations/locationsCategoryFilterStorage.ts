import AsyncStorage from "@react-native-async-storage/async-storage";
import { createDefaultEnabledCategories } from "@/src/features/locations/LocationsCategoryFilter";
import { ALL_LOCATION_LIST_CATEGORY_KEYS } from "@/src/features/locations/groupLocationsByType";
import log from "loglevel";

const STORAGE_KEY = "@unimap/locations_category_filter_v1";

const VALID_KEYS = new Set(ALL_LOCATION_LIST_CATEGORY_KEYS);

function parseStoredKeys(raw: string): Set<string> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const keys = parsed.filter(
    (k): k is string => typeof k === "string" && VALID_KEYS.has(k),
  );
  return new Set(keys);
}

export async function loadEnabledCategoryKeys(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultEnabledCategories();
    const keys = parseStoredKeys(raw);
    if (!keys) return createDefaultEnabledCategories();
    return keys;
  } catch (e) {
    log.warn("[UniMap] locations category filter load failed", e);
    return createDefaultEnabledCategories();
  }
}

export async function saveEnabledCategoryKeys(keys: ReadonlySet<string>): Promise<void> {
  try {
    const ordered = ALL_LOCATION_LIST_CATEGORY_KEYS.filter((k) => keys.has(k));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
  } catch (e) {
    log.warn("[UniMap] locations category filter save failed", e);
  }
}
