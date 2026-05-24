import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useQrScanNavigation } from "@/src/features/qr/useQrScanNavigation";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QrScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { handleBarcodeScan, resetScanSession } = useQrScanNavigation();

  useFocusEffect(
    useCallback(() => {
      resetScanSession();
    }, [resetScanSession]),
  );

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={globalColors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>Потрібен доступ до камери</Text>
        <Text style={styles.permissionHint}>
          Дозвольте камеру, щоб сканувати QR-коди на карті кампусу.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => void requestPermission()}
        >
          <Text style={styles.primaryButtonText}>Дозволити камеру</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={goBack}>
          <Text style={styles.secondaryButtonText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => handleBarcodeScan(data)}
      />

      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.closeButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Закрити сканер"
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <View
        style={[styles.hintWrap, { paddingBottom: insets.bottom + 24 }]}
        pointerEvents="none"
      >
        <Text style={styles.hint}>Наведіть камеру на QR-код</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: globalColors.background,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: globalColors.title,
    textAlign: "center",
    marginBottom: 8,
  },
  permissionHint: {
    fontSize: 15,
    color: globalColors.subtitle,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: globalColors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: globalColors.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  hintWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 2,
  },
  hint: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
