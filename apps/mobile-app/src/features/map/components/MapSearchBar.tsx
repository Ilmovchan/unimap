import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  onActivate: () => void;
  onChangeText?: (text: string) => void;
};

/** Смуга пошуку над картою. */
export default function MapSearchBar({
  style,
  onActivate,
  onChangeText,
}: Props) {
  const handleFocus = useCallback(() => {
    onActivate();
  }, [onActivate]);

  return (
    <View style={[styles.bar, style]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={globalColors.icon}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder="Пошук на карті…"
        placeholderTextColor={globalColors.subtitle}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        onFocus={handleFocus}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: globalColors.navigationFabBg,
    borderColor: globalColors.navigationFabBorder,
    borderWidth: 1,
    borderRadius: 28,
    shadowColor: globalColors.navigationFabShadow,
    shadowOpacity: Platform.OS === "ios" ? 0.22 : 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.title,
    letterSpacing: -0.2,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
  },
});
