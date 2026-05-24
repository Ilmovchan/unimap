/**
 * Кластеризація маркерів на карті (GeoJSON cluster у ShapeSource).
 *
 * clusterMaxZoomLevel — до якого цілого зуму точки ще об’єднуються в кружки.
 * Нижче значення → кластери лише при сильному віддаленні; на рівні міста
 * (z≈12–14) залишаються окремі іконки маркерів.
 *
 * clusterRadius — радіус у пікселях (512 ≈ ширина тайла).
 */
export const MAP_CLUSTER_MAX_ZOOM_LEVEL = 12;

export const MAP_CLUSTER_RADIUS = 55;

export const MAP_CLUSTER_MIN_POINTS = 2;

/** maxZoom джерела має бути вище clusterMaxZoom (вимога MapLibre). */
export const MAP_CLUSTER_SOURCE_MAX_ZOOM_LEVEL =
  MAP_CLUSTER_MAX_ZOOM_LEVEL + 2;
