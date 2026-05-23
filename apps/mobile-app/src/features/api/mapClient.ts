import { serverApiBase } from "@/src/config/serverApi";
import log from "loglevel";

/** URL стилю карти через бекенд (проксі MapTiler). */
export function mapStyleUrl(): string {
  const base = serverApiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }
  const url = `${base}/map/style.json`;
  if (__DEV__) {
    log.info("[UniMap] mapStyleUrl:", url);
  }
  return url;
}
