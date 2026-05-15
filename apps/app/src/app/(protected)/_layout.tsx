import { globalColors } from "@/src/styles/styles";
import { Stack } from "expo-router";

const ProtectedLayout = () => {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: globalColors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, freezeOnBlur: true }}
      />
      <Stack.Screen
        name="locations"
        options={{
          title: "Усі відділення",
          headerTintColor: globalColors.title,
          headerStyle: { backgroundColor: globalColors.background },
          headerBackButtonDisplayMode: "minimal",
          freezeOnBlur: true,
          fullScreenGestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="news"
        options={{ headerShown: false }}
      />
    </Stack>
  );
};

export default ProtectedLayout;
