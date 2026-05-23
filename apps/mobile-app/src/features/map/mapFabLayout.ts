import type { EdgeInsets } from "react-native-safe-area-context";

/** Діаметр круглих FAB на карті (узгоджено з LayoutButton circle). */
export const MAP_FAB_SIZE = 56;

/** Відступ FAB від краю екрана знизу / з боків (без safe area). */
export const MAP_FAB_EDGE = 20;

/** Відступ FAB зверху — трохи менший за нижній. */
export const MAP_FAB_EDGE_TOP = 12;

/** Відстань між FAB у вертикальному стеку справа внизу (між колами). */
export const MAP_FAB_STACK_GAP = 24;

const FAB_STACK_STEP = MAP_FAB_SIZE + MAP_FAB_STACK_GAP;

/** `stackIndex`: 0 — внизу, 1 — як QR раніше, 1.5 — між 1 і 2, 2 — найвище. */
export function mapFabStackBottom(
  fabBottom: number,
  stackIndex: number,
): number {
  return fabBottom + stackIndex * FAB_STACK_STEP;
}

export type MapFabInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Єдині відступи з урахуванням safe area — однакові зверху й знизу (як на макеті). */
export function getMapFabInsets(insets: EdgeInsets): MapFabInsets {
  return {
    top: insets.top + MAP_FAB_EDGE_TOP,
    bottom: insets.bottom + MAP_FAB_EDGE,
    left: insets.left + MAP_FAB_EDGE,
    right: insets.right + MAP_FAB_EDGE,
  };
}
