import {
  resolveMarkerKeyForMap,
  type LocationMapDto,
} from "@/src/features/api/locationsClient";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type LocationSectionIconName = ComponentProps<typeof Ionicons>["name"];

const TITLE_UK_BY_TYPE_CODE: Record<string, string> = {
  stadium: "Стадіони",
  dormitory: "Гуртожитки",
  library: "Бібліотеки",
  building: "Навчальні корпуси",
  other: "Інше",
};

const ICON_BY_TYPE_CODE: Record<string, LocationSectionIconName> = {
  stadium: "football-outline",
  dormitory: "home-outline",
  library: "library-outline",
  building: "business-outline",
  other: "ellipsis-horizontal-circle-outline",
};

const CYRILLIC_RE = /[а-яіїєґ]/i;

/** Українська назва блоку: спочатку title_uk з API, інакше — за кодом типу. */
export function locationTypeTitleUk(
  typeCode: string | null | undefined,
  typeName: string | null | undefined,
): string {
  const name = typeName?.trim() ?? "";
  if (name && CYRILLIC_RE.test(name)) return name;

  const code = typeCode?.trim().toLowerCase() ?? "";
  if (code && TITLE_UK_BY_TYPE_CODE[code]) return TITLE_UK_BY_TYPE_CODE[code];

  return "Інше";
}

export function iconForLocationTypeCode(
  typeCode: string | null | undefined,
  markerKey: string,
): LocationSectionIconName {
  const code = typeCode?.trim().toLowerCase() ?? "";
  if (code && ICON_BY_TYPE_CODE[code]) return ICON_BY_TYPE_CODE[code];
  return iconForLocationSection(markerKey);
}

export function markerKeyForLocation(loc: LocationMapDto): string {
  return resolveMarkerKeyForMap(loc.markerKey, loc.type);
}

export function iconForLocationSection(
  markerKey: string,
): LocationSectionIconName {
  switch (markerKey) {
    case "library":
      return "library-outline";
    case "stadium":
      return "football-outline";
    case "admin":
      return "briefcase-outline";
    case "info":
      return "information-circle-outline";
    case "default":
      return "ellipsis-horizontal-circle-outline";
    case "building":
    default:
      return "business-outline";
  }
}

export function sectionMetaFromLocation(loc: LocationMapDto): {
  title: string;
  markerKey: string;
  icon: LocationSectionIconName;
} {
  const markerKey = markerKeyForLocation(loc);
  return {
    title: locationTypeTitleUk(loc.type, loc.typeName),
    markerKey,
    icon: iconForLocationTypeCode(loc.type, markerKey),
  };
}
