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
  /** Бейдж (наприклад, кількість непрочитаних новин) */
  badgeCount?: number;
};

const LayoutButton = ({
  icon,
  label,
  onPress,
  style,
  accessibilityLabel,
  badgeCount,
  ...a11y
}: LayoutButtonProps) => {
  const resolvedLabel =
    accessibilityLabel ??
    (typeof label === "string" ? label : undefined);
  const showBadge =
    badgeCount !== undefined && badgeCount > 0;
  const badgeText =
    badgeCount !== undefined && badgeCount > 99 ? "99+" : String(badgeCount);

  return (
    <View style={[styles.wrapper, style]} pointerEvents="box-none">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={resolvedLabel}
        style={[styles.base, label ? styles.pill : styles.circle]}
        activeOpacity={0.88}
        onPress={onPress}
        {...a11y}
      >
        <View style={styles.inner}>
          {icon ?? null}
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      </TouchableOpacity>
      {showBadge ? (
        <View
          style={[styles.badge, label ? styles.badgeOnPill : styles.badgeOnCircle]}
          pointerEvents="none"
        >
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default LayoutButton;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    overflow: "visible",
  },
  base: {
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
  badge: {
    position: "absolute",
    zIndex: 1,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeOnCircle: {
    top: -6,
    right: -6,
  },
  badgeOnPill: {
    top: -7,
    right: -5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
