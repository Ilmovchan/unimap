import {
  formatAddressJsonFullLine,
  formatAddressJsonShortTitle,
  formatAddressJsonUkrLine,
} from "@/src/features/api/addressJsonDisplay";
import {
  formatLocationDate,
  type LocationDetailDto,
  type LocationPhotoDto,
  type LocationScheduleDto,
  type LocationUniversityObjectDto,
} from "@/src/features/api/locationsClient";
import { globalColors } from "@/src/styles/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import LocationPhotoStrip from "./LocationPhotoStrip";
import { locationCardStyles as styles } from "./locationCardStyles";
import {
  iconForUniversityObjectType,
  UNIVERSITY_OBJECT_ICON_SIZE,
} from "./universityObjectTypeIcon";
import { sortUniversityObjectsForDisplay } from "./universityObjectSort";

type Props = {
  location: LocationDetailDto;
  showHeadline?: boolean;
  /** У bottom sheet — текст одразу, фото підвантажуються окремо. */
  loadPhotosImmediately?: boolean;
};

const COLLAPSE_ANIMATION_MS = 260;
const DETAIL_FIELD_HORIZONTAL_PADDING = 10;

function formatObjectsList(loc: LocationDetailDto): LocationUniversityObjectDto[] {
  if (!loc.objects?.length) return [];
  return sortUniversityObjectsForDisplay(loc.objects);
}

export function locationPhotosForDisplay(loc: LocationDetailDto): LocationPhotoDto[] {
  const fromApi = loc.photos?.filter((p) => p.url?.trim()) ?? [];
  if (fromApi.length) return fromApi;
  const single = loc.imageUrl?.trim();
  if (!single) return [];
  return [{ id: "main", url: single }];
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

const SCHEDULE_DAY_LABELS: Record<number, string> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Нд",
};

type TodayScheduleStatus = "open" | "closingSoon" | "closed";

function scheduleForDisplay(
  schedule: LocationScheduleDto[] | undefined,
): LocationScheduleDto[] {
  if (!schedule?.length) return [];
  return schedule
    .filter((day) => day.dayOfWeek >= 1 && day.dayOfWeek <= 7)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

function formatScheduleTime(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function formatScheduleValue(day: LocationScheduleDto): string {
  if (day.isClosed) return "Зачинено";
  const opening = formatScheduleTime(day.openingAt);
  const closing = formatScheduleTime(day.closingAt);
  if (opening && closing) return `${opening} - ${closing}`;
  if (opening) return `з ${opening}`;
  if (closing) return `до ${closing}`;
  return "Відчинено";
}

function currentScheduleDayOfWeek(now = new Date()): number {
  const day = now.getDay();
  return day === 0 ? 7 : day;
}

function parseScheduleTimeMinutes(value: string | null | undefined): number | null {
  const raw = value?.trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function todayScheduleStatus(
  day: LocationScheduleDto,
  now = new Date(),
): TodayScheduleStatus | null {
  if (day.dayOfWeek !== currentScheduleDayOfWeek(now)) return null;
  if (day.isClosed) return "closed";

  const opening = parseScheduleTimeMinutes(day.openingAt);
  const closing = parseScheduleTimeMinutes(day.closingAt);
  let current = now.getHours() * 60 + now.getMinutes();

  if (opening == null && closing == null) return "open";

  let adjustedOpening = opening;
  let adjustedClosing = closing;

  if (
    adjustedOpening != null &&
    adjustedClosing != null &&
    adjustedClosing <= adjustedOpening
  ) {
    adjustedClosing += 24 * 60;
    if (current < adjustedOpening) current += 24 * 60;
  }

  if (adjustedOpening != null && current < adjustedOpening) return "closed";
  if (adjustedClosing != null && current >= adjustedClosing) return "closed";
  if (adjustedClosing != null && adjustedClosing - current <= 60) {
    return "closingSoon";
  }

  return "open";
}

function scheduleSummary(schedule: LocationScheduleDto[]): string {
  const openDays = schedule.filter((day) => !day.isClosed);
  if (openDays.length === 0) return "Усі дні зачинено";

  const firstWithHours = openDays.find((day) => day.openingAt || day.closingAt);
  if (!firstWithHours) return `${openDays.length} дн. відкрито`;

  return formatScheduleValue(firstWithHours);
}

function InlineDetailRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | number | null | undefined;
  onPress?: () => void;
}) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return null;

  const content = (
    <>
      <Text style={detailStyles.inlineDetailLabel}>{label}</Text>
      <Text
        style={[
          detailStyles.inlineDetailValue,
          onPress && detailStyles.inlineDetailLink,
        ]}
      >
        {text}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="link"
        onPress={onPress}
        style={({ pressed }) => [
          detailStyles.inlineDetailRow,
          pressed && detailStyles.inlineDetailPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={detailStyles.inlineDetailRow}>
      {content}
    </View>
  );
}

function phoneHref(phoneNumber: string): string {
  return `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
}

function webHref(webUrl: string): string {
  return /^https?:\/\//i.test(webUrl) ? webUrl : `https://${webUrl}`;
}

function AnimatedCollapsible({
  expanded,
  children,
  style,
}: {
  expanded: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [contentHeight, setContentHeight] = useState(0);
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(height, {
        toValue: expanded ? contentHeight : 0,
        duration: COLLAPSE_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: expanded ? 1 : 0,
        duration: COLLAPSE_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [contentHeight, expanded, height, opacity]);

  return (
    <Animated.View
      style={[
        detailStyles.collapsibleClip,
        style,
        {
          height,
          opacity,
        },
      ]}
    >
      <View
        style={detailStyles.collapsibleMeasure}
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          setContentHeight((current) =>
            Math.abs(current - nextHeight) > 0.5 ? nextHeight : current,
          );
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

function hasObjectExtraInfo(object: LocationUniversityObjectDto): boolean {
  return Boolean(
    (object.floor != null && Number.isFinite(object.floor)) ||
      object.roomNumber?.trim() ||
      object.manager?.trim() ||
      object.phoneNumber?.trim() ||
      object.webUrl?.trim() ||
      object.description?.trim(),
  );
}

function UniversityObjectRow({
  object,
  first,
  highlighted,
  expanded,
  onToggle,
}: {
  object: LocationUniversityObjectDto;
  first: boolean;
  highlighted: boolean;
  expanded: boolean;
  onToggle: (object: LocationUniversityObjectDto) => void;
}) {
  const description = object.description?.trim();
  const manager = object.manager?.trim();
  const phoneNumber = object.phoneNumber?.trim();
  const webUrl = object.webUrl?.trim();
  const expandable = hasObjectExtraInfo(object);

  return (
    <View>
      {!first ? <View style={detailStyles.objSeparator} /> : null}
      <Pressable
        accessibilityRole={expandable ? "button" : "text"}
        accessibilityState={expandable ? { expanded } : undefined}
        accessibilityHint={expandable ? "Розгорнути інформацію" : undefined}
        disabled={!expandable}
        onPress={() => onToggle(object)}
        style={({ pressed }) => [
          detailStyles.objRow,
          highlighted && detailStyles.objRowHighlight,
          expanded &&
            expandable &&
            (highlighted
              ? detailStyles.objRowHighlightExpanded
              : detailStyles.objRowExpanded),
          !expandable && detailStyles.objRowStatic,
          pressed &&
            (highlighted
              ? detailStyles.objRowHighlightPressed
              : detailStyles.objRowPressed),
        ]}
      >
        <View style={detailStyles.objIconWrap}>
          <MaterialCommunityIcons
            name={iconForUniversityObjectType(object.type, object.typeName)}
            size={UNIVERSITY_OBJECT_ICON_SIZE}
            color={globalColors.title}
          />
        </View>
        <View style={detailStyles.objBody}>
          <Text style={detailStyles.objName}>{object.name}</Text>
          {object.typeName?.trim() ? (
            <Text style={detailStyles.objMeta}>{object.typeName.trim()}</Text>
          ) : null}
        </View>
        {expandable ? (
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={globalColors.icon}
            style={detailStyles.objChevron}
          />
        ) : null}
      </Pressable>

      {expandable ? (
        <AnimatedCollapsible expanded={expanded}>
          <View style={detailStyles.inlineDetails}>
            <InlineDetailRow label="Поверх" value={object.floor} />
            <InlineDetailRow label="Аудиторія" value={object.roomNumber} />
            <InlineDetailRow label="Керівник" value={manager} />
            <InlineDetailRow
              label="Телефон"
              value={phoneNumber}
              onPress={
                phoneNumber
                  ? () => void Linking.openURL(phoneHref(phoneNumber))
                  : undefined
              }
            />
            <InlineDetailRow
              label="Сайт"
              value={webUrl}
              onPress={
                webUrl
                  ? () => void Linking.openURL(webHref(webUrl))
                  : undefined
              }
            />
            <InlineDetailRow label="Опис" value={description} />
          </View>
        </AnimatedCollapsible>
      ) : null}
    </View>
  );
}

export function LocationDetailSections({
  location,
  showHeadline = true,
  loadPhotosImmediately = false,
}: Props) {
  const addressText = locationAddressText(location);
  const headline = locationCardTitle(location);
  const photos = locationPhotosForDisplay(location);
  const objects = formatObjectsList(location);
  const schedule = scheduleForDisplay(location.schedule);
  const highlightId = location.highlightedObjectId?.trim();
  const showObjectsSection = objects.length > 0;
  const showScheduleSection = schedule.length > 0;
  const updatedLine = formatLocationDate(location.updatedAt);
  const [expandedObjectId, setExpandedObjectId] = useState<string | null>(
    highlightId || null,
  );
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [shelterHintVisible, setShelterHintVisible] = useState(false);

  const toggleObjectDetail = useCallback((o: LocationUniversityObjectDto) => {
    if (!hasObjectExtraInfo(o)) return;
    setExpandedObjectId((current) => (current === o.id ? null : o.id));
  }, []);

  const toggleSchedule = useCallback(() => {
    setScheduleExpanded((current) => !current);
  }, []);

  const toggleShelterHint = useCallback(() => {
    setShelterHintVisible((current) => !current);
  }, []);

  const objectsCard = showObjectsSection ? (
    <View style={[styles.card, detailStyles.detailCard]}>
      <Text style={[styles.sectionLabel, detailStyles.cardLabel]}>
        Тут знаходяться
      </Text>
      {objects.map((o, i) => (
        <UniversityObjectRow
          key={o.id}
          object={o}
          first={i === 0}
          highlighted={Boolean(highlightId && o.id === highlightId)}
          expanded={expandedObjectId === o.id}
          onToggle={toggleObjectDetail}
        />
      ))}
    </View>
  ) : null;

  return (
    <>
      {showHeadline ? (
        <View style={detailStyles.headlineRow}>
          <Text style={[styles.headline, detailStyles.headlineText]}>
            {headline}
          </Text>
          {location.hasShelter ? (
            <View style={detailStyles.shelterBadgeWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Має укриття"
                onPress={toggleShelterHint}
                hitSlop={8}
                style={({ pressed }) => [
                  detailStyles.shelterBadge,
                  pressed && detailStyles.shelterBadgePressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="shield-home"
                  size={21}
                  color={globalColors.title}
                />
              </Pressable>
              {shelterHintVisible ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Сховати пояснення"
                  onPress={toggleShelterHint}
                  style={detailStyles.shelterHint}
                >
                  <Text style={detailStyles.shelterHintText}>Має укриття</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {photos.length > 0 ? (
        <LocationPhotoStrip
          photos={photos}
          title={headline}
          loadImmediately={loadPhotosImmediately}
        />
      ) : null}

      {objectsCard}

      {showScheduleSection ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: scheduleExpanded }}
          onPress={toggleSchedule}
          style={({ pressed }) => [
            styles.card,
            detailStyles.detailCard,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={detailStyles.cardHeader}>
            <View style={detailStyles.collapsibleHeaderText}>
              <Text style={[styles.sectionLabel, detailStyles.cardLabel]}>
                Розклад
              </Text>
              <Text style={detailStyles.cardSummary}>
                {scheduleSummary(schedule)}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={scheduleExpanded ? "chevron-up" : "chevron-down"}
              size={22}
              color={globalColors.icon}
            />
          </View>
          <AnimatedCollapsible expanded={scheduleExpanded}>
            <View style={detailStyles.scheduleGrid}>
              {schedule.map((day) => {
                const todayStatus = todayScheduleStatus(day);
                return (
                  <View
                    key={day.id}
                    style={[
                      detailStyles.scheduleRow,
                      todayStatus === "open" && detailStyles.scheduleRowOpen,
                      todayStatus === "closingSoon" &&
                        detailStyles.scheduleRowClosingSoon,
                      todayStatus === "closed" && detailStyles.scheduleRowClosed,
                    ]}
                  >
                    <Text
                      style={[
                        detailStyles.scheduleDay,
                        todayStatus && detailStyles.scheduleDayToday,
                      ]}
                    >
                      {SCHEDULE_DAY_LABELS[day.dayOfWeek]}
                    </Text>
                    <Text
                      style={[
                        detailStyles.scheduleValue,
                        day.isClosed && detailStyles.scheduleValueClosed,
                        todayStatus && detailStyles.scheduleValueToday,
                      ]}
                    >
                      {formatScheduleValue(day)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </AnimatedCollapsible>
        </Pressable>
      ) : null}

      {addressText ? (
        <View style={[styles.card, detailStyles.detailCard]}>
          <Text style={[styles.sectionLabel, detailStyles.cardLabel]}>Адреса</Text>
          <Text style={styles.bodyText}>{addressText}</Text>
        </View>
      ) : null}

      {updatedLine ? (
        <View style={[styles.card, detailStyles.detailCard]}>
          <Text style={[styles.sectionLabel, detailStyles.cardLabel]}>
            Останнє оновлення
          </Text>
          <Text style={styles.bodyText}>{updatedLine}</Text>
        </View>
      ) : null}

    </>
  );
}

const detailStyles = StyleSheet.create({
  headlineRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 20,
  },
  headlineText: {
    flex: 1,
    marginBottom: 0,
  },
  shelterBadgeWrap: {
    position: "relative",
  },
  shelterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.36)",
  },
  shelterBadgePressed: {
    opacity: 0.78,
  },
  shelterHint: {
    position: "absolute",
    top: 42,
    right: 0,
    zIndex: 5,
    minWidth: 112,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: globalColors.border,
    backgroundColor: globalColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  shelterHintText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: globalColors.title,
  },
  detailCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardLabel: {
    marginBottom: 10,
  },
  cardHeader: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 10,
  },
  cardSummary: {
    fontSize: 16,
    lineHeight: 24,
    color: globalColors.title,
  },
  objRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  objSeparator: {
    height: 1,
    marginVertical: 10,
    backgroundColor: globalColors.border,
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
  objRowHighlight: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: "rgba(34, 197, 94, 0.36)",
  },
  objRowHighlightPressed: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 0.46)",
  },
  objRowHighlightExpanded: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: "rgba(34, 197, 94, 0.42)",
  },
  objRowExpanded: {
    backgroundColor: "rgba(33, 32, 30, 0.04)",
  },
  objRowStatic: {
    paddingRight: 4,
  },
  objName: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "400",
    color: globalColors.title,
  },
  objMeta: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
  collapsibleClip: {
    overflow: "hidden",
  },
  collapsibleMeasure: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
  },
  inlineDetails: {
    marginTop: 10,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
    gap: 12,
  },
  inlineDetailRow: {
    gap: 4,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: DETAIL_FIELD_HORIZONTAL_PADDING,
  },
  inlineDetailPressed: {
    opacity: 0.75,
  },
  inlineDetailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  inlineDetailValue: {
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.title,
  },
  inlineDetailLink: {
    color: globalColors.userLocation,
    textDecorationLine: "underline",
  },
  collapsibleHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  scheduleGrid: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
    gap: 9,
  },
  scheduleRow: {
    gap: 4,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: DETAIL_FIELD_HORIZONTAL_PADDING,
    paddingVertical: 8,
  },
  scheduleRowOpen: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: "rgba(34, 197, 94, 0.36)",
  },
  scheduleRowClosingSoon: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderColor: "rgba(249, 115, 22, 0.38)",
  },
  scheduleRowClosed: {
    backgroundColor: "rgba(239, 68, 68, 0.13)",
    borderColor: "rgba(239, 68, 68, 0.34)",
  },
  scheduleDay: {
    fontSize: 11,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  scheduleDayToday: {
    color: globalColors.title,
  },
  scheduleValue: {
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.title,
  },
  scheduleValueToday: {
    fontWeight: "600",
  },
  scheduleValueClosed: {
    color: globalColors.subtitle,
  },
});
