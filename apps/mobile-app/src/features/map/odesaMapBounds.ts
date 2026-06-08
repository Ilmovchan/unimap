/**
 * Межі камери та зум — Одеська область (maxBounds, min/max zoom).
 * followUserLocation не вмикається автоматично — карту можна рухати пальцем.
 */
export const MAP_CAMERA_LIMITS_ENABLED = true;

/**
 * Межі карти — Одеська область із невеликим запасом для країв екрана.
 * lng: захід → схід, lat: південь → північ.
 */
export const ODESA_MAX_BOUNDS = {
  ne: [31.35, 48.35] as [number, number],
  sw: [28.0, 45.1] as [number, number],
};

/** Мінімальний зум (чим менше — тим далі «віддалення»). */
export const MAP_MIN_ZOOM_LEVEL = 7;
export const MAP_MAX_ZOOM_LEVEL = 20;
