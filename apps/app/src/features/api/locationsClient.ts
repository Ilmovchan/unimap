import { formatAddressJsonUkrLine } from "@/src/features/api/addressJsonDisplay";
import log from "loglevel";

/** Елемент з GET /api/locations/:id — «об’єкт» університету. */
export type LocationUniversityObjectDto = {
  id: string;
  name: string;
  type: string;
  typeName: string;
  floor?: number | null;
  roomNumber?: string | null;
  description?: string | null;
};

/** Локація для карти. */
export type LocationMapDto = {
  id: string;
  name: string;
  type?: string | null;
  typeName?: string | null;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  addressJson?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  markerKey?: string | null;
  objects?: LocationUniversityObjectDto[];
  highlightedObjectId?: string | null;
};

export type LocationDetailDto = LocationMapDto;

const CANONICAL_MARKER_KEYS = new Set([
  "building",
  "library",
  "stadium",
  "admin",
  "default",
  "info",
]);

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

function pickFiniteCoord(raw: Record<string, unknown>, ...keys: string[]): number {
  const v = pickRaw(raw, ...keys);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim().replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

function normalizeApiMarkerKey(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) return null;
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower === "uni") return "building";
  if (!CANONICAL_MARKER_KEYS.has(lower)) return null;
  return lower;
}

/** Відображення маркера за технічним кодом типу локації (academic_building, sport_facility, …). */
function markerKeyFromLocationTypeCode(
  code: string | null | undefined,
): string | null {
  const c = (code ?? "").trim().toLowerCase();
  if (!c) return null;
  if (c.includes("library")) return "library";
  if (c.includes("sport") || c.includes("stadium")) return "stadium";
  if (c.includes("admin")) return "admin";
  if (c === "other" || c.includes("misc")) return "default";
  if (c.includes("building") || c.includes("campus") || c.includes("hall"))
    return "building";
  return null;
}

/** Резерв, якщо API не віддав markerKey (узгоджено з `LocationTypeMarkerResolver`). */
export function markerKeyFromLocationTypeTitle(
  title: string | null | undefined,
): string {
  const t = (title ?? "").trim().toLowerCase();
  if (t.includes("бібліотек") || t.includes("library")) return "library";
  if (t.includes("стадіон") || t.includes("stadium") || t.includes("спортив"))
    return "stadium";
  if (t.includes("адмін")) return "admin";
  if (t.includes("інш")) return "default";
  if (
    t.includes("будівл") ||
    t.includes("будивл") ||
    t.includes("building") ||
    t.includes("корпус") ||
    t.includes("гуртожит") ||
    t.includes("навчальн") ||
    t.includes("споруд")
  )
    return "building";
  if (t.includes("приймальн") && t.includes("коміс")) return "info";
  if (t.includes("admission") || t.includes("enrollment office")) return "info";
  return "building";
}

export function resolveMarkerKeyForMap(
  markerKey: string | null | undefined,
  locationTypeCode?: string | null | undefined,
): string {
  const fromApi = normalizeApiMarkerKey(markerKey ?? null);
  if (fromApi) return fromApi;
  const fromCode = markerKeyFromLocationTypeCode(locationTypeCode ?? null);
  if (fromCode) return fromCode;
  return "building";
}

/** Заголовок маркера / картки: назва локації. */
export function locationMapDisplayLabel(loc: LocationMapDto): string {
  const n = loc.name?.trim();
  if (n) return n;
  const line = formatAddressJsonUkrLine(loc.addressJson);
  if (line?.trim()) return line;
  return "Місце на карті";
}

function parseUniversityObjectsFromApi(
  raw: unknown,
): LocationUniversityObjectDto[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: LocationUniversityObjectDto[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const id = String(pickRaw(o, "id", "Id") ?? "").trim();
    if (!id) continue;
    const name = String(pickRaw(o, "name", "Name") ?? "").trim();
    const type = String(pickRaw(o, "type", "Type") ?? "").trim();
    const typeName = String(
      pickRaw(o, "typeName", "TypeName") ?? "",
    ).trim();
    const floorRaw = pickRaw(o, "floor", "Floor");
    let floor: number | null | undefined;
    if (floorRaw === undefined || floorRaw === null) floor = null;
    else if (typeof floorRaw === "number" && Number.isFinite(floorRaw)) floor = floorRaw;
    else if (typeof floorRaw === "string" && floorRaw.trim() !== "") {
      const n = Number(floorRaw.trim());
      floor = Number.isFinite(n) ? n : null;
    } else floor = null;
    const rn = pickRaw(o, "roomNumber", "RoomNumber");
    const roomNumber =
      rn === undefined || rn === null ? null : String(rn).trim() || null;
    const descr = pickRaw(o, "description", "Description");
    const description =
      descr === undefined || descr === null ? null : String(descr);
    out.push({
      id,
      name,
      type,
      typeName,
      floor,
      roomNumber,
      description,
    });
  }
  return out.length ? out : undefined;
}

function normalizeLocationMap(raw: Record<string, unknown>): LocationMapDto {
  const id = String(pickRaw(raw, "id", "Id") ?? "");
  const lat = pickFiniteCoord(
    raw,
    "lat",
    "Lat",
    "latitude",
    "Latitude",
  );
  const lng = pickFiniteCoord(
    raw,
    "lng",
    "Lng",
    "Lon",
    "long",
    "Long",
    "longitude",
    "Longitude",
  );
  const nameDirect = String(pickRaw(raw, "name", "Name") ?? "").trim();
  const addr = pickRaw(raw, "address", "Address");
  const address =
    addr === undefined || addr === null ? null : String(addr).trim() || null;
  const addrJson = pickRaw(raw, "addressJson", "AddressJson");
  const addressJson =
    addrJson === undefined || addrJson === null ? null : String(addrJson);
  const typeNameRaw = pickRaw(raw, "typeName", "TypeName");
  const typeName =
    typeNameRaw === undefined || typeNameRaw === null
      ? null
      : String(typeNameRaw);
  const typeRaw = pickRaw(raw, "type", "Type");
  const type = typeRaw === undefined || typeRaw === null ? null : String(typeRaw);
  const mk = pickRaw(raw, "markerKey", "MarkerKey");
  const markerKeyRaw =
    mk === undefined || mk === null ? null : String(mk).trim() || null;
  const markerKey = resolveMarkerKeyForMap(markerKeyRaw, type);
  const objects = parseUniversityObjectsFromApi(
    pickRaw(raw, "objects", "Objects"),
  );

  const addressLineFallback = (() => {
    const aj = addressJson;
    if (!aj?.trim()) return "";
    return formatAddressJsonUkrLine(aj)?.trim() ?? "";
  })();
  const name =
    nameDirect ||
    addressLineFallback ||
    "Місце на карті";

  const descr = pickRaw(raw, "description", "Description");
  const description =
    descr === undefined || descr === null ? null : String(descr);
  const img = pickRaw(raw, "imageUrl", "ImageUrl");
  const imageUrl =
    img === undefined || img === null ? null : String(img).trim() || null;

  const highlightRaw = pickRaw(
    raw,
    "highlightedObjectId",
    "HighlightedObjectId",
  );
  const highlightedObjectId =
    highlightRaw === undefined || highlightRaw === null
      ? null
      : String(highlightRaw).trim() || null;

  return {
    id,
    name,
    type,
    typeName,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    address,
    addressJson,
    description,
    imageUrl,
    markerKey,
    objects,
    highlightedObjectId,
  };
}

function normalizeLocationDetail(raw: Record<string, unknown>): LocationDetailDto {
  return normalizeLocationMap(raw);
}

const LOCATIONS_PATH = "/locations";

export async function fetchLocations(): Promise<LocationMapDto[]> {
  const base = apiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  const res = await fetch(`${base}${LOCATIONS_PATH}`);
  if (!res.ok) {
    log.warn("[UniMap] GET /locations failed", res.status);
    throw new Error(`UniMap locations: HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("UniMap locations: response is not an array");
  }

  return data.map((item) =>
    normalizeLocationMap(item as Record<string, unknown>),
  );
}

export async function fetchLocationById(
  id: string,
  options?: { highlightObjectId?: string },
): Promise<LocationDetailDto> {
  const base = apiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Location id is empty");
  }

  const qs = new URLSearchParams();
  const h = options?.highlightObjectId?.trim();
  if (h) qs.set("highlightObjectId", h);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetch(
    `${base}${LOCATIONS_PATH}/${encodeURIComponent(trimmed)}${suffix}`,
  );
  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!res.ok) {
    log.warn("[UniMap] GET /locations/:id failed", res.status);
    throw new Error(`UniMap location: HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("UniMap location: invalid response");
  }

  return normalizeLocationDetail(data as Record<string, unknown>);
}
