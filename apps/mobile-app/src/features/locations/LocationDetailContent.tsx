import {
  formatAddressJsonFullLine,
  formatAddressJsonShortTitle,
  formatAddressJsonUkrLine,
} from "@/src/features/api/addressJsonDisplay";
import {
  formatLocationDate,
  type LocationDetailDto,
  type LocationPhotoDto,
  type LocationUniversityObjectDto,
} from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { locationCardStyles as styles } from "./locationCardStyles";
import UniversityObjectDetailModal from "./UniversityObjectDetailModal";
import {
  iconForUniversityObjectType,
  UNIVERSITY_OBJECT_ICON_SIZE,
} from "./universityObjectTypeIcon";
import { sortUniversityObjectsForDisplay } from "./universityObjectSort";

type Props = {
  location: LocationDetailDto;
  showHeadline?: boolean;
};

function formatObjectsList(loc: LocationDetailDto): LocationUniversityObjectDto[] {
  if (!loc.objects?.length) return [];
  return sortUniversityObjectsForDisplay(loc.objects);
}

function locationPhotosForDisplay(loc: LocationDetailDto): LocationPhotoDto[] {
  const fromApi = loc.photos?.filter((p) => p.url?.trim()) ?? [];
  if (fromApi.length) return fromApi;
  const single = loc.imageUrl?.trim();
  if (!single) return [];
  return [{ id: "main", url: single, isMain: true }];
}

export function locationCardTitle(location: LocationDetailDto): string {
  const shortFromAddress = formatAddressJsonShortTitle(location.addressJson);
  if (shortFromAddress) return shortFromAddress;

  const name = location.name?.trim();
  return name || "Місце на карті";
}

export function locationAddressText(location: LocationDetailDto): string | null {
  const fullFromJson = formatAddressJsonFullLine(location.addressJson);
  if (fullFromJson?.trim()) return fullFromJson.trim();

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
  const photos = locationPhotosForDisplay(location);
  const { width: windowWidth } = useWindowDimensions();
  const gallerySlideWidth = Math.max(240, Math.min(windowWidth - 72, 360));
  const objects = formatObjectsList(location);
  const highlightId = location.highlightedObjectId?.trim();
  const showObjectsSection = objects.length > 0;
  const updatedLine = formatLocationDate(location.updatedAt);
  const [selectedObject, setSelectedObject] =
    useState<LocationUniversityObjectDto | null>(null);

  const openObjectDetail = useCallback((o: LocationUniversityObjectDto) => {
    setSelectedObject(o);
  }, []);

  const closeObjectDetail = useCallback(() => {
    setSelectedObject(null);
  }, []);

  const objectsCard = showObjectsSection ? (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Тут знаходяться</Text>
      {objects.map((o, i) => {
        const highlighted = highlightId && o.id === highlightId;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityHint="Відкрити повну інформацію"
            onPress={() => openObjectDetail(o)}
            style={({ pressed }) => [
              detailStyles.objRow,
              i === 0 && detailStyles.objRowFirst,
              highlighted && detailStyles.objRowHighlight,
              pressed && detailStyles.objRowPressed,
            ]}
          >
            <View style={detailStyles.objIconWrap}>
              <MaterialCommunityIcons
                name={iconForUniversityObjectType(o.type, o.typeName)}
                size={UNIVERSITY_OBJECT_ICON_SIZE}
                color={globalColors.title}
              />
            </View>
            <View style={detailStyles.objBody}>
              <Text style={detailStyles.objName}>{o.name}</Text>
              {o.typeName?.trim() ? (
                <Text style={detailStyles.objMeta}>{o.typeName.trim()}</Text>
              ) : null}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={globalColors.icon}
              style={detailStyles.objChevron}
            />
          </Pressable>
        );
      })}
    </View>
  ) : null;

  return (
    <>
      {showHeadline ? (
        <Text style={styles.headline}>{headline}</Text>
      ) : null}

      {objectsCard}

      {photos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            {photos.length > 1 ? `Фото (${photos.length})` : "Фото"}
          </Text>
          {photos.length === 1 ? (
            <Image
              source={{ uri: photos[0].url }}
              style={styles.heroImage}
              contentFit="cover"
              accessibilityLabel={photos[0].altUk?.trim() || headline}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={gallerySlideWidth + 12}
              contentContainerStyle={detailStyles.galleryContent}
            >
              {photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  style={[
                    styles.heroImage,
                    detailStyles.gallerySlide,
                    { width: gallerySlideWidth },
                  ]}
                  contentFit="cover"
                  accessibilityLabel={photo.altUk?.trim() || headline}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {addressText ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Адреса</Text>
          <Text style={styles.bodyText}>{addressText}</Text>
        </View>
      ) : null}

      {updatedLine ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Останнє оновлення</Text>
          <Text style={styles.bodyText}>{updatedLine}</Text>
        </View>
      ) : null}

      <UniversityObjectDetailModal
        object={selectedObject}
        locationTitle={headline}
        onClose={closeObjectDetail}
      />
    </>
  );
}

const detailStyles = StyleSheet.create({
  galleryContent: {
    gap: 12,
    paddingRight: 4,
  },
  gallerySlide: {
    marginRight: 0,
  },
  objRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  objRowPressed: {
    opacity: 0.88,
  },
  objIconWrap: {
    width: UNIVERSITY_OBJECT_ICON_SIZE,
    height: UNIVERSITY_OBJECT_ICON_SIZE,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  objBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  objChevron: {
    marginLeft: 4,
    alignSelf: "center",
  },
  objRowFirst: {
    marginTop: 14,
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
    lineHeight: 22,
    fontWeight: "400",
    color: globalColors.title,
  },
  objMeta: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
});
