import { Platform } from "react-native";

export const glow = (color: string) => {
  if (Platform.OS === "android") {
    return {
      elevation: 6,
    };
  }

  return {
    shadowColor: color,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  };
};
