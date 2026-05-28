import { hapticQrScanSuccess } from "@/src/features/haptics/unimapHaptics";
import { locationDeepLinkHref } from "@/src/features/qr/locationDeepLinkHref";
import { parseUniMapQrPayload } from "@/src/features/qr/unimapQrPayload";
import { QR_SCAN_REDIRECT_ENABLED } from "@/src/features/qr/qrScanningEnabled";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import { Alert } from "react-native";

const SCAN_COOLDOWN_MS = 2500;

export function useQrScanNavigation() {
  const router = useRouter();
  const lastScanAtRef = useRef(0);
  const handledRef = useRef(false);

  const resetScanSession = useCallback(() => {
    handledRef.current = false;
    lastScanAtRef.current = 0;
  }, []);

  const handleBarcodeScan = useCallback(
    (data: string) => {
      if (!QR_SCAN_REDIRECT_ENABLED) return;

      const now = Date.now();
      if (handledRef.current) return;
      if (now - lastScanAtRef.current < SCAN_COOLDOWN_MS) return;

      const target = parseUniMapQrPayload(data);
      if (!target) {
        lastScanAtRef.current = now;
        Alert.alert(
          "QR-код",
          "Це не код UniMap. Відскануйте табличку біля локації кампусу.",
        );
        return;
      }

      handledRef.current = true;
      lastScanAtRef.current = now;
      hapticQrScanSuccess();

      router.replace(locationDeepLinkHref(target.locationId, target.objectId));
    },
    [router],
  );

  return { handleBarcodeScan, resetScanSession };
}
