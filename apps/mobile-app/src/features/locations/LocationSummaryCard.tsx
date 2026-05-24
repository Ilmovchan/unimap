import type { LocationMapDto } from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import DeferredExpoImage from "@/src/features/ui/DeferredExpoImage";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  locationAddressText,
  locationCardTitle,
} from "./LocationDetailContent";
import { locationCardStyles as cardStyles } from "./locationCardStyles";
import { iconForLocationSection, markerKeyForLocation } from "./locationTypeSectionMeta";

type Props = {
  location: LocationMapDto;
  onPress: () => void;
};

function previewImageUrl(location: LocationMapDto): string | null {
  const fromPhotos = location.photos?.find((p) => p.url?.trim())?.url?.trim();
  if (fromPhotos) return fromPhotos;
  return location.imageUrl?.trim() || null;
}

export default function LocationSummaryCard({ location, onPress }: Props) {
  const title = locationCardTitle(location);
  const address = locationAddressText(location);
  const typeLabel = location.typeName?.trim();
  const imageUrl = previewImageUrl(location);
  const photoCount = location.photos?.filter((p) => p.url?.trim()).length ?? 0;
  const markerKey = markerKeyForLocation(location);
  const typeIcon = iconForLocationSection(markerKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Відкрити на карті"
      onPress={onPress}
      style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
    >
      <View style={styles.row}>
        <View style={styles.mediaCol}>
          {imageUrl ? (
            <View style={styles.thumbFrame}>
              <DeferredExpoImage
                source={{ uri: imageUrl }}
                style={styles.thumbImage}
                contentFit="cover"
                contentPosition="center"
                transition={120}
                deferMs={250}
                placeholderStyle={styles.thumbPlaceholder}
                accessibilityLabel={title}
              />
              {photoCount > 1 ? (
                <View style={styles.photoCountBadge}>
                  <Ionicons name="images-outline" size={11} color="#F5F4F1" />
                  <Text style={styles.photoCountText}>{photoCount}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.thumbFrame, styles.thumbPlaceholder]}>
              <Ionicons name={typeIcon} size={28} color={globalColors.accent} />
            </View>
          )}
        </View>

        <View style={styles.body}>
          {typeLabel ? (
            <Text style={styles.typeLabel} numberOfLines={1}>
              {typeLabel}
            </Text>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {address ? (
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={globalColors.icon}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
}

const THUMB_WIDTH = 88;
const THUMB_HEIGHT = 104;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  mediaCol: {
    flexShrink: 0,
  },
  thumbFrame: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: globalColors.background,
    borderWidth: 1,
    borderColor: globalColors.border,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    backgroundColor: "rgba(139, 157, 195, 0.12)",
  },
  photoCountBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(18, 18, 17, 0.62)",
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F5F4F1",
    fontVariant: ["tabular-nums"],
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: globalColors.accent,
    letterSpacing: 0.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.2,
  },
  address: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
  chevron: {
    flexShrink: 0,
    marginLeft: -4,
    opacity: 0.85,
  },
});
