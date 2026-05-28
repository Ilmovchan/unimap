import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name="qr-code-outline"
            size={48}
            color={globalColors.accent}
          />
        </View>
        <Text style={styles.title}>Посилання не знайдено</Text>
        <Text style={styles.hint}>
          Якщо ви відсканували QR-код системною камерою, відкрийте його
          сканером у застосунку UniMap — так код коректно відкриє локацію на
          карті.
        </Text>
        <Link href="/qr" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Відкрити сканер QR</Text>
        </Link>
        <Link href="/" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>На карту</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: globalColors.background,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: globalColors.surface,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: globalColors.title,
    textAlign: "center",
    marginBottom: 10,
  },
  hint: {
    fontSize: 15,
    color: globalColors.subtitle,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
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
});
