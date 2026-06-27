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
export function hostFromMetroScript(): string | null {
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

function isIosSimulator(): boolean {
  const ios = Constants.platform as { ios?: { simulator?: boolean } } | null;
  return Platform.OS === "ios" && ios?.ios?.simulator === true;
}

function replaceUrlHostname(url: string, hostname: string): string {
  try {
    const parsed = new URL(url.includes("://") ? url : `http://${url}`);
    parsed.hostname = hostname;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function shouldRewriteApiHostForDev(url: string): boolean {
  try {
    const parsed = new URL(url.includes("://") ? url : `http://${url}`);
    return (
      /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/** LAN-IP Mac/PC для фізичного телефона або Android-емулятора в dev. */
function resolveDevLanHost(): string | null {
  if (!__DEV__) return null;
  if (isIosSimulator()) return null;

  const fromScript = hostFromMetroScript();
  if (fromScript) return fromScript;

  const fromEnv = process.env.EXPO_PUBLIC_UNIMAP_SERVER_DEV_HOST?.trim();
  if (fromEnv) return fromEnv;

  const fromExpoConfig = hostFromUri(Constants.expoConfig?.hostUri);
  if (fromExpoConfig) return fromExpoConfig;

  if (Platform.OS === "android") return ANDROID_EMULATOR_HOST;

  return null;
}

function rewriteLocalhostForDev(url: string): string {
  if (!__DEV__) return url;

  const host = resolveDevLanHost();
  if (!host) return url;

  return url
    .replace(/\/\/localhost(?=[:/])/gi, `//${host}`)
    .replace(/\/\/127\.0\.0\.1(?=[:/])/gi, `//${host}`);
}

/** У dev підміняє localhost / застарілий LAN-IP у URL картинок і API. */
export function rewriteDevServerHost(
  url: string | null | undefined,
): string | null {
  if (url === undefined || url === null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let result = rewriteLocalhostForDev(trimmed);

  if (!__DEV__) return result;

  const devHost = resolveDevLanHost();
  if (!devHost) return result;

  // Лише URL фото — не чіпаємо тайли карти та інші ресурси.
  if (!result.includes("/api/pictures/") && !result.includes("/pictures/")) {
    return result;
  }

  try {
    const parsed = new URL(result.includes("://") ? result : `http://${result}`);
    const isLoopback = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);
    const isStaleLan =
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) &&
      parsed.hostname !== devHost;

    if (isLoopback || isStaleLan) {
      parsed.hostname = devHost;
      result = parsed.toString();
    }
  } catch {
    // залишаємо як є
  }

  return result;
}

/**
 * Базовий URL API. У dev підлаштовує хост під симулятор / IP Metro,
 * щоб не ламатися через застарілий IP у .env.
 */
export function serverApiBase(): string {
  const raw = process.env.EXPO_PUBLIC_UNIMAP_SERVER_API_LINK;
  const trimmed = (typeof raw === "string" ? raw.trim() : "").replace(/\/$/, "");
  if (!trimmed) return "";

  if (__DEV__) {
    if (!shouldRewriteApiHostForDev(trimmed)) {
      return trimmed;
    }

    if (isIosSimulator()) {
      return replaceUrlHostname(trimmed, "localhost");
    }

    // IP з Metro (актуальна мережа) важливіший за застарілий .env
    const metroHost = hostFromMetroScript();
    const envHost = process.env.EXPO_PUBLIC_UNIMAP_SERVER_DEV_HOST?.trim();
    const devHost = metroHost || envHost;
    if (devHost) {
      return rewriteLocalhostForDev(replaceUrlHostname(trimmed, devHost));
    }
  }

  return rewriteLocalhostForDev(trimmed);
}
