import type { LocationPhotoDto } from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { locationCardStyles as cardStyles } from "./locationCardStyles";
import LocationPhotoViewerModal from "./LocationPhotoViewerModal";

const THUMB_GAP = 10;
const THUMB_RADIUS = 12;
const THUMB_HEIGHT = 124;
const MAX_VISIBLE = 2;

type Props = {
  photos: LocationPhotoDto[];
  title: string;
};

export default function LocationPhotoStrip({ photos, title }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const openViewer = useCallback((index: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerIndex(index);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerIndex(null);
  }, []);

  if (photos.length === 0) return null;

  const visible = photos.slice(0, MAX_VISIBLE);
  const extraCount = photos.length - MAX_VISIBLE;

  return (
    <>
      <View style={cardStyles.card}>
        <View style={styles.row}>
          {visible.map((photo, index) => {
            const showMoreOverlay = index === MAX_VISIBLE - 1 && extraCount > 0;
            return (
              <Pressable
                key={photo.id}
                accessibilityRole="button"
                accessibilityLabel={
                  showMoreOverlay
                    ? `Ще ${extraCount} фото, відкрити галерею`
                    : photo.altUk?.trim()
                      ? `${photo.altUk.trim()}, відкрити`
                      : `Фото ${index + 1}, відкрити`
                }
                accessibilityHint="Відкрити повний розмір"
                onPress={() => openViewer(index)}
                style={({ pressed }) => [
                  styles.cell,
                  pressed && styles.cellPressed,
                ]}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.thumbImage}
                  contentFit="cover"
                  transition={120}
                />
                {showMoreOverlay ? (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreOverlayText}>+{extraCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <LocationPhotoViewerModal
        photos={photos}
        initialIndex={viewerIndex ?? 0}
        title={title}
        visible={viewerIndex !== null}
        onClose={closeViewer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: THUMB_GAP,
    width: "100%",
  },
  cell: {
    flex: 1,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_RADIUS,
    overflow: "hidden",
    backgroundColor: globalColors.background,
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  cellPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 18, 17, 0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreOverlayText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F5F4F1",
    fontVariant: ["tabular-nums"],
  },
});
