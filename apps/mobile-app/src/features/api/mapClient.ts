import { rewriteDevServerHost, serverApiBase } from "@/src/config/serverApi";
import log from "loglevel";

export type MapStyleSpec = Record<string, unknown>;

function mapStyleEndpoint(): string {
  const base = serverApiBase();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }
  return `${base}/map/style.json`;
}

/** URL стилю (лише для логів / діагностики). */
export function mapStyleUrl(): string {
  const url = mapStyleEndpoint();
  if (__DEV__) {
    log.info("[UniMap] mapStyleUrl:", url);
  }
  return url;
}

function isStyleUrlString(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) ||
    /localhost|127\.0\.0\.1/i.test(value)
  );
}

/** Підміняє localhost лише в URL-рядках стилю (не обходить увесь JSON без потреби). */
function rewriteStyleResourceUrls(style: unknown): MapStyleSpec {
  if (style === null || typeof style !== "object" || Array.isArray(style)) {
    return {};
  }

  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      if (!isStyleUrlString(value)) return value;
      return rewriteDevServerHost(value) ?? value;
    }
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value)) {
        out[key] = walk(child);
      }
      return out;
    }
    return value;
  };

  return walk(style) as MapStyleSpec;
}

let cachedMapStyle: MapStyleSpec | null = null;

/**
 * Завантажує стиль карти з бекенду (`GET /api/map/style.json`).
 * Сервер лишає проксі MapTiler; клієнт отримує готовий JSON і передає його в MapLibre.
 */
export async function fetchMapStyle(): Promise<MapStyleSpec> {
  if (cachedMapStyle) return cachedMapStyle;

  const url = rewriteDevServerHost(mapStyleEndpoint());
  if (!url) {
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  if (__DEV__) {
    log.info("[UniMap] fetchMapStyle:", url);
  }

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const snippet = (await res.text()).slice(0, 200);
    log.warn("[UniMap] map style fetch failed", res.status, snippet);
    throw new Error(
      `Стиль карти: HTTP ${res.status}. Запустіть API: dotnet run --project api`,
    );
  }

  const json: unknown = await res.json();
  cachedMapStyle = rewriteStyleResourceUrls(json);
  return cachedMapStyle;
}
