import {
  AccessibilityProps,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import React from "react";
import { globalColors } from "@/src/styles/styles";

type LayoutButtonProps = AccessibilityProps & {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Якщо є підпис — кнопка стає «пігулкою», інакше коло під іконку */
  label?: string;
  icon?: React.ReactElement | null;
};

const LayoutButton = ({
  icon,
  label,
  onPress,
  style,
  accessibilityLabel,
  ...a11y
}: LayoutButtonProps) => {
  const resolvedLabel =
    accessibilityLabel ??
    (typeof label === "string" ? label : undefined);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      style={[
        styles.base,
        label ? styles.pill : styles.circle,
        style,
      ]}
      activeOpacity={0.88}
      onPress={onPress}
      {...a11y}
    >
      <View style={styles.inner}>
        {icon ?? null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

export default LayoutButton;

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    backgroundColor: globalColors.navigationFabBg,
    borderColor: globalColors.navigationFabBorder,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: globalColors.navigationFabShadow,
    shadowOpacity: Platform.OS === "ios" ? 0.22 : 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 0,
  },
  pill: {
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    maxWidth: "88%",
    alignSelf: "flex-start",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    rowGap: 0,
    flexShrink: 1,
  },
  label: {
    color: globalColors.navigationFabIcon,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
