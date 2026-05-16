import { globalColors } from "@/src/styles/styles";
import { Platform, StyleSheet } from "react-native";

/** Спільні стилі карток formSheet / списків локацій. */
export const locationCardStyles = StyleSheet.create({
  headline: {
    fontSize: 22,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  card: {
    backgroundColor: globalColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: globalColors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.92,
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: globalColors.background,
  },
  listThumb: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: globalColors.background,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: globalColors.title,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
});
