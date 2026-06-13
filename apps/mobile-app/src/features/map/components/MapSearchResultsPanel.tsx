import { globalColors } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type MapSearchResultPlaceholder = {
  id: string;
  title: string;
  subtitle?: string;
  matchedObjectId?: string | null;
};

type Props = {
  query: string;
  results: MapSearchResultPlaceholder[];
  onClose: () => void;
  onSelect: (result: MapSearchResultPlaceholder) => void;
};

/** Плашка результатів пошуку. */
export default function MapSearchResultsPanel({
  query,
  results,
  onClose,
  onSelect,
}: Props) {
  const trimmedQuery = query.trim();
  const emptyText = trimmedQuery
    ? "Нічого не знайдено"
    : "Введіть назву локації або об’єкта";

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Результати</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрити результати пошуку"
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && styles.closeBtnPressed,
          ]}
        >
          <Ionicons name="close" size={20} color={globalColors.icon} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {results.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : null}

        {results.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityHint="Відкрити локацію"
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.row,
              index === 0 && styles.rowFirst,
              pressed && styles.rowPressed,
            ]}
          >
            <Ionicons
              name="location-outline"
              size={20}
              color={globalColors.icon}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={styles.rowSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={globalColors.icon}
              style={styles.rowChevron}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 10,
    maxHeight: 360,
    backgroundColor: globalColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: globalColors.border,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: globalColors.navigationFabShadow,
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: globalColors.border,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: globalColors.subtitle,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
  scroll: {
    maxHeight: 300,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: globalColors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: globalColors.title,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
  rowChevron: {
    marginTop: 12,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 14,
    lineHeight: 20,
    color: globalColors.subtitle,
  },
});
