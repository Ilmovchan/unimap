import type { LocationUniversityObjectDto } from "@/src/features/api/locationsClient";

/** Менше = вище в списку «Тут знаходяться». */
const RANK_BY_TYPE_CODE: Record<string, number> = {
  faculty: 10,

  department: 20,
  vocational_college: 25,
  professional_college: 25,
  college: 25,
  fakhovy_college: 25,

  deanery: 40,
  dean_office: 40,
  administration: 41,
  admin: 41,
  administrative_unit: 42,
  admission_commission: 43,
  admission: 43,

  classroom: 50,
  auditorium: 50,
  laboratory: 55,
  lab: 55,
  library: 60,
  library_unit: 60,
  museum: 65,
  dormitory: 70,
  sport_object: 80,
  sport: 80,
  sport_facility: 80,
  stadium: 80,
  service: 85,
  other: 90,

  shelter: 1000,
};

type TitleRank = { pattern: RegExp; rank: number };

const RANK_BY_TITLE_UK: TitleRank[] = [
  { pattern: /факультет/i, rank: 10 },
  { pattern: /кафедр/i, rank: 20 },
  { pattern: /фахов.*коледж|коледж/i, rank: 25 },
  { pattern: /деканат/i, rank: 40 },
  { pattern: /адміністрац/i, rank: 41 },
  { pattern: /приймальн.*коміс/i, rank: 43 },
  { pattern: /аудитор/i, rank: 50 },
  { pattern: /лаборатор/i, rank: 55 },
  { pattern: /бібліотек/i, rank: 60 },
  { pattern: /музе/i, rank: 65 },
  { pattern: /гуртожит/i, rank: 70 },
  { pattern: /стадіон|спортивн/i, rank: 80 },
  { pattern: /укритт/i, rank: 1000 },
];

const DEFAULT_RANK = 500;

function sortRankForObject(o: LocationUniversityObjectDto): number {
  const code = o.type?.trim().toLowerCase() ?? "";
  if (code && RANK_BY_TYPE_CODE[code] !== undefined) {
    return RANK_BY_TYPE_CODE[code];
  }

  const title = o.typeName?.trim() ?? "";
  if (title) {
    for (const { pattern, rank } of RANK_BY_TITLE_UK) {
      if (pattern.test(title)) return rank;
    }
  }

  return DEFAULT_RANK;
}

function compareByNameUa(a: LocationUniversityObjectDto, b: LocationUniversityObjectDto): number {
  return a.name.localeCompare(b.name, "uk", { sensitivity: "base" });
}

/** Факультети → адмін → інше → укриття в кінці. */
export function sortUniversityObjectsForDisplay(
  objects: LocationUniversityObjectDto[],
): LocationUniversityObjectDto[] {
  if (objects.length <= 1) return objects;

  return [...objects].sort((a, b) => {
    const rankDiff = sortRankForObject(a) - sortRankForObject(b);
    if (rankDiff !== 0) return rankDiff;
    return compareByNameUa(a, b);
  });
}
