import { requireOptionalNativeModule } from "expo-modules-core";

/** Чи зібраний dev client з expo-camera (після `npx expo run:ios`). */
export function isExpoCameraAvailable(): boolean {
  return requireOptionalNativeModule("ExpoCamera") != null;
}
