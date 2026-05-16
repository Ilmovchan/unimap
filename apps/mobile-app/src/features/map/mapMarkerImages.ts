import type { SymbolLayerStyle } from "@maplibre/maplibre-react-native";

export const SELECTED_MARKER_TARGET_SCALE = 2;
export const MARKER_SELECTION_ANIM_MS = 280;
export const DIMMED_MARKER_OPACITY = 0.38;

export const MARKER_STYLE_TRANSITION = {
  duration: MARKER_SELECTION_ANIM_MS,
  delay: 0,
};

const MARKER_ICON_SIZE: SymbolLayerStyle["iconSize"] = [
  "interpolate",
  ["linear"],
  ["zoom"],
  12,
  0.09,
  16,
  0.125,
  18,
  0.145,
] as SymbolLayerStyle["iconSize"];

function markerIconSizeAtScale(scale: number): SymbolLayerStyle["iconSize"] {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    12,
    0.09 * scale,
    16,
    0.125 * scale,
    18,
    0.145 * scale,
  ] as SymbolLayerStyle["iconSize"];
}

function markerStyle(
  iconImage: SymbolLayerStyle["iconImage"],
  iconSize: SymbolLayerStyle["iconSize"],
  iconOpacity = 1,
): SymbolLayerStyle {
  return {
    iconImage,
    iconSize,
    iconOpacity,
    iconOpacityTransition: MARKER_STYLE_TRANSITION,
    iconAllowOverlap: true,
    iconIgnorePlacement: true,
    iconPitchAlignment: "map",
  };
}

const libraryIcon = require("@/assets/icons/markers/library.png");
const stadiumIcon = require("@/assets/icons/markers/stadium.png");
const buildingIcon = require("@/assets/icons/markers/uni.png");
const dormitoryIcon = require("@/assets/icons/markers/dorm.png");

export function createUnselectedMarkerStyles(dimmed: boolean) {
  const opacity = dimmed ? DIMMED_MARKER_OPACITY : 1;
  return {
    library: markerStyle(libraryIcon, MARKER_ICON_SIZE, opacity),
    stadium: markerStyle(stadiumIcon, MARKER_ICON_SIZE, opacity),
    building: markerStyle(buildingIcon, MARKER_ICON_SIZE, opacity),
    dormitory: markerStyle(dormitoryIcon, MARKER_ICON_SIZE, opacity),
  };
}

export function createSelectedMarkerStyles(scale: number) {
  const iconSize = markerIconSizeAtScale(scale);
  return {
    library: markerStyle(libraryIcon, iconSize),
    stadium: markerStyle(stadiumIcon, iconSize),
    building: markerStyle(buildingIcon, iconSize),
    dormitory: markerStyle(dormitoryIcon, iconSize),
  };
}
