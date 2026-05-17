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

const POSTCODE_KEYS = [
  "postcode",
  "postalcode",
  "postal_code",
  "zip",
  "zipcode",
  "індекс",
  "index",
];

const STATE_KEYS = [
  "state",
  "region",
  "county",
  "state_district",
  "oblast",
  "область",
  "обл",
];

const COUNTRY_KEYS = [
  "country",
  "country_name",
  "країна",
  "countrycode",
];

export type ParsedAddressParts = {
  number: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
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
    state: pickFromObject(data, STATE_KEYS),
    country: pickFromObject(data, COUNTRY_KEYS),
    postcode: pickFromObject(data, POSTCODE_KEYS),
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
    state:
      asTrimmedString(addr.state) ||
      asTrimmedString(addr.region) ||
      asTrimmedString(addr.state_district) ||
      "",
    country: asTrimmedString(addr.country),
    postcode: asTrimmedString(addr.postcode),
  };
}

function hasAnyPart(p: ParsedAddressParts): boolean {
  return Boolean(
    p.number || p.street || p.city || p.state || p.country || p.postcode,
  );
}

/** Нормалізація слова типу вулиці для порівняння (без крапки в кінці). */
function streetTypeTokenKey(word: string): string {
  return word.trim().toLowerCase().replace(/\.$/, "");
}

/** Усі варіанти написання типу, які прибираємо з назви вулиці. */
const STREET_TYPE_TOKENS = new Set([
  "вулиця",
  "вул",
  "бульвар",
  "бульв",
  "проспект",
  "просп",
  "провулок",
  "пров",
  "площа",
  "пл",
  "набережна",
  "наб",
  "шосе",
  "алея",
  "ал",
]);

const STREET_TYPE_DETECT: { test: RegExp; prefix: string }[] = [
  { test: /бульвар|бульв\.?/iu, prefix: "бульв." },
  { test: /проспект|просп\.?/iu, prefix: "просп." },
  { test: /провулок|пров\.?/iu, prefix: "пров." },
  { test: /площа|пл\.?/iu, prefix: "пл." },
  { test: /набережна|наб\.?/iu, prefix: "наб." },
  { test: /шосе/iu, prefix: "шосе" },
  { test: /вулиця|вул\.?/iu, prefix: "вул." },
];

/** Прибирає всі слова типу вулиці (повні й скорочення) — \b не працює з кирилицею. */
function stripStreetTypeWords(street: string): string {
  const words = street.trim().split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !STREET_TYPE_TOKENS.has(streetTypeTokenKey(w)));
  return kept.join(" ").trim();
}

/** Скорочення типу вулиці + назва без дубля типу. */
function streetTitlePrefixAndName(street: string): { prefix: string; name: string } {
  const raw = street.trim();
  const haystack = raw;
  let prefix = "вул.";

  for (const { test, prefix: p } of STREET_TYPE_DETECT) {
    if (test.test(haystack)) {
      prefix = p;
      break;
    }
  }

  const name = stripStreetTypeWords(raw);
  return { prefix, name };
}

/** «вул. Добровольского 126/1» */
function formatStreetSegment(street: string, number: string): string | null {
  const { prefix, name } = streetTitlePrefixAndName(street);
  const num = number.trim();
  if (!name && !num) return null;
  if (!name) return `${prefix} ${num}`;
  if (!num) return `${prefix} ${name}`;
  return `${prefix} ${name} ${num}`;
}

function formatCitySegment(city: string): string | null {
  const c = city.trim();
  if (!c) return null;
  if (/^м\.?\s/iu.test(c)) return c;
  return `м. ${c}`;
}

function formatPostcodeSegment(postcode: string): string | null {
  const p = postcode.trim();
  return p || null;
}

function formatStateSegment(state: string): string | null {
  let s = state.trim();
  if (!s) return null;
  if (/обл\.?$/iu.test(s)) return s.replace(/\s+/g, " ");
  if (/область$/iu.test(s)) {
    return s.replace(/\s*область\s*$/iu, " обл.").trim();
  }
  if (/oblast$/iu.test(s)) {
    return s.replace(/\s*oblast\s*$/iu, " обл.").trim();
  }
  return `${s} обл.`;
}

function formatCountrySegment(country: string): string | null {
  const c = country.trim();
  return c || null;
}

/** Короткий заголовок: «бульв. Французький 123», «вул. Довженка 9а». */
function formatShortTitleFromParts(parts: ParsedAddressParts): string | null {
  return formatStreetSegment(parts.street, parts.number);
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
      return {
        number: "",
        street: t,
        city: "",
        state: "",
        country: "",
        postcode: "",
      };
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
    return {
      number: "",
      street: s,
      city: "",
      state: "",
      country: "",
      postcode: "",
    };
  }
}

function formatFullLineFromParts(parts: ParsedAddressParts): string | null {
  const segments: string[] = [];
  const streetLine = formatStreetSegment(parts.street, parts.number);
  if (streetLine) segments.push(streetLine);

  const cityLine = formatCitySegment(parts.city);
  if (cityLine) segments.push(cityLine);

  const stateLine = formatStateSegment(parts.state);
  if (stateLine) segments.push(stateLine);

  const countryLine = formatCountrySegment(parts.country);
  if (countryLine) segments.push(countryLine);

  const postcodeLine = formatPostcodeSegment(parts.postcode);
  if (postcodeLine) segments.push(postcodeLine);

  if (segments.length === 0) return null;
  return segments.join(", ");
}

/** Короткий заголовок з addressJson: «Французький бульвар 123». */
export function formatAddressJsonShortTitle(
  raw: string | null | undefined,
): string | null {
  const parts = parseAddressJson(raw);
  if (!parts) return null;
  return formatShortTitleFromParts(parts);
}

/** Повна адреса: «вул. …, м. …, … обл., Україна, індекс». */
export function formatAddressJsonFullLine(
  raw: string | null | undefined,
): string | null {
  const parts = parseAddressJson(raw);
  if (!parts) return null;
  return formatFullLineFromParts(parts);
}

/** Один рядок: «вул. Добровольского 126/1, м. Одеса, 65111». */
export function formatAddressJsonUkrLine(
  raw: string | null | undefined,
): string | null {
  const parts = parseAddressJson(raw);
  if (!parts) return null;

  const segments: string[] = [];
  const streetLine = formatStreetSegment(parts.street, parts.number);
  if (streetLine) segments.push(streetLine);

  const cityLine = formatCitySegment(parts.city);
  if (cityLine) segments.push(cityLine);

  const postcodeLine = formatPostcodeSegment(parts.postcode);
  if (postcodeLine) segments.push(postcodeLine);

  if (segments.length === 0) return null;
  return segments.join(", ");
}
