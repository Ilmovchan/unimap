import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

function NewsListBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
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

export default function NewsLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: globalColors.background },
        headerTintColor: globalColors.title,
        headerStyle: { backgroundColor: globalColors.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Новини університету",
          headerLeft: () => <NewsListBackButton />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "Новина" }} />
    </Stack>
  );
}
