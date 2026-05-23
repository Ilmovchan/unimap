/** Обрізає пройдену частину маршруту — лінія починається біля поточної позиції користувача. */

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Проєкція точки на відрізок у площині lng/lat (достатньо для коротких сегментів). */
function projectOnSegment(
  lng: number,
  lat: number,
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
): { point: [number, number]; t: number; distanceMeters: number } {
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-18) {
    const d = distanceMeters(lat, lng, lat1, lng1);
    return { point: [lng1, lat1], t: 0, distanceMeters: d };
  }
  let t = ((lng - lng1) * dx + (lat - lat1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const plng = lng1 + t * dx;
  const plat = lat1 + t * dy;
  return {
    point: [plng, plat],
    t,
    distanceMeters: distanceMeters(lat, lng, plat, plng),
  };
}

/**
 * Повертає координати лише «попереду» по маршруту від позиції користувача.
 */
export function trimRouteCoordinatesAheadOfUser(
  coordinates: [number, number][],
  userLng: number,
  userLat: number,
): [number, number][] {
  if (coordinates.length < 2) return coordinates;
  if (!Number.isFinite(userLng) || !Number.isFinite(userLat)) {
    return coordinates;
  }

  let best = {
    segmentIndex: 0,
    point: coordinates[0] as [number, number],
    distanceMeters: Infinity,
  };

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i];
    const [lng2, lat2] = coordinates[i + 1];
    const proj = projectOnSegment(
      userLng,
      userLat,
      lng1,
      lat1,
      lng2,
      lat2,
    );
    if (proj.distanceMeters < best.distanceMeters) {
      best = {
        segmentIndex: i,
        point: proj.point,
        distanceMeters: proj.distanceMeters,
      };
    }
  }

  const out: [number, number][] = [best.point];

  for (let j = best.segmentIndex + 1; j < coordinates.length; j++) {
    const c = coordinates[j];
    const prev = out[out.length - 1];
    if (prev[0] !== c[0] || prev[1] !== c[1]) {
      out.push(c);
    }
  }

  if (out.length < 2 && coordinates.length >= 2) {
    out.push(coordinates[coordinates.length - 1]);
  }

  return out;
}
