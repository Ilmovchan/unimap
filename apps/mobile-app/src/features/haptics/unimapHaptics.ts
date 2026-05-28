import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

async function runHaptic(action: () => Promise<void>): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await action();
  } catch {
    // Симулятор / пристрій без Taptic Engine
  }
}

/** QR успішно відскановано. */
export function hapticQrScanSuccess(): void {
  void runHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  );
}

/** Маршрут побудовано. */
export function hapticRouteBuilt(): void {
  void runHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  );
}

/** Користувач прибув до точки призначення. */
export function hapticNavigationArrived(): void {
  void runHaptic(async () => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });
}
