import StackBackButton from "@/src/features/navigation/StackBackButton";
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
          headerLeft: () => <StackBackButton />,
          freezeOnBlur: true,
          fullScreenGestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="news"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="qr"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="location/[id]"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen
        name="location/[id]/object/[objectId]"
        options={{ headerShown: false, animation: "none" }}
      />
    </Stack>
  );
};

export default ProtectedLayout;
