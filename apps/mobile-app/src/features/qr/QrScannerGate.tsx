import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Suspense, lazy, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isExpoCameraAvailable } from "./qrCameraNative";
const QrScannerScreen = lazy(() => import("./QrScannerScreen"));

function NativeCameraMissing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.centered, { paddingTop: insets.top }]}>
      <Pressable
        style={styles.backRow}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Назад"
      >
        <Ionicons name="chevron-back" size={28} color={globalColors.title} />
      </Pressable>
      <View style={styles.centeredBody}>
        <Text style={styles.permissionTitle}>Потрібна перезбірка застосунку</Text>
        <Text style={styles.permissionHint}>
          Модуль камери ще не вбудований у поточний dev client. Після встановлення
          expo-camera виконайте:
        </Text>
        <Text style={styles.code}>npx expo run:ios</Text>
        <Text style={styles.code}>npx expo run:android</Text>
        <Text style={styles.permissionHint}>
          Потім знову відкрийте застосунок — не лише Reload у Metro.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={goBack}>
          <Text style={styles.secondaryButtonText}>Назад</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function QrScannerGate() {
  if (!isExpoCameraAvailable()) {
    return <NativeCameraMissing />;
  }

  return (
    <Suspense
      fallback={
        <View style={styles.centered}>
          <ActivityIndicator color={globalColors.accent} />
        </View>
      }
    >
      <QrScannerScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: globalColors.background,
  },
  backRow: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  centeredBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
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
    marginBottom: 12,
  },
  code: {
    fontFamily: "Menlo",
    fontSize: 14,
    color: globalColors.title,
    backgroundColor: "#F0EFEC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: globalColors.accent,
    fontSize: 16,
    fontWeight: "600",
  },
});
