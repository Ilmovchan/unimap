import log from "loglevel";

function apiBase(): string {
  const raw = process.env.EXPO_PUBLIC_UNIMAP_SERVER_API_LINK;
  return (typeof raw === "string" ? raw.trim() : "").replace(/\/$/, "");
}

/** URL стилю карти через бекенд (проксі MapTiler). */
export function mapStyleUrl(): string {
  const base = apiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }
  return `${base}/map/style.json`;
}
