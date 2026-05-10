import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

type MarkerProps = {
  selected: boolean;
  onPress: () => void;
};

const Marker = ({ selected, onPress }: MarkerProps) => {
  return (
    <Pressable onPress={onPress} unstable_pressDelay={1000}>
      <Animated.View
        style={[styles.marker, selected ? styles.markerSelected : null]}
      >
        <Ionicons name="school" color={globalColors.accent} size={22} />
      </Animated.View>
    </Pressable>
  );
};

export default Marker;

const styles = StyleSheet.create({
  marker: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
    backgroundColor: globalColors.surface,
    borderRadius: 32,
    borderColor: globalColors.border,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerSelected: {
    width: 38,
    height: 38,
    backgroundColor: globalColors.surface,
  },
});
