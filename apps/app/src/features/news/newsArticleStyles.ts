import { globalColors } from "@/src/styles/styles";
import { Platform, StyleSheet } from "react-native";

/** Розширена картка статті — споріднена зі списком, але не копія list-card. */
export const newsArticleStyles = StyleSheet.create({
  article: {
    backgroundColor: globalColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: globalColors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: globalColors.title,
    letterSpacing: -0.45,
    lineHeight: 30,
    marginBottom: 16,
  },
  hero: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: globalColors.background,
    marginBottom: 18,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: globalColors.title,
  },
  metaCard: {
    marginTop: 14,
    backgroundColor: globalColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: globalColors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  metaValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.title,
    fontWeight: "500",
  },
});
