import { getUnreadNewsCount, fetchNews } from "@/src/features/news/newsClient";
import * as Notifications from "expo-notifications";
import log from "loglevel";
import { AppState, Platform } from "react-native";

let badgePermissionRequested = false;

async function ensureBadgePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (Platform.OS === "ios" && current.ios?.allowsBadge) return true;

  if (Platform.OS === "android") {
    return true;
  }

  if (badgePermissionRequested) {
    return current.ios?.allowsBadge === true;
  }

  badgePermissionRequested = true;
  const { granted, ios } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: false,
      allowBadge: true,
      allowSound: false,
    },
  });

  return granted || ios?.allowsBadge === true;
}

/** Оновлює червоний badge на іконці застосунку (iOS / підтримувані Android-лаунчери). */
export async function syncNewsAppBadge(unreadCount?: number): Promise<void> {
  if (Platform.OS === "web") return;

  const count =
    unreadCount !== undefined
      ? Math.max(0, unreadCount)
      : await getUnreadNewsCount();
  const badgeCount = Math.min(count, 99);

  if (Platform.OS === "ios") {
    const allowed = await ensureBadgePermission();
    if (!allowed) {
      log.warn("[UniMap] app badge: badge permission not granted");
      return;
    }
  }

  try {
    const ok = await Notifications.setBadgeCountAsync(badgeCount);
    if (!ok && badgeCount > 0) {
      log.warn("[UniMap] app badge: setBadgeCountAsync returned false");
    }
  } catch (e) {
    log.warn("[UniMap] app badge sync failed", e);
  }
}

/** Підтягує новини з API (якщо можливо) і синхронізує badge. */
export async function refreshNewsAppBadge(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await fetchNews();
  } catch (e) {
    log.warn("[UniMap] refreshNewsAppBadge: fetch failed, using cache", e);
  }
  await syncNewsAppBadge();
}

export function subscribeNewsAppBadgeRefresh(): () => void {
  if (Platform.OS === "web") {
    return () => {};
  }

  void refreshNewsAppBadge();

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void refreshNewsAppBadge();
    }
  });

  return () => sub.remove();
}
