import { formatAddressJsonUkrLine } from "@/src/features/api/addressJsonDisplay";
import {
  formatLocationDate,
  type LocationDetailDto,
  type LocationUniversityObjectDto,
} from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { locationCardStyles as styles } from "./locationCardStyles";

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

export function locationAddressText(location: LocationDetailDto): string | null {
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
  const updatedLine = formatLocationDate(location.updatedAt);

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
          <Text style={styles.bodyText}>{addressText}</Text>
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
                  detailStyles.objRow,
                  i === 0 && detailStyles.objRowFirst,
                  highlighted && detailStyles.objRowHighlight,
                ]}
              >
                <Text style={detailStyles.objName}>{o.name}</Text>
                {o.typeName ? (
                  <Text style={detailStyles.objType}>{o.typeName}</Text>
                ) : null}
                {o.floor != null && Number.isFinite(o.floor) ? (
                  <Text style={detailStyles.objMeta}>Поверх: {o.floor}</Text>
                ) : null}
                {o.roomNumber ? (
                  <Text style={detailStyles.objMeta}>
                    Аудиторія: {o.roomNumber}
                  </Text>
                ) : null}
                {o.description?.trim() ? (
                  <Text style={detailStyles.objDesc}>{o.description.trim()}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {updatedLine ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Останнє оновлення</Text>
          <Text style={styles.bodyText}>{updatedLine}</Text>
        </View>
      ) : null}
    </>
  );
}

const detailStyles = StyleSheet.create({
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
