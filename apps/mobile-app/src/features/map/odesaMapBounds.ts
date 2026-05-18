/**
 * Межі карти — міські кордони Одеси (без області та приморських сіл).
 * lng: захід → схід, lat: південь → північ.
 */
export const ODESA_MAX_BOUNDS = {
  ne: [30.88, 46.55] as [number, number],
  sw: [30.58, 46.41] as [number, number],
};

export const MAP_MIN_ZOOM_LEVEL = 10;
export const MAP_MAX_ZOOM_LEVEL = 20;
