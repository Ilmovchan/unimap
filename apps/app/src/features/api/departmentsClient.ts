import log from "loglevel";

export type DepartmentDto = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string | null;
  addressJson?: string | null;
};

export type DepartmentDetailDto = DepartmentDto & {
  addressJson?: string | null;
  iconUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

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

function normalizeDepartment(raw: Record<string, unknown>): DepartmentDto {
  const id = String(pickRaw(raw, "id", "Id") ?? "");
  const lat = Number(pickRaw(raw, "lat", "Lat"));
  const lng = Number(pickRaw(raw, "lng", "Lng", "Lon", "long", "Long"));
  const title = String(pickRaw(raw, "title", "Title") ?? "");
  const desc = pickRaw(raw, "description", "Description");
  const description =
    desc === undefined || desc === null ? null : String(desc);
  const addr = pickRaw(raw, "addressJson", "AddressJson");
  const addressJson =
    addr === undefined || addr === null ? null : String(addr);

  return { id, lat, lng, title, description, addressJson };
}

function normalizeDepartmentDetail(
  raw: Record<string, unknown>,
): DepartmentDetailDto {
  const base = normalizeDepartment(raw);
  const addr = pickRaw(raw, "addressJson", "AddressJson");
  const addressJson =
    addr === undefined || addr === null ? null : String(addr);
  const icon = pickRaw(raw, "iconUrl", "IconUrl");
  const iconUrl =
    icon === undefined || icon === null ? null : String(icon);
  const ca = pickRaw(raw, "createdAt", "CreatedAt");
  const createdAt =
    ca === undefined || ca === null ? null : String(ca);
  const ua = pickRaw(raw, "updatedAt", "UpdatedAt");
  const updatedAt =
    ua === undefined || ua === null ? null : String(ua);

  return {
    ...base,
    addressJson,
    iconUrl,
    createdAt,
    updatedAt,
  };
}

export async function fetchDepartments(): Promise<DepartmentDto[]> {
  const base = apiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  const res = await fetch(`${base}/departments`);
  if (!res.ok) {
    log.warn("[UniMap] GET /departments failed", res.status);
    throw new Error(`UniMap departments: HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("UniMap departments: response is not an array");
  }

  return data.map((item) =>
    normalizeDepartment(item as Record<string, unknown>),
  );
}

export async function fetchDepartmentById(
  id: string,
): Promise<DepartmentDetailDto> {
  const base = apiBase();
  if (!base) {
    log.warn("[UniMap] EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
    throw new Error("EXPO_PUBLIC_UNIMAP_SERVER_API_LINK is not set");
  }

  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Department id is empty");
  }

  const res = await fetch(
    `${base}/departments/${encodeURIComponent(trimmed)}`,
  );
  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!res.ok) {
    log.warn("[UniMap] GET /departments/:id failed", res.status);
    throw new Error(`UniMap department: HTTP ${res.status}`);
  }

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("UniMap department: invalid response");
  }

  return normalizeDepartmentDetail(data as Record<string, unknown>);
}
