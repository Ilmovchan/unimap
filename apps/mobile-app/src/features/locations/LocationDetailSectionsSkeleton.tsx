import { globalColors } from "@/src/styles/styles";
import { Platform, StyleSheet, View } from "react-native";
import { locationCardStyles as styles } from "./locationCardStyles";

const THUMB_HEIGHT = 124;

/** Плейсхолдер тіла картки локації, поки йде GET /locations/:id. */
export default function LocationDetailSectionsSkeleton() {
  return (
    <>
      <View style={styles.card}>
        <View style={skeletonStyles.photoRow}>
          <View style={skeletonStyles.photoCell} />
          <View style={skeletonStyles.photoCell} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={skeletonStyles.lineShort} />
        <View style={skeletonStyles.lineLong} />
        <View style={skeletonStyles.lineMid} />
      </View>
    </>
  );
}

const skeletonStyles = StyleSheet.create({
  photoRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  photoCell: {
    flex: 1,
    height: THUMB_HEIGHT,
    borderRadius: 12,
    backgroundColor: "rgba(139, 157, 195, 0.14)",
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  lineShort: {
    height: 12,
    width: "32%",
    borderRadius: 6,
    backgroundColor: "rgba(139, 157, 195, 0.18)",
    marginBottom: 10,
  },
  lineLong: {
    height: 14,
    width: "92%",
    borderRadius: 6,
    backgroundColor: "rgba(139, 157, 195, 0.12)",
    marginBottom: 8,
  },
  lineMid: {
    height: 14,
    width: "68%",
    borderRadius: 6,
    backgroundColor: "rgba(139, 157, 195, 0.1)",
  },
});
