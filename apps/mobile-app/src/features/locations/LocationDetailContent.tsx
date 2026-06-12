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
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const text = value == null ? "" : String(value).trim();
  if (!text) return null;

  return (
    <View style={detailStyles.inlineDetailRow}>
      <Text style={detailStyles.inlineDetailLabel}>{label}</Text>
      <Text style={detailStyles.inlineDetailValue}>{text}</Text>
    </View>
  );
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
      object.websiteUrl?.trim() ||
      object.description?.trim(),
  );
}

function UniversityObjectRow({
  object,
  first,
  highlighted,
  expanded,
  locationTitle,
  onToggle,
}: {
  object: LocationUniversityObjectDto;
  first: boolean;
  highlighted: boolean;
  expanded: boolean;
  locationTitle: string;
  onToggle: (object: LocationUniversityObjectDto) => void;
}) {
  const description = object.description?.trim();
  const websiteUrl = object.websiteUrl?.trim();
  const expandable = hasObjectExtraInfo(object);

  return (
    <View>
      <Pressable
        accessibilityRole={expandable ? "button" : "text"}
        accessibilityState={expandable ? { expanded } : undefined}
        accessibilityHint={expandable ? "Розгорнути інформацію" : undefined}
        disabled={!expandable}
        onPress={() => onToggle(object)}
        style={({ pressed }) => [
          detailStyles.objRow,
          first && detailStyles.objRowFirst,
          highlighted && detailStyles.objRowHighlight,
          expanded && expandable && detailStyles.objRowExpanded,
          !expandable && detailStyles.objRowStatic,
          pressed && detailStyles.objRowPressed,
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
            <InlineDetailRow label="Локація" value={locationTitle} />
            <InlineDetailRow label="Поверх" value={object.floor} />
            <InlineDetailRow label="Аудиторія" value={object.roomNumber} />
            <InlineDetailRow label="Сайт" value={websiteUrl} />
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

  const toggleObjectDetail = useCallback((o: LocationUniversityObjectDto) => {
    if (!hasObjectExtraInfo(o)) return;
    setExpandedObjectId((current) => (current === o.id ? null : o.id));
  }, []);

  const toggleSchedule = useCallback(() => {
    setScheduleExpanded((current) => !current);
  }, []);

  const objectsCard = showObjectsSection ? (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Тут знаходяться</Text>
      {objects.map((o, i) => (
        <UniversityObjectRow
          key={o.id}
          object={o}
          first={i === 0}
          highlighted={Boolean(highlightId && o.id === highlightId)}
          expanded={expandedObjectId === o.id}
          locationTitle={headline}
          onToggle={toggleObjectDetail}
        />
      ))}
    </View>
  ) : null;

  return (
    <>
      {showHeadline ? (
        <Text style={styles.headline}>{headline}</Text>
      ) : null}

      {photos.length > 0 ? (
        <LocationPhotoStrip
          photos={photos}
          title={headline}
          loadImmediately={loadPhotosImmediately}
        />
      ) : null}

      {objectsCard}

      {addressText ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Адреса</Text>
          <Text style={styles.bodyText}>{addressText}</Text>
        </View>
      ) : null}

      {showScheduleSection ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: scheduleExpanded }}
          onPress={toggleSchedule}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={detailStyles.collapsibleHeader}>
            <View style={detailStyles.collapsibleHeaderText}>
              <Text style={styles.sectionLabel}>Розклад</Text>
              <Text style={styles.bodyText}>{scheduleSummary(schedule)}</Text>
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
  objRowExpanded: {
    backgroundColor: "rgba(33, 32, 30, 0.04)",
  },
  objRowStatic: {
    paddingRight: 4,
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
    marginTop: 8,
    marginLeft: UNIVERSITY_OBJECT_ICON_SIZE + 10,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
    gap: 10,
  },
  inlineDetailRow: {
    gap: 3,
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
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
  },
  collapsibleHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  scheduleGrid: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
    gap: 8,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 6,
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
    width: 28,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: globalColors.title,
  },
  scheduleDayToday: {
    fontWeight: "700",
  },
  scheduleValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    lineHeight: 22,
    color: globalColors.title,
  },
  scheduleValueToday: {
    fontWeight: "600",
  },
  scheduleValueClosed: {
    color: globalColors.subtitle,
  },
});
