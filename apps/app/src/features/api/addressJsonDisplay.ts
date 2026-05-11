/**
 * Відповідь Nominatim / OpenStreetMap (address.road, address.city тощо) +
 * простий `{ number, street, city }`.
 */

const NUMBER_KEYS = [
  "number",
  "house_number",
  "housenumber",
  "building",
  "buildingnumber",
  "house",
  "номер",
  "num",
];

const STREET_KEYS = [
  "road",
  "street",
  "streetname",
  "street_name",
  "addressline1",
  "addressline",
  "line1",
  "вулиця",
  "vulytsia",
  "pedestrian",
  "path",
];

const CITY_KEYS = [
  "city",
  "town",
  "village",
  "hamlet",
  "locality",
  "municipality",
  "місто",
  "город",
  "gorod",
];

export type ParsedAddressParts = {
  number: string;
  street: string;
  city: string;
};

function asTrimmedString(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/_/g, "");
}

function pickFromObject(obj: Record<string, unknown>, keyList: string[]): string {
  const entryMap = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj)) {
    entryMap.set(normalizeKey(k), v);
  }

  for (const cand of keyList) {
    const nk = normalizeKey(cand);
    if (entryMap.has(nk)) {
      const v = entryMap.get(nk);
      if (v !== null && typeof v === "object" && !Array.isArray(v)) continue;
      const s = asTrimmedString(v);
      if (s) return s;
    }
  }

  const nested =
    (obj.address as Record<string, unknown> | undefined) ??
    (obj.Address as Record<string, unknown> | undefined);
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return pickFromObject(nested, keyList);
  }

  return "";
}

function parseObjectToParts(data: Record<string, unknown>): ParsedAddressParts {
  let street = pickFromObject(data, STREET_KEYS);
  const addrTop = data.address ?? data.Address;
  if (!street && typeof addrTop === "string" && addrTop.trim()) {
    street = addrTop.trim();
  }

  return {
    number: pickFromObject(data, NUMBER_KEYS),
    street,
    city: pickFromObject(data, CITY_KEYS),
  };
}

/** Багато разів вкладені JSON.stringify (рядок у рядку) — типово з БД. */
function unwrapToRecord(raw: string): Record<string, unknown> | null {
  let cur: unknown = raw.trim();
  for (let depth = 0; depth < 10; depth++) {
    if (cur !== null && typeof cur === "object" && !Array.isArray(cur)) {
      return cur as Record<string, unknown>;
    }
    if (typeof cur !== "string") return null;
    const slice = cur.trim();
    if (!slice) return null;
    try {
      cur = JSON.parse(slice);
    } catch {
      return null;
    }
  }
  return null;
}

function isNominatimShape(data: Record<string, unknown>): boolean {
  const addr = data.address;
  if (addr !== null && typeof addr === "object" && !Array.isArray(addr)) {
    const a = addr as Record<string, unknown>;
    if (
      a.road ||
      a.street ||
      a.city ||
      a.town ||
      a.postcode ||
      a.house_number
    )
      return true;
  }
  return (
    data.place_id !== undefined ||
    typeof data.display_name === "string" ||
    typeof data.osm_type === "string"
  );
}

/**
 * Якщо в `road` номер зліва («126 Добровольського», «15/2 вул. …») — відокремити.
 * Поштовий індекс у номер не підставляємо.
 */
function tryLeadingHouseNumberOnStreet(street: string): {
  number: string;
  street: string;
} {
  const s = street.trim();
  const m = s.match(
    /^(\d{1,5}[а-яА-ЯіїєґЇІЄҐa-zA-Z]?)(?:\s*\/\s*\d{1,3})?\s+(.+)$/u,
  );
  if (m?.[1] && m[2]) {
    return { number: m[1], street: m[2].trim() };
  }
  return { number: "", street: s };
}

/** Nominatim: номер будинку (не індекс), дорога (road), місто. */
function parseNominatimToParts(data: Record<string, unknown>): ParsedAddressParts {
  const addr =
    (data.address as Record<string, unknown> | undefined) ??
    {};

  const amenityLabel = asTrimmedString(addr.amenity);
  const nameLabel = asTrimmedString(data.name);

  let number =
    asTrimmedString(addr.house_number) ||
    asTrimmedString(addr.house) ||
    asTrimmedString(addr.building) ||
    "";

  let street =
    asTrimmedString(addr.road) ||
    asTrimmedString(addr.street) ||
    asTrimmedString(addr.pedestrian) ||
    asTrimmedString(addr.path) ||
    "";

  if (!street && typeof data.display_name === "string") {
    const parts = data.display_name.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0];
      if (
        first &&
        first !== amenityLabel &&
        first !== nameLabel
      ) {
        street = first;
      } else if (parts[1]) {
        street = parts[1];
      }
    }
  }

  if (!number && street) {
    const split = tryLeadingHouseNumberOnStreet(street);
    if (split.number) {
      number = split.number;
      street = split.street;
    }
  }

  if (!street && nameLabel && amenityLabel && nameLabel === amenityLabel) {
    /* назва лише установа — дорогу все одно шукаємо нижче */
  }

  const city =
    asTrimmedString(addr.city) ||
    asTrimmedString(addr.town) ||
    asTrimmedString(addr.village) ||
    asTrimmedString(addr.hamlet) ||
    asTrimmedString(addr.municipality) ||
    "";

  return {
    number,
    street: street || nameLabel || amenityLabel,
    city,
  };
}

function hasAnyPart(p: ParsedAddressParts): boolean {
  return Boolean(p.number || p.street || p.city);
}

/**
 * Парсинг addressJson: Nominatim, подвійне кодування, простий об'єкт, сирий текст.
 */
export function parseAddressJson(
  raw: string | null | undefined,
): ParsedAddressParts | null {
  if (!raw || !String(raw).trim()) return null;
  const s = String(raw).trim();

  const fromUnwrap = unwrapToRecord(s);
  if (fromUnwrap) {
    if (isNominatimShape(fromUnwrap)) {
      const n = parseNominatimToParts(fromUnwrap);
      if (hasAnyPart(n)) return n;
    }
    const simple = parseObjectToParts(fromUnwrap);
    if (hasAnyPart(simple)) return simple;
  }

  try {
    const parsed: unknown = JSON.parse(s);
    if (typeof parsed === "string") {
      const inner = unwrapToRecord(parsed);
      if (inner) {
        if (isNominatimShape(inner)) {
          const n = parseNominatimToParts(inner);
          if (hasAnyPart(n)) return n;
        }
        const simple = parseObjectToParts(inner);
        if (hasAnyPart(simple)) return simple;
      }
      const t = parsed.trim();
      if (!t) return null;
      return { number: "", street: t, city: "" };
    }
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const o = parsed as Record<string, unknown>;
      if (isNominatimShape(o)) {
        const n = parseNominatimToParts(o);
        if (hasAnyPart(n)) return n;
      }
      const simple = parseObjectToParts(o);
      if (hasAnyPart(simple)) return simple;
    }
    return null;
  } catch {
    if (!s) return null;
    return { number: "", street: s, city: "" };
  }
}

/** Один рядок: «Номер: …, Вулиця: …, Місто: …». */
export function formatAddressJsonUkrLine(
  raw: string | null | undefined,
): string | null {
  const parts = parseAddressJson(raw);
  if (!parts) return null;
  const n = parts.number || "—";
  const st = parts.street || "—";
  const c = parts.city || "—";
  if (n === "—" && st === "—" && c === "—") return null;
  return `Номер: ${n}, Вулиця: ${st}, Місто: ${c}`;
}
