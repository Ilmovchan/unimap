/** Схема deep link з app.json (`scheme`). */
export const UNIMAP_APP_SCHEME = "app";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** app://location/{id} або app://location/{id}/object/{objectId} */
const DEEP_LINK_RE =
  /^(?:app|unimap):\/\/(?:location|l)\/([0-9a-f-]{36})(?:\/(?:object|o)\/([0-9a-f-]{36}))?\/?$/i;

/** location/{id} без схеми (деякі сканери так віддають) */
const PATH_LOCATION_RE =
  /^(?:\/)?(?:location|l)\/([0-9a-f-]{36})(?:\/(?:object|o)\/([0-9a-f-]{36}))?\/?$/i;

export type UniMapQrTarget = {
  locationId: string;
  objectId?: string;
};

function isGuid(value: string): boolean {
  return GUID_RE.test(value.trim());
}

function normalizeScannedRaw(raw: string): string {
  let s = raw.trim().replace(/^\uFEFF/, "").replace(/\0/g, "");
  try {
    s = decodeURIComponent(s);
  } catch {
    // залишаємо як є
  }
  return s.trim();
}

function targetFromGuids(
  locationId: string,
  objectId?: string,
): UniMapQrTarget | null {
  const loc = locationId.trim();
  if (!isGuid(loc)) return null;
  const obj = objectId?.trim();
  if (obj && isGuid(obj)) {
    return { locationId: loc, objectId: obj };
  }
  return { locationId: loc };
}

function parseWithRegex(trimmed: string): UniMapQrTarget | null {
  const deep = DEEP_LINK_RE.exec(trimmed);
  if (deep) {
    return targetFromGuids(deep[1], deep[2]);
  }

  const pathOnly = PATH_LOCATION_RE.exec(trimmed);
  if (pathOnly) {
    return targetFromGuids(pathOnly[1], pathOnly[2]);
  }

  return null;
}

/** Посилання для друку на табличці / стенді. */
export function buildUniMapLocationQrUrl(
  locationId: string,
  objectId?: string,
): string {
  const loc = locationId.trim();
  if (!isGuid(loc)) {
    throw new Error("Invalid location id");
  }
  const base = `${UNIMAP_APP_SCHEME}://location/${loc}`;
  const obj = objectId?.trim();
  if (obj && isGuid(obj)) {
    return `${base}/object/${obj}`;
  }
  return base;
}

/**
 * Розбирає QR з UniMap (deep link або path /location/{id}).
 * Спочатку regex (надійно для app://location/{uuid}), потім URL API.
 */
export function parseUniMapQrPayload(raw: string): UniMapQrTarget | null {
  const trimmed = normalizeScannedRaw(raw);
  if (!trimmed) return null;

  if (isGuid(trimmed)) {
    return { locationId: trimmed };
  }

  const fromRegex = parseWithRegex(trimmed);
  if (fromRegex) return fromRegex;

  try {
    const withScheme = trimmed.includes("://")
      ? trimmed
      : `${UNIMAP_APP_SCHEME}://${trimmed.replace(/^\/+/, "")}`;
    const url = new URL(withScheme);

    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);

    let locationId: string | null = null;
    let objectId: string | undefined;

    // app://location/{uuid} — у RN host часто "location", id у pathname
    if ((host === "location" || host === "l") && segments[0] && isGuid(segments[0])) {
      locationId = segments[0];
      const objSeg = segments[1]?.toLowerCase();
      if (
        (objSeg === "object" || objSeg === "o") &&
        segments[2] &&
        isGuid(segments[2])
      ) {
        objectId = segments[2];
      }
    }

    const locIdx = segments.findIndex(
      (s) => s.toLowerCase() === "location" || s.toLowerCase() === "l",
    );
    if (!locationId && locIdx >= 0 && segments[locIdx + 1] && isGuid(segments[locIdx + 1])) {
      locationId = segments[locIdx + 1];
      const objSeg = segments[locIdx + 2]?.toLowerCase();
      if (
        (objSeg === "object" || objSeg === "o") &&
        segments[locIdx + 3] &&
        isGuid(segments[locIdx + 3])
      ) {
        objectId = segments[locIdx + 3];
      }
    } else if (!locationId && segments.length === 1 && isGuid(segments[0])) {
      locationId = segments[0];
    }

    const qObject =
      url.searchParams.get("object") ??
      url.searchParams.get("objectId") ??
      url.searchParams.get("highlightObjectId");
    if (qObject && isGuid(qObject)) {
      objectId = qObject;
    }

    if (!locationId || !isGuid(locationId)) return null;
    return objectId ? { locationId, objectId } : { locationId };
  } catch {
    return null;
  }
}
