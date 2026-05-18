import type { ComponentProps } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type UniversityObjectIconName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

/** Єдиний розмір іконок типів об’єктів у списках і модалках. */
export const UNIVERSITY_OBJECT_ICON_SIZE = 24;

const DEFAULT_OBJECT_ICON: UniversityObjectIconName = "dots-horizontal-circle";

/** Іконки за кодом типу (`university_object_type.code`). */
const ICON_BY_OBJECT_TYPE: Record<string, UniversityObjectIconName> = {
  administration: "account-tie",
  admin: "account-tie",
  administrative_unit: "account-tie",

  admission_commission: "account-check",
  admission: "account-check",

  classroom: "school",
  auditorium: "school",

  deanery: "folder-account",
  dean_office: "folder-account",

  department: "account-group",

  dormitory: "home-city",

  faculty: "flask",

  garden: "leaf",

  vocational_college: "school",
  professional_college: "school",
  college: "school",
  fakhovy_college: "school",

  laboratory: "test-tube",
  lab: "test-tube",

  library: "book-open-page-variant",
  library_unit: "book-open-page-variant",

  museum: "bank",

  other: "dots-horizontal-circle",

  shelter: "shield-home",

  sport_object: "dumbbell",
  sport: "dumbbell",
  sport_facility: "dumbbell",

  stadium: "stadium",
};

type TitleHint = { pattern: RegExp; icon: UniversityObjectIconName };

const ICON_BY_TITLE_UK: TitleHint[] = [
  { pattern: /адміністрац/i, icon: "account-tie" },
  { pattern: /приймальн.*коміс/i, icon: "account-check" },
  { pattern: /аудитор/i, icon: "school" },
  { pattern: /деканат/i, icon: "folder-account" },
  { pattern: /кафедр/i, icon: "account-group" },
  { pattern: /гуртожит/i, icon: "home-city" },
  { pattern: /факультет/i, icon: "flask" },
  { pattern: /фахов.*коледж|коледж/i, icon: "school" },
  { pattern: /лаборатор/i, icon: "test-tube" },
  { pattern: /бібліотек/i, icon: "book-open-page-variant" },
  { pattern: /музе/i, icon: "bank" },
  { pattern: /укритт/i, icon: "shield-home" },
  { pattern: /стадіон/i, icon: "stadium" },
  { pattern: /спортивн/i, icon: "dumbbell" },
  { pattern: /сад|парк|сквер|garden|ботанічн/i, icon: "leaf" },
  { pattern: /\bінше\b/i, icon: "dots-horizontal-circle" },
];

export function iconForUniversityObjectType(
  typeCode: string | null | undefined,
  typeName?: string | null | undefined,
): UniversityObjectIconName {
  const code = typeCode?.trim().toLowerCase() ?? "";
  if (code && ICON_BY_OBJECT_TYPE[code]) return ICON_BY_OBJECT_TYPE[code];

  const title = typeName?.trim() ?? "";
  if (title) {
    for (const { pattern, icon } of ICON_BY_TITLE_UK) {
      if (pattern.test(title)) return icon;
    }
  }

  return DEFAULT_OBJECT_ICON;
}
