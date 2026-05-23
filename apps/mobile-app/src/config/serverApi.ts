import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

/** Loopback хоста на Android-емуляторі. */
const ANDROID_EMULATOR_HOST = "10.0.2.2";

function hostFromUri(uri: string | undefined): string | null {
  if (!uri) return null;
  const host = uri.split(":")[0]?.trim();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

/** IP Mac/PC з URL Metro-бандла (напр. http://192.168.0.108:8081/...). */
function hostFromMetroScript(): string | null {
  try {
    const constants = NativeModules.SourceCode?.getConstants?.() as
      | { scriptURL?: string }
      | undefined;
    const scriptURL = constants?.scriptURL;
    if (!scriptURL) return null;
    return hostFromUri(new URL(scriptURL).host);
  } catch {
    return null;
  }
}

function resolveAndroidDevHost(): string {
  const fromEnv = process.env.EXPO_PUBLIC_UNIMAP_SERVER_DEV_HOST?.trim();
  if (fromEnv) return fromEnv;

  const fromExpoConfig = hostFromUri(Constants.expoConfig?.hostUri);
  if (fromExpoConfig) return fromExpoConfig;

  const fromScript = hostFromMetroScript();
  if (fromScript) return fromScript;

  return ANDROID_EMULATOR_HOST;
}

function rewriteLocalhostForAndroid(url: string): string {
  if (!url || Platform.OS !== "android") return url;
  if (!/localhost|127\.0\.0\.1/i.test(url)) return url;

  const host = resolveAndroidDevHost();
  return url
    .replace(/\/\/localhost(?=[:/])/gi, `//${host}`)
    .replace(/\/\/127\.0\.0\.1(?=[:/])/gi, `//${host}`);
}

/** Підміняє localhost у будь-якому URL (фото, стиль карти тощо) на Android у dev. */
export function rewriteDevServerHost(
  url: string | null | undefined,
): string | null {
  if (url === undefined || url === null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return rewriteLocalhostForAndroid(trimmed);
}

/** Базовий URL API без завершального слеша. */
export function serverApiBase(): string {
  const raw = process.env.EXPO_PUBLIC_UNIMAP_SERVER_API_LINK;
  const trimmed = (typeof raw === "string" ? raw.trim() : "").replace(/\/$/, "");
  return rewriteLocalhostForAndroid(trimmed);
}
