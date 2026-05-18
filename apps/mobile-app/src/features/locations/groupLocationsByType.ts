import {
  resolveMarkerKeyForMap,
  type LocationMapDto,
} from "@/src/features/api/locationsClient";
import type { LocationSectionIconName } from "./locationTypeSectionMeta";

export type LocationTypeGroup = {
  key: string;
  title: string;
  icon: LocationSectionIconName;
  items: LocationMapDto[];
};

const OTHER_GROUP_KEY = "__other__";

type ListGroupDef = {
  key: string;
  title: string;
  icon: LocationSectionIconName;
  order: number;
};

/** Порядок на екрані: корпуси → фахові коледжі → гуртожитки → інше. */
const LIST_GROUPS: ListGroupDef[] = [
  {
    key: "building",
    title: "Навчальні корпуси",
    icon: "business-outline",
    order: 0,
  },
  {
    key: "college",
    title: "Фахові коледжі",
    icon: "school-outline",
    order: 1,
  },
  {
    key: "dormitory",
    title: "Гуртожитки",
    icon: "home-outline",
    order: 2,
  },
  {
    key: OTHER_GROUP_KEY,
    title: "Інше",
    icon: "ellipsis-horizontal-circle-outline",
    order: 3,
  },
];

export const LOCATION_LIST_CATEGORIES: ReadonlyArray<{
  key: string;
  title: string;
  icon: LocationSectionIconName;
}> = LIST_GROUPS.map(({ key, title, icon }) => ({ key, title, icon }));

export const ALL_LOCATION_LIST_CATEGORY_KEYS = LIST_GROUPS.map((c) => c.key);

const COLLEGE_TYPE_CODE_RE =
  /college|коледж|fakhov|фахов|vocational|professional/;

const COLLEGE_TYPE_NAME_RE = /коледж|college|фахов/i;

function typeCode(loc: LocationMapDto): string {
  return (loc.type ?? "").trim().toLowerCase();
}

function typeName(loc: LocationMapDto): string {
  return (loc.typeName ?? "").trim().toLowerCase();
}

function mapMarker(loc: LocationMapDto): string {
  return resolveMarkerKeyForMap(loc.markerKey, loc.type);
}

function isCollege(loc: LocationMapDto): boolean {
  if (mapMarker(loc) === "college") return true;
  const code = typeCode(loc);
  if (code && COLLEGE_TYPE_CODE_RE.test(code)) return true;
  const name = typeName(loc);
  if (name && COLLEGE_TYPE_NAME_RE.test(name)) return true;
  const rawMarker = (loc.markerKey ?? "").trim().toLowerCase();
  if (rawMarker.includes("college") || rawMarker.includes("коледж")) return true;
  return false;
}

function isBuilding(loc: LocationMapDto): boolean {
  const marker = mapMarker(loc);
  if (marker === "building") return true;
  const code = typeCode(loc);
  return (
    code === "building" ||
    code.includes("building") ||
    code === "uni"
  );
}

function isDormitory(loc: LocationMapDto): boolean {
  if (mapMarker(loc) === "dormitory") return true;
  const code = typeCode(loc);
  return code === "dormitory" || code.includes("dorm");
}

function listGroupKeyForLocation(loc: LocationMapDto): string {
  if (isCollege(loc)) return "college";
  if (isBuilding(loc)) return "building";
  if (isDormitory(loc)) return "dormitory";
  return OTHER_GROUP_KEY;
}

function metaForListGroup(key: string): Pick<LocationTypeGroup, "title" | "icon"> {
  const def = LIST_GROUPS.find((g) => g.key === key);
  return def
    ? { title: def.title, icon: def.icon }
    : { title: "Інше", icon: "ellipsis-horizontal-circle-outline" };
}

function sortIndexForGroup(key: string): number {
  const def = LIST_GROUPS.find((g) => g.key === key);
  return def?.order ?? LIST_GROUPS.length;
}

export function groupLocationsByType(
  locations: LocationMapDto[],
): LocationTypeGroup[] {
  const byKey = new Map<string, LocationTypeGroup>();

  for (const loc of locations) {
    const key = listGroupKeyForLocation(loc);
    const meta = metaForListGroup(key);

    let group = byKey.get(key);
    if (!group) {
      group = { key, title: meta.title, icon: meta.icon, items: [] };
      byKey.set(key, group);
    }
    group.items.push(loc);
  }

  return [...byKey.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "uk"),
      ),
    }))
    .sort((a, b) => sortIndexForGroup(a.key) - sortIndexForGroup(b.key));
}
