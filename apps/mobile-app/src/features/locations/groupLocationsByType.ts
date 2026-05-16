import type { LocationMapDto } from "@/src/features/api/locationsClient";
import {
  sectionMetaFromLocation,
  type LocationSectionIconName,
} from "./locationTypeSectionMeta";

export type LocationTypeGroup = {
  key: string;
  title: string;
  icon: LocationSectionIconName;
  items: LocationMapDto[];
};

/** Порядок блоків на екрані «Усі відділення». */
const TYPE_GROUP_ORDER = [
  "building",
  "dormitory",
  "library",
  "stadium",
  "other",
] as const;

function typeGroupSortIndex(typeKey: string): number {
  const normalized = typeKey.trim().toLowerCase();
  const idx = TYPE_GROUP_ORDER.indexOf(
    normalized as (typeof TYPE_GROUP_ORDER)[number],
  );
  return idx === -1 ? TYPE_GROUP_ORDER.length : idx;
}

export function groupLocationsByType(
  locations: LocationMapDto[],
): LocationTypeGroup[] {
  const byKey = new Map<string, LocationTypeGroup>();

  for (const loc of locations) {
    const key = loc.type?.trim() || "__other__";
    const meta = sectionMetaFromLocation(loc);

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
    .sort((a, b) => {
      const order = typeGroupSortIndex(a.key) - typeGroupSortIndex(b.key);
      if (order !== 0) return order;
      return a.title.localeCompare(b.title, "uk");
    });
}
