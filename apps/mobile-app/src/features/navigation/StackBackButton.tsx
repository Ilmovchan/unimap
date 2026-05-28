import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

type Props = {
  /** Якщо в стеку немає куди повертатись — перейти на карту. */
  fallbackHref?: "/" | "/(protected)";
};

export default function StackBackButton({ fallbackHref = "/" }: Props) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace(fallbackHref);
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Назад"
    >
      <Ionicons
        name="chevron-back"
        size={28}
        color={globalColors.title}
      />
    </Pressable>
  );
}
