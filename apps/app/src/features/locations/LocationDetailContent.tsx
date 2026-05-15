import { formatAddressJsonUkrLine } from "@/src/features/api/addressJsonDisplay";
import {
  type LocationDetailDto,
  type LocationUniversityObjectDto,
} from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";

type Props = {
  location: LocationDetailDto;
  showHeadline?: boolean;
};

function formatObjectsList(loc: LocationDetailDto): LocationUniversityObjectDto[] {
  return loc.objects && loc.objects.length > 0 ? loc.objects : [];
}

export function locationCardTitle(location: LocationDetailDto): string {
  const name = location.name?.trim();
  return name || "Місце на карті";
}

function locationAddressText(location: LocationDetailDto): string | null {
  const plain = location.address?.trim();
  if (plain) return plain;
  const fromJson = formatAddressJsonUkrLine(location.addressJson);
  if (fromJson?.trim()) return fromJson.trim();
  return null;
}

export function LocationDetailSections({
  location,
  showHeadline = true,
}: Props) {
  const addressText = locationAddressText(location);
  const headline = locationCardTitle(location);
  const imageUrl = location.imageUrl?.trim() || null;
  const objects = formatObjectsList(location);
  const highlightId = location.highlightedObjectId?.trim();
  const showObjectsSection = objects.length > 1;

  return (
    <>
      {showHeadline ? (
        <Text style={styles.headline}>{headline}</Text>
      ) : null}

      {imageUrl ? (
        <View style={styles.card}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            accessibilityLabel={headline}
          />
        </View>
      ) : null}

      {addressText ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Адреса</Text>
          <Text style={styles.bodyText}>{addressText}</Text>
        </View>
      ) : null}

      {location.description?.trim() ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Опис</Text>
          <Text style={styles.bodyText}>{location.description.trim()}</Text>
        </View>
      ) : null}

      {showObjectsSection ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Тут знаходяться</Text>
          {objects.map((o, i) => {
            const highlighted = highlightId && o.id === highlightId;
            return (
              <View
                key={o.id}
                style={[
                  styles.objRow,
                  i === 0 && styles.objRowFirst,
                  highlighted && styles.objRowHighlight,
                ]}
              >
                <Text style={styles.objName}>{o.name}</Text>
                {o.typeName ? (
                  <Text style={styles.objType}>{o.typeName}</Text>
                ) : null}
                {o.floor != null && Number.isFinite(o.floor) ? (
                  <Text style={styles.objMeta}>Поверх: {o.floor}</Text>
                ) : null}
                {o.roomNumber ? (
                  <Text style={styles.objMeta}>Аудиторія: {o.roomNumber}</Text>
                ) : null}
                {o.description?.trim() ? (
                  <Text style={styles.objDesc}>{o.description.trim()}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: globalColors.background,
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
  objRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  objRowFirst: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  objRowHighlight: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.35)",
    paddingBottom: 8,
    marginTop: 8,
    paddingTop: 8,
  },
  objName: {
    fontSize: 15,
    fontWeight: "600",
    color: globalColors.title,
  },
  objType: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: globalColors.accent,
  },
  objMeta: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
  objDesc: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
});
